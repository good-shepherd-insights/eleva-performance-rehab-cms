import type { Payload } from 'payload'

import { siteGlobalSlug } from '../config/runtime'

type Upload = { url?: string | null } | number | string | null | undefined

export type BrandGraphic = { src: string; alt: string }

const uploadURL = (upload: Upload) =>
  upload && typeof upload === 'object' && upload.url ? upload.url : null

// The admin logo and nav icon come from the site global's own brand
// uploads, so each project brands its CMS by uploading media, not by code.
// Returns null when the upload isn't set, and the caller falls back to
// Payload's default graphic.
export async function brandGraphic(payload: Payload, field: 'logo' | 'favicon'): Promise<BrandGraphic | null> {
  const site = await payload.findGlobal({ slug: siteGlobalSlug as never, depth: 1 })
  const brand = (site as { brand?: { logo?: Upload; favicon?: Upload; logoAlt?: string | null } }).brand
  const src = uploadURL(brand?.[field]) ?? (field === 'favicon' ? uploadURL(brand?.logo) : null)
  return src ? { src, alt: brand?.logoAlt ?? '' } : null
}
