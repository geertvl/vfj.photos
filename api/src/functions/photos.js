const { app } = require('@azure/functions')
const {
  BlobServiceClient,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
} = require('@azure/storage-blob')
const { DefaultAzureCredential } = require('@azure/identity')
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
  const authHeader = request.headers.get('authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)
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
    if (!verifyToken(request)) {
      return { status: 401, jsonBody: { error: 'Niet geautoriseerd' } }
    }

    const accountName = process.env.STORAGE_ACCOUNT_NAME
    const containerName = process.env.STORAGE_CONTAINER_NAME ?? 'photos'

    if (!accountName) {
      context.error('STORAGE_ACCOUNT_NAME not set')
      return { status: 500, jsonBody: { error: 'Serverconfiguratiefout' } }
    }

    try {
      const credential = new DefaultAzureCredential()
      const blobServiceClient = new BlobServiceClient(
        `https://${accountName}.blob.core.windows.net`,
        credential
      )
      const containerClient = blobServiceClient.getContainerClient(containerName)

      // User delegation key valid for 25 hours (5-minute buffer at start)
      const startsOn = new Date()
      startsOn.setMinutes(startsOn.getMinutes() - 5)
      const expiresOn = new Date()
      expiresOn.setHours(expiresOn.getHours() + 25)
      const userDelegationKey = await blobServiceClient.getUserDelegationKey(
        startsOn,
        expiresOn
      )

      const categories = []

      for (const category of CATEGORIES) {
        const photos = []
        for await (const blob of containerClient.listBlobsFlat({
          prefix: category.prefix,
        })) {
          if (!/\.(jpe?g|png|gif|webp)$/i.test(blob.name)) continue

          const filename = blob.name.split('/').pop()
          const sasToken = generateBlobSASQueryParameters(
            {
              containerName,
              blobName: blob.name,
              permissions: BlobSASPermissions.parse('r'),
              startsOn,
              expiresOn,
              contentDisposition: `attachment; filename="${filename}"`,
            },
            userDelegationKey,
            accountName
          ).toString()

          photos.push({
            id: blob.name,
            filename,
            url: `https://${accountName}.blob.core.windows.net/${containerName}/${blob.name}?${sasToken}`,
          })
        }

        categories.push({
          id: category.id,
          name: category.name,
          icon: category.icon,
          photos,
        })
      }

      return { status: 200, jsonBody: { categories } }
    } catch (err) {
      context.error('Error fetching photos:', err)
      return { status: 500, jsonBody: { error: 'Fout bij ophalen van foto\'s' } }
    }
  },
})
