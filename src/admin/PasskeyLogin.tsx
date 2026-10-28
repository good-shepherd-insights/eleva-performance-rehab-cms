'use client'

import { Button, useConfig } from '@payloadcms/ui'
import { startAuthentication } from '@simplewebauthn/browser'
import { useState } from 'react'

// "Sign in with a passkey" under Payload's normal login form. The server
// verifies the passkey and sets the regular Payload session cookie, so the
// admin then loads exactly as after a password login.
export default function PasskeyLogin() {
  const { config } = useConfig()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const base = `${config.routes.api}/users/passkey`

  const signIn = async () => {
    setError(null)
    setBusy(true)
    try {
      const optionsRes = await fetch(`${base}/login/options`, { method: 'POST', credentials: 'include' })
      if (!optionsRes.ok) throw new Error((await optionsRes.json()).message)
      const response = await startAuthentication({ optionsJSON: await optionsRes.json() })
      const verifyRes = await fetch(`${base}/login/verify`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response }),
      })
      if (!verifyRes.ok) throw new Error((await verifyRes.json()).message)

      // Honour Payload's ?redirect= like the password form does, same-site only.
      const redirect = new URLSearchParams(window.location.search).get('redirect')
      const safe = redirect && redirect.startsWith('/') && !redirect.startsWith('//')
      window.location.assign(safe ? redirect : config.routes.admin)
    } catch (err) {
      const cancelled = err instanceof Error && err.name === 'NotAllowedError'
      setError(cancelled ? 'Passkey sign-in was cancelled.' : (err as Error).message || 'Passkey sign-in failed.')
      setBusy(false)
    }
  }

  return (
    <div style={{ marginTop: 'var(--base)' }}>
      <Button buttonStyle="secondary" size="large" onClick={signIn} disabled={busy} type="button">
        {busy ? 'Waiting for passkey…' : 'Sign in with a passkey'}
      </Button>
      {error && <p style={{ color: 'var(--theme-error-500)', marginTop: 'calc(var(--base) / 2)' }}>{error}</p>}
    </div>
  )
}
