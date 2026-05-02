#!/usr/bin/env node
/**
 * generate-thumbnails.js
 *
 * Reads every photo from the three event folders in Azure Blob Storage,
 * resizes it to max 800 px (longest side), and uploads the result to
 * thumbnails/<event>/<filename>  in the same container.
 *
 * Skips blobs that already have a thumbnail.
 *
 * Usage (from this folder):
 *   npm install
 *   node generate-thumbnails.js
 *
 * Credentials are read from ../api/local.settings.json automatically.
 * You can also override with environment variables:
 *   $env:STORAGE_ACCOUNT_NAME = "vfjphotosq42o1"
 *   $env:STORAGE_ACCOUNT_KEY  = "..."
 *   $env:STORAGE_CONTAINER_NAME = "photos"   (default: photos)
 */

const { BlobServiceClient, StorageSharedKeyCredential } = require('@azure/storage-blob')
const sharp = require('sharp')
const path = require('path')

const THUMBNAIL_MAX_PX = 800      // longest side in pixels
const THUMBNAIL_QUALITY = 82      // JPEG quality
const THUMBNAIL_PREFIX = 'thumbnails/'
const EVENTS = ['feest-zaterdag', 'lentefeest-voormiddag', 'lentefeest-namiddag']

// ─── Credentials ─────────────────────────────────────────────────────────────

function getSettings() {
  if (process.env.STORAGE_ACCOUNT_NAME && process.env.STORAGE_ACCOUNT_KEY) {
    return {
      accountName:   process.env.STORAGE_ACCOUNT_NAME,
      accountKey:    process.env.STORAGE_ACCOUNT_KEY,
      containerName: process.env.STORAGE_CONTAINER_NAME ?? 'photos',
    }
  }

  try {
    const settingsPath = path.resolve(__dirname, '../api/local.settings.json')
    const { Values } = require(settingsPath)
    return {
      accountName:   Values.STORAGE_ACCOUNT_NAME,
      accountKey:    Values.STORAGE_ACCOUNT_KEY,
      containerName: Values.STORAGE_CONTAINER_NAME ?? 'photos',
    }
  } catch {
    console.error(
      'Could not find storage credentials.\n' +
      'Set STORAGE_ACCOUNT_NAME and STORAGE_ACCOUNT_KEY, or ensure api/local.settings.json exists.'
    )
    process.exit(1)
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const { accountName, accountKey, containerName } = getSettings()

  console.log(`Storage account : ${accountName}`)
  console.log(`Container       : ${containerName}`)
  console.log(`Thumbnail size  : max ${THUMBNAIL_MAX_PX}px\n`)

  const credential = new StorageSharedKeyCredential(accountName, accountKey)
  const blobService = new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    credential
  )
  const container = blobService.getContainerClient(containerName)

  let processed = 0, skipped = 0, errors = 0

  for (const event of EVENTS) {
    console.log(`\n📁  ${event}`)
    const prefix = `${event}/`

    for await (const blob of container.listBlobsFlat({ prefix })) {
      if (!/\.(jpe?g|png|webp)$/i.test(blob.name)) continue

      const filename    = blob.name.split('/').pop()
      const thumbPath   = `${THUMBNAIL_PREFIX}${event}/${filename}`
      const thumbClient = container.getBlobClient(thumbPath)

      // Skip if thumbnail already exists
      if (await thumbClient.exists()) {
        process.stdout.write('·')
        skipped++
        continue
      }

      try {
        // Download original
        const download = await container.getBlobClient(blob.name).download()
        const chunks = []
        for await (const chunk of download.readableStreamBody) chunks.push(chunk)
        const original = Buffer.concat(chunks)

        // Resize — keep aspect ratio, never upscale, output progressive JPEG
        const thumbnail = await sharp(original)
          .resize(THUMBNAIL_MAX_PX, THUMBNAIL_MAX_PX, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .jpeg({ quality: THUMBNAIL_QUALITY, progressive: true })
          .toBuffer()

        // Upload thumbnail
        await container.getBlockBlobClient(thumbPath).upload(
          thumbnail,
          thumbnail.length,
          { blobHTTPHeaders: { blobContentType: 'image/jpeg' } }
        )

        const savings = Math.round((1 - thumbnail.length / original.length) * 100)
        process.stdout.write(`+`)
        if (processed % 20 === 19) {
          process.stdout.write(` (${processed + 1} done)\n`)
        }
        processed++
      } catch (err) {
        console.error(`\n  ❌  ${blob.name}: ${err.message}`)
        errors++
      }
    }
  }

  console.log(`\n\n✅  Done!  Generated: ${processed}  |  Already existed: ${skipped}  |  Errors: ${errors}`)
  if (errors > 0) process.exit(1)
}

main()
