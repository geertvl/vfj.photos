const { app } = require('@azure/functions')
const jwt = require('jsonwebtoken')

// Each event has its own password env var.
// The JWT encodes which event the parent is allowed to see.
const EVENTS = [
  {
    id: 'feest-zaterdag',
    env: 'GALLERY_PASSWORD_FEEST_ZATERDAG',
  },
  {
    id: 'lentefeest-voormiddag',
    env: 'GALLERY_PASSWORD_LENTEFEEST_VOORMIDDAG',
  },
  {
    id: 'lentefeest-namiddag',
    env: 'GALLERY_PASSWORD_LENTEFEEST_NAMIDDAG',
  },
]

app.http('auth', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth',
  handler: async (request, context) => {
    let body
    try {
      body = await request.json()
    } catch {
      return { status: 400, jsonBody: { error: 'Ongeldig verzoek' } }
    }

    const { password } = body ?? {}
    if (!password || typeof password !== 'string') {
      return { status: 400, jsonBody: { error: 'Wachtwoord is verplicht' } }
    }

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      context.error('JWT_SECRET environment variable not set')
      return { status: 500, jsonBody: { error: 'Serverconfiguratiefout' } }
    }

    // Constant-time delay to mitigate brute-force attempts
    await new Promise((r) => setTimeout(r, 400))

    const matched = EVENTS.find((e) => {
      const stored = process.env[e.env]
      return stored && stored === password
    })

    if (!matched) {
      return { status: 401, jsonBody: { error: 'Ongeldig wachtwoord' } }
    }

    const token = jwt.sign({ event: matched.id }, jwtSecret, { expiresIn: '24h' })
    return { status: 200, jsonBody: { token } }
  },
})
