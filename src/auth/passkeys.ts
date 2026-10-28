import { createHmac, randomBytes, randomUUID, timingSafeEqual } from 'crypto'
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type RegistrationResponseJSON,
} from '@simplewebauthn/server'
import { isoBase64URL, isoUint8Array } from '@simplewebauthn/server/helpers'
import { checkLoginPermission, getFieldsToSign, jwtSign } from 'payload'
import type { Endpoint, Field, PayloadRequest, SanitizedCollectionConfig } from 'payload'
import { generatePayloadCookie, parseCookies } from 'payload/shared'

import { cmsOrigin } from '../config/runtime'

// Passkey (WebAuthn) sign-in for the users collection. A passkey only
// replaces the password check: once verified, the user gets the exact same
// Payload session a password login creates (session entry, JWT, cookie), so
// logout, expiry and access control are unchanged. Password login stays.

// The relying party is the CMS host itself; its hostname doubles as the
// display name the browser shows in the passkey prompt.
const rpID = new URL(cmsOrigin).hostname
const rpName = rpID
const challengeSeconds = 300

type StoredPasskey = {
  id?: string
  credentialID: string
  publicKey: string
  counter: number
  transports?: string[] | null
  label?: string | null
  addedAt?: string | null
}

type UserDoc = {
  id: string | number
  email: string
  passkeys?: StoredPasskey[] | null
  sessions?: { id: string; createdAt: Date | string; expiresAt: Date | string }[] | null
  lockUntil?: string | null
  _verified?: boolean | null
  [key: string]: unknown
}

export const passkeyFields: Field[] = [
  {
    // Never returned by the API (hidden) and never writable through it;
    // only the endpoints below read or change it, via the database adapter.
    name: 'passkeys',
    type: 'array',
    hidden: true,
    access: {
      create: () => false,
      update: () => false,
    },
    fields: [
      { name: 'credentialID', type: 'text', required: true, index: true },
      { name: 'publicKey', type: 'text', required: true },
      { name: 'counter', type: 'number', required: true },
      { name: 'transports', type: 'text', hasMany: true },
      { name: 'label', type: 'text' },
      { name: 'addedAt', type: 'date' },
    ],
  },
  {
    name: 'passkeyManager',
    type: 'ui',
    admin: {
      components: {
        Field: '/admin/PasskeyManager#default',
      },
    },
  },
]

// --- challenge cookie -------------------------------------------------------
// The challenge travels in a short-lived HMAC-signed cookie instead of the
// database, so nothing temporary is stored.

type Challenge = { challenge: string; purpose: 'login' | 'register'; userID?: string; expires: number }

const challengeCookieName = (req: PayloadRequest) => `${req.payload.config.cookiePrefix}-passkey-challenge`

const sign = (req: PayloadRequest, value: string) =>
  createHmac('sha256', req.payload.secret).update(value).digest('base64url')

function challengeCookie(req: PayloadRequest, challenge: Challenge | null) {
  const value = challenge ? isoBase64URL.fromUTF8String(JSON.stringify(challenge)) : ''
  const signed = challenge ? `${value}.${sign(req, value)}` : ''
  const secure = cmsOrigin.startsWith('https:') ? '; Secure' : ''
  const maxAge = challenge ? challengeSeconds : 0
  return `${challengeCookieName(req)}=${signed}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`
}

function readChallenge(req: PayloadRequest, purpose: Challenge['purpose']): Challenge | null {
  const raw = parseCookies(req.headers).get(challengeCookieName(req))
  if (!raw) return null
  const [value, signature] = raw.split('.')
  if (!value || !signature) return null
  const expected = Buffer.from(sign(req, value))
  const actual = Buffer.from(signature)
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null
  const challenge = JSON.parse(isoBase64URL.toUTF8String(value)) as Challenge
  if (challenge.purpose !== purpose || challenge.expires < Date.now()) return null
  return challenge
}

// --- helpers ----------------------------------------------------------------

const error = (message: string, status: number, headers?: Headers) =>
  Response.json({ message }, { status, headers })

// Browsers always send Origin on these POSTs; reject anything not from the
// CMS itself so another site can't drive the endpoints with a user's cookie.
const fromCMS = (req: PayloadRequest) => req.headers.get('origin') === cmsOrigin

const usersCollection = (req: PayloadRequest): SanitizedCollectionConfig =>
  req.payload.collections.users.config

async function findUser(req: PayloadRequest, where: Record<string, unknown>) {
  return (await req.payload.db.findOne({ collection: 'users', req, where: where as never })) as UserDoc | null
}

const currentUser = (req: PayloadRequest) =>
  req.user && req.user.collection === 'users' ? (req.user as unknown as UserDoc) : null

async function readBody<T>(req: PayloadRequest): Promise<T | null> {
  try {
    return (await req.json?.()) as T
  } catch {
    return null
  }
}

// --- endpoints (mounted under /api/users) -----------------------------------

const registerOptions: Endpoint = {
  path: '/passkey/register/options',
  method: 'post',
  handler: async (req) => {
    const user = currentUser(req)
    if (!fromCMS(req)) return error('Forbidden', 403)
    if (!user) return error('You must be logged in to add a passkey.', 401)

    const stored = await findUser(req, { id: { equals: user.id } })
    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userName: user.email,
      userID: isoUint8Array.fromUTF8String(String(user.id)),
      attestationType: 'none',
      excludeCredentials: (stored?.passkeys ?? []).map((p) => ({
        id: p.credentialID,
        transports: p.transports ?? undefined,
      })),
      authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
    })

    const headers = new Headers()
    headers.append(
      'Set-Cookie',
      challengeCookie(req, {
        challenge: options.challenge,
        purpose: 'register',
        userID: String(user.id),
        expires: Date.now() + challengeSeconds * 1000,
      }),
    )
    return Response.json(options, { headers })
  },
}

const registerVerify: Endpoint = {
  path: '/passkey/register/verify',
  method: 'post',
  handler: async (req) => {
    const user = currentUser(req)
    const clear = new Headers({ 'Set-Cookie': challengeCookie(req, null) })
    if (!fromCMS(req)) return error('Forbidden', 403, clear)
    if (!user) return error('You must be logged in to add a passkey.', 401, clear)

    const challenge = readChallenge(req, 'register')
    if (!challenge || challenge.userID !== String(user.id)) {
      return error('The passkey request expired. Try again.', 400, clear)
    }
    const body = await readBody<{ response: RegistrationResponseJSON; label?: string }>(req)
    if (!body?.response) return error('Missing passkey response.', 400, clear)

    let verification
    try {
      verification = await verifyRegistrationResponse({
        response: body.response,
        expectedChallenge: challenge.challenge,
        expectedOrigin: cmsOrigin,
        expectedRPID: rpID,
        requireUserVerification: true,
      })
    } catch {
      return error('The passkey could not be verified.', 400, clear)
    }
    if (!verification.verified) return error('The passkey could not be verified.', 400, clear)

    const { credential } = verification.registrationInfo
    const stored = await findUser(req, { id: { equals: user.id } })
    const passkeys = stored?.passkeys ?? []
    if (passkeys.some((p) => p.credentialID === credential.id)) {
      return error('This passkey is already registered.', 409, clear)
    }
    const label = typeof body.label === 'string' ? body.label.trim().slice(0, 80) : ''
    passkeys.push({
      // Writes go through the database adapter, which (unlike the Local API)
      // doesn't assign array row IDs; use the same 24-hex shape Payload does.
      id: randomBytes(12).toString('hex'),
      credentialID: credential.id,
      publicKey: isoBase64URL.fromBuffer(credential.publicKey),
      counter: credential.counter,
      transports: credential.transports ?? [],
      label: label || null,
      addedAt: new Date().toISOString(),
    })
    await req.payload.db.updateOne({ id: user.id, collection: 'users', data: { passkeys }, req, returning: false })
    return Response.json({ ok: true }, { headers: clear })
  },
}

const loginOptions: Endpoint = {
  path: '/passkey/login/options',
  method: 'post',
  handler: async (req) => {
    if (!fromCMS(req)) return error('Forbidden', 403)
    // No allowCredentials: the browser offers any passkey saved for this
    // site (discoverable credentials), so no email has to be typed first.
    const options = await generateAuthenticationOptions({ rpID, userVerification: 'required' })
    const headers = new Headers()
    headers.append(
      'Set-Cookie',
      challengeCookie(req, {
        challenge: options.challenge,
        purpose: 'login',
        expires: Date.now() + challengeSeconds * 1000,
      }),
    )
    return Response.json(options, { headers })
  },
}

const loginVerify: Endpoint = {
  path: '/passkey/login/verify',
  method: 'post',
  handler: async (req) => {
    const headers = new Headers({ 'Set-Cookie': challengeCookie(req, null) })
    const rejected = () => error('That passkey could not be used to sign in.', 401, headers)
    if (!fromCMS(req)) return error('Forbidden', 403, headers)

    const challenge = readChallenge(req, 'login')
    if (!challenge) return error('The passkey request expired. Try again.', 400, headers)
    const body = await readBody<{ response: AuthenticationResponseJSON }>(req)
    const response = body?.response
    if (!response?.id) return error('Missing passkey response.', 400, headers)

    const user = await findUser(req, { 'passkeys.credentialID': { equals: response.id } })
    const passkey = user?.passkeys?.find((p) => p.credentialID === response.id)
    if (!user || !passkey) return rejected()
    // The authenticator reports which account the passkey belongs to; it
    // must be the account the credential is stored on.
    const userHandle = response.response.userHandle
    if (userHandle && isoBase64URL.toUTF8String(userHandle) !== String(user.id)) return rejected()

    let verification
    try {
      verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge: challenge.challenge,
        expectedOrigin: cmsOrigin,
        expectedRPID: rpID,
        requireUserVerification: true,
        credential: {
          id: passkey.credentialID,
          publicKey: isoBase64URL.toBuffer(passkey.publicKey),
          counter: passkey.counter,
          transports: passkey.transports ?? undefined,
        },
      })
    } catch {
      return rejected()
    }
    if (!verification.verified) return rejected()

    const collectionConfig = usersCollection(req)
    const auth = collectionConfig.auth
    try {
      checkLoginPermission({ req, user: user as never })
    } catch {
      return error('This account is locked. Try again later.', 401, headers)
    }
    if (auth.verify && !user._verified) return rejected()

    // Same session bookkeeping as Payload's own login operation
    // (payload/dist/auth/sessions.js addSessionToUser, not exported).
    const now = new Date()
    let sid: string | undefined
    const data: Record<string, unknown> = {
      passkeys: user.passkeys!.map((p) =>
        p.credentialID === passkey.credentialID ? { ...p, counter: verification.authenticationInfo.newCounter } : p,
      ),
    }
    if (auth.useSessions) {
      sid = randomUUID()
      data.sessions = [
        ...(user.sessions ?? []).filter((s) => new Date(s.expiresAt) > now),
        { id: sid, createdAt: now, expiresAt: new Date(now.getTime() + auth.tokenExpiration * 1000) },
      ]
    }
    await req.payload.db.updateOne({ id: user.id, collection: 'users', data, req, returning: false })

    const { token, exp } = await jwtSign({
      fieldsToSign: getFieldsToSign({
        collectionConfig,
        email: user.email,
        sid,
        user: { ...user, collection: 'users' } as never,
      }),
      secret: req.payload.secret,
      tokenExpiration: auth.tokenExpiration,
    })
    headers.append(
      'Set-Cookie',
      generatePayloadCookie({ collectionAuthConfig: auth, cookiePrefix: req.payload.config.cookiePrefix, token }),
    )
    return Response.json({ exp }, { headers })
  },
}

const listPasskeys: Endpoint = {
  path: '/passkey/list',
  method: 'get',
  handler: async (req) => {
    const user = currentUser(req)
    if (!user) return error('Unauthorized', 401)
    const stored = await findUser(req, { id: { equals: user.id } })
    return Response.json(
      // The credential ID identifies a passkey uniquely and isn't secret.
      (stored?.passkeys ?? []).map((p) => ({ id: p.credentialID, label: p.label ?? null, addedAt: p.addedAt ?? null })),
    )
  },
}

const removePasskey: Endpoint = {
  path: '/passkey/remove',
  method: 'post',
  handler: async (req) => {
    const user = currentUser(req)
    if (!fromCMS(req)) return error('Forbidden', 403)
    if (!user) return error('Unauthorized', 401)
    const body = await readBody<{ id?: string }>(req)
    const stored = await findUser(req, { id: { equals: user.id } })
    const passkeys = stored?.passkeys ?? []
    const remaining = passkeys.filter((p) => p.credentialID !== body?.id)
    if (remaining.length === passkeys.length) return error('Passkey not found.', 404)
    await req.payload.db.updateOne({ id: user.id, collection: 'users', data: { passkeys: remaining }, req, returning: false })
    return Response.json({ ok: true })
  },
}

export const passkeyEndpoints: Endpoint[] = [
  registerOptions,
  registerVerify,
  loginOptions,
  loginVerify,
  listPasskeys,
  removePasskey,
]
