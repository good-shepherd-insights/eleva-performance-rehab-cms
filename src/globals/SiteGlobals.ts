import type { GlobalConfig } from 'payload'

import { inlinePreviewAdmin } from '../admin/livePreviewConfig'
import { siteGlobalSlug } from '../config/runtime'

const slug = siteGlobalSlug

function validateComponents(value: unknown) {
  if (!Array.isArray(value)) {
    return true
  }

  if (!value.every((component) => component && typeof component === 'object' && typeof component.blockType === 'string')) {
    return 'Each component requires a blockType.'
  }

  return true
}

const brand = {
  name: 'brand', type: 'group' as const, fields: [
    { name: 'logo', type: 'upload' as const, relationTo: 'media' as const, required: true },
    { name: 'logoAlt', localized: true, type: 'text' as const, required: true },
    { name: 'favicon', type: 'upload' as const, relationTo: 'media' as const, required: true, admin: { description: 'Browser tab and app icon for the public website.' } },
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
          name: 'accessibility', type: 'group', fields: [
            { name: 'primaryNavLabel', localized: true, type: 'text', required: true },
            { name: 'homeLinkSuffix', localized: true, type: 'text', required: true },
            { name: 'skipToContentLabel', localized: true, type: 'text', required: true },
            { name: 'menuLabel', localized: true, type: 'text', required: true },
            { name: 'languageSwitchAriaLabelTemplate', localized: true, type: 'text', required: true, admin: { description: "Use {language} to insert the target language's own name." } },
          ],
        },
        {
          name: 'components', type: 'blocks', minRows: 0, validate: validateComponents, blocks: [],
        },
      ] },
    ],
  }],
}