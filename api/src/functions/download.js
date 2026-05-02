const { app } = require('@azure/functions')
const { BlobServiceClient, StorageSharedKeyCredential } = require('@azure/storage-blob')
const jwt = require('jsonwebtoken')
const archiver = require('archiver')

const MAX_PHOTOS = 200

function verifyToken(request) {
  const token = request.headers.get('x-gallery-token') ?? ''
  if (!token) return null
  try {
    return jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    return null
  }
}

function sanitisePath(p) {
  return String(p)
    .replace(/\.\./g, '')
    .replace(/^[/\\]+/, '')
    .replace(/[/\\]+/g, '/')
}

app.http('download', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'download',
  handler: async (request, context) => {
    const payload = verifyToken(request)
    if (!payload) {
      return { status: 401, jsonBody: { error: 'Niet geautoriseerd' } }
    }

    // The allowed folder prefix for this parent
    const allowedPrefix = `${payload.event}/`

    let body
    try {
      body = await request.json()
    } catch {
      return { status: 400, jsonBody: { error: 'Ongeldig verzoek' } }
    }

    const { photos } = body ?? {}
    if (!Array.isArray(photos) || photos.length === 0) {
      return { status: 400, jsonBody: { error: "Geen foto's opgegeven" } }
    }
    if (photos.length > MAX_PHOTOS) {
      return { status: 400, jsonBody: { error: `Maximum ${MAX_PHOTOS} foto's per download` } }
    }

    // Enforce that every requested path belongs to the authenticated event
    const sanitised = photos.map(sanitisePath)
    const forbidden = sanitised.filter((p) => !p.startsWith(allowedPrefix))
    if (forbidden.length > 0) {
      context.warn(`Download blocked: paths outside allowed prefix "${allowedPrefix}":`, forbidden)
      return { status: 403, jsonBody: { error: 'Geen toegang tot deze foto\'s' } }
    }

    const accountName = process.env.STORAGE_ACCOUNT_NAME
    const accountKey = process.env.STORAGE_ACCOUNT_KEY
    const containerName = process.env.STORAGE_CONTAINER_NAME ?? 'photos'

    if (!accountName || !accountKey) {
      context.error('STORAGE_ACCOUNT_NAME or STORAGE_ACCOUNT_KEY not set')
      return { status: 500, jsonBody: { error: 'Serverconfiguratiefout' } }
    }

    try {
      const credential = new StorageSharedKeyCredential(accountName, accountKey)
      const blobServiceClient = new BlobServiceClient(
        `https://${accountName}.blob.core.windows.net`,
        credential
      )
      const containerClient = blobServiceClient.getContainerClient(containerName)

      const archive = archiver('zip', { zlib: { level: 5 } })
      const chunks = []

      const done = new Promise((resolve, reject) => {
        archive.on('data', (chunk) => chunks.push(chunk))
        archive.on('end', resolve)
        archive.on('error', reject)
      })

      for (const blobPath of sanitised) {
        try {
          const blobClient = containerClient.getBlobClient(blobPath)
          const download = await blobClient.download()
          archive.append(download.readableStreamBody, { name: blobPath.split('/').pop() })
        } catch (err) {
          context.warn(`Skipping blob ${blobPath}: ${err.message}`)
        }
      }

      archive.finalize()
      await done

      const zipBuffer = Buffer.concat(chunks)

      return {
        status: 200,
        body: zipBuffer,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': 'attachment; filename="vrijzinnige-feesten-2026.zip"',
          'Content-Length': String(zipBuffer.length),
        },
      }
    } catch (err) {
      context.error('Error creating zip:', err)
      return { status: 500, jsonBody: { error: 'Fout bij aanmaken van zip' } }
    }
  },
})
