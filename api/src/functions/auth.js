const { app } = require('@azure/functions')
const jwt = require('jsonwebtoken')

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

    const storedPassword = process.env.GALLERY_PASSWORD
    const jwtSecret = process.env.JWT_SECRET

    if (!storedPassword || !jwtSecret) {
      context.error('GALLERY_PASSWORD or JWT_SECRET environment variable not set')
      return { status: 500, jsonBody: { error: 'Serverconfiguratiefout' } }
    }

    // Constant-time delay to mitigate brute-force attempts
    await new Promise((r) => setTimeout(r, 400))

    if (password !== storedPassword) {
      return { status: 401, jsonBody: { error: 'Ongeldig wachtwoord' } }
    }

    const token = jwt.sign({ authorized: true }, jwtSecret, { expiresIn: '24h' })
    return { status: 200, jsonBody: { token } }
  },
})
