const { app } = require('@azure/functions')
const {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
} = require('@azure/storage-blob')
const jwt = require('jsonwebtoken')

const CATEGORIES = [
  {
    id: 'feest-zaterdag',
    name: 'Feest vrijzinnige jeugd op zaterdag 25/4/2026',
    prefix: 'feest-zaterdag/',
    icon: '🎉',
  },
  {
    id: 'lentefeest-voormiddag',
    name: 'Lentefeest op zondag voormiddag 26/4/2026',
    prefix: 'lentefeest-voormiddag/',
    icon: '🌸',
  },
  {
    id: 'lentefeest-namiddag',
    name: 'Lentefeest op zondag namiddag 26/4/2026',
    prefix: 'lentefeest-namiddag/',
    icon: '☀️',
  },
]

function verifyToken(request) {
  const token = request.headers.get('x-gallery-token') ?? ''
  if (!token) return null
  try {
    return jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    return null
  }
}

app.http('photos', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'photos',
  handler: async (request, context) => {
    const payload = verifyToken(request)
    if (!payload) {
      return { status: 401, jsonBody: { error: 'Niet geautoriseerd' } }
    }

    // Find the single category this parent is allowed to see
    const category = CATEGORIES.find((c) => c.id === payload.event)
    if (!category) {
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

      const startsOn = new Date()
      startsOn.setMinutes(startsOn.getMinutes() - 5)
      const expiresOn = new Date()
      expiresOn.setHours(expiresOn.getHours() + 25)

      const photos = []
      for await (const blob of containerClient.listBlobsFlat({ prefix: category.prefix })) {
        if (!/\.(jpe?g|png|gif|webp)$/i.test(blob.name)) continue

        const filename = blob.name.split('/').pop()

        const makeSas = (blobName, withDisposition = false) =>
          generateBlobSASQueryParameters(
            {
              containerName,
              blobName,
              permissions: BlobSASPermissions.parse('r'),
              startsOn,
              expiresOn,
              ...(withDisposition && { contentDisposition: `attachment; filename="${filename}"` }),
            },
            credential
          ).toString()

        const sasToken      = makeSas(blob.name, true)
        const thumbBlobName = `thumbnails/${blob.name}`
        const thumbSasToken = makeSas(thumbBlobName)

        photos.push({
          id: blob.name,
          filename,
          url:          `https://${accountName}.blob.core.windows.net/${containerName}/${blob.name}?${sasToken}`,
          thumbnailUrl: `https://${accountName}.blob.core.windows.net/${containerName}/${thumbBlobName}?${thumbSasToken}`,
        })
      }

      return {
        status: 200,
        jsonBody: {
          categories: [
            {
              id: category.id,
              name: category.name,
              icon: category.icon,
              photos,
            },
          ],
        },
      }
    } catch (err) {
      context.error('Error fetching photos:', err)
      return { status: 500, jsonBody: { error: "Fout bij ophalen van foto's" } }
    }
  },
})
