import type { Payload } from 'payload'
import { PayloadIcon } from '@payloadcms/ui/shared'

import { brandGraphic } from './brandGraphic'

// Nav icon: the site global's brand.favicon (brand.logo if unset), or
// Payload's default. object-fit: contain keeps a wide logo inside Payload's
// small square icon slot instead of overflowing it.
export default async function Icon({ payload }: { payload: Payload }) {
  const graphic = await brandGraphic(payload, 'favicon')
  if (!graphic) return <PayloadIcon />

  return (
    <img
      src={graphic.src}
      alt={graphic.alt}
      style={{ display: 'block', height: '100%', width: '100%', objectFit: 'contain' }}
    />
  )
}
