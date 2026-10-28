import type { GlobalConfig } from 'payload'

import { inlinePreviewAdmin } from '../admin/livePreviewConfig'
import { siteGlobalSlug } from '../config/runtime'
import { mediaSlug } from '../collections/Media'
import { sectionsSlug } from '../collections/Sections'

const slug = siteGlobalSlug

const brand = {
  name: 'brand', type: 'group' as const, fields: [
    { name: 'logo', type: 'upload' as const, relationTo: mediaSlug, required: false },
    { name: 'logoAlt', localized: true, type: 'text' as const, required: false },
    { name: 'favicon', type: 'upload' as const, relationTo: mediaSlug, required: false, admin: { description: 'Browser tab and app icon for the public website.' } },
  ],
}

export const SiteGlobals: GlobalConfig = {
  slug, label: 'Site Globals', access: { read: () => true },
  versions: { drafts: { autosave: { interval: 800 } } },
  admin: {
    group: 'Pages',
    ...inlinePreviewAdmin,
  },
  fields: [{
    type: 'tabs',
    tabs: [
      { label: 'Site Globals', fields: [
        brand,
        {
          name: 'components', type: 'array', minRows: 0, labels: { singular: 'Global component', plural: 'Global components' },
          fields: [
            {
              name: 'component', type: 'relationship', relationTo: sectionsSlug, required: true,
              admin: { description: 'A reusable component document; its sections render globally on every page, in this order.' },
            },
          ],
        },
      ] },
    ],
  }],
}