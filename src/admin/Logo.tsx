import type { Payload } from 'payload'
import { PayloadLogo } from '@payloadcms/ui/shared'

import { brandGraphic } from './brandGraphic'

// Login-screen logo: the site global's brand.logo, or Payload's default.
export default async function Logo({ payload }: { payload: Payload }) {
  const graphic = await brandGraphic(payload, 'logo')
  if (!graphic) return <PayloadLogo />

  return (
    <img
      src={graphic.src}
      alt={graphic.alt}
      style={{ display: 'block', maxHeight: '144px', maxWidth: '100%', width: 'auto', margin: '0 auto' }}
    />
  )
}
