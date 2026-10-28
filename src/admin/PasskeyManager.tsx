'use client'

import { Button, useAuth, useConfig, useDocumentInfo } from '@payloadcms/ui'
import { startRegistration } from '@simplewebauthn/browser'
import { useEffect, useState } from 'react'

type Passkey = { id: string; label: string | null; addedAt: string | null }

// Passkey list on the user's own account screen. Passkeys always attach to
// the logged-in user, so the panel only renders on that user's own document.
export default function PasskeyManager() {
  const { config } = useConfig()
  const { user } = useAuth()
  const { id } = useDocumentInfo()
  const [passkeys, setPasskeys] = useState<Passkey[]>([])
  const [label, setLabel] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const base = `${config.routes.api}/users/passkey`
  const isOwnAccount = Boolean(user && id && String(user.id) === String(id))

  const [version, setVersion] = useState(0)
  const reload = () => setVersion((v) => v + 1)

  useEffect(() => {
    if (!isOwnAccount) return
    let active = true
    fetch(`${base}/list`, { credentials: 'include' })
      .then((res) => (res.ok ? (res.json() as Promise<Passkey[]>) : null))
      .then((list) => {
        if (active && list) setPasskeys(list)
      })
    return () => {
      active = false
    }
  }, [isOwnAccount, base, version])

  if (!isOwnAccount) return null

  const add = async () => {
    setMessage(null)
    setBusy(true)
    try {
      const optionsRes = await fetch(`${base}/register/options`, { method: 'POST', credentials: 'include' })
      if (!optionsRes.ok) throw new Error((await optionsRes.json()).message)
      const response = await startRegistration({ optionsJSON: await optionsRes.json() })
      const verifyRes = await fetch(`${base}/register/verify`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response, label }),
      })
      if (!verifyRes.ok) throw new Error((await verifyRes.json()).message)
      setLabel('')
      setMessage('Passkey added.')
      reload()
    } catch (err) {
      const cancelled = err instanceof Error && err.name === 'NotAllowedError'
      setMessage(cancelled ? 'Adding the passkey was cancelled.' : (err as Error).message || 'Could not add the passkey.')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (passkeyID: string) => {
    setMessage(null)
    const res = await fetch(`${base}/remove`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: passkeyID }),
    })
    if (!res.ok) setMessage((await res.json()).message)
    reload()
  }

  return (
    <div className="field-type" style={{ marginBottom: 'var(--spacing-field)' }}>
      <label className="field-label">Passkeys</label>
      {passkeys.length === 0 && <p>No passkeys yet.</p>}
      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 var(--base)' }}>
        {passkeys.map((p) => (
          <li key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--base)' }}>
            <span>
              {p.label || 'Passkey'}
              {p.addedAt && ` · added ${new Date(p.addedAt).toLocaleDateString()}`}
            </span>
            <Button buttonStyle="secondary" size="small" type="button" onClick={() => remove(p.id)}>
              Remove
            </Button>
          </li>
        ))}
      </ul>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--base)' }}>
        <input
          type="text"
          value={label}
          maxLength={80}
          placeholder="Device name (optional)"
          onChange={(e) => setLabel(e.target.value)}
          style={{ padding: 'calc(var(--base) / 2)' }}
        />
        <Button buttonStyle="primary" size="small" type="button" onClick={add} disabled={busy}>
          {busy ? 'Waiting for passkey…' : 'Add a passkey'}
        </Button>
      </div>
      {message && <p style={{ marginTop: 'calc(var(--base) / 2)' }}>{message}</p>}
    </div>
  )
}
