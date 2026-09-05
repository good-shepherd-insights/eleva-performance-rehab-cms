import type { GlobalConfig } from 'payload'

import { inlinePreviewAdmin } from '../admin/livePreviewConfig'
import { siteGlobalSlug } from '../config/runtime'

const slug = siteGlobalSlug
const rowLabel = (label: string) => ({ path: '/admin/ArrayRowLabel#default', clientProps: { label } })
const brand = {
  name: 'brand', type: 'group' as const, fields: [
    { name: 'logo', type: 'upload' as const, relationTo: 'media' as const, required: true },
    { name: 'logoAlt', localized: true, type: 'text' as const, required: true },
    { name: 'favicon', type: 'upload' as const, relationTo: 'media' as const, required: true, admin: { description: 'Browser tab and app icon for the public website.' } },
  ],
}

const nav = {
  name: 'nav', type: 'group' as const, fields: [{
    name: 'items', type: 'array' as const, minRows: 0,
    admin: { components: { RowLabel: rowLabel('Navigation item') } },
    fields: [
      { name: 'type', type: 'select' as const, required: true, defaultValue: 'link', options: [{ label: 'Link', value: 'link' }, { label: 'CTA', value: 'cta' }] },
      { name: 'label', localized: true, type: 'text' as const, required: true },
      { name: 'href', type: 'text' as const, required: true, admin: { description: 'Use an anchor such as #about or a full URL.' } },
      { name: 'openInNewTab', type: 'checkbox' as const, defaultValue: false },
    ],
  }],
}

const accessibility = {
  name: 'accessibility', type: 'group' as const, fields: [
    { name: 'primaryNavLabel', localized: true, type: 'text' as const, required: true },
    { name: 'heroOverviewLabel', localized: true, type: 'text' as const, required: true },
    { name: 'programSummaryLabel', localized: true, type: 'text' as const, required: true },
    { name: 'homeLinkSuffix', localized: true, type: 'text' as const, required: true },
    { name: 'skipToContentLabel', localized: true, type: 'text' as const, required: true },
    { name: 'menuLabel', localized: true, type: 'text' as const, required: true },
    { name: 'languageSwitchAriaLabelTemplate', localized: true, type: 'text' as const, required: true, admin: { description: "Use {language} to insert the target language's own name." } },
  ],
}

const footer = {
  name: 'footer', type: 'group' as const, fields: [
    { name: 'tagline', type: 'textarea' as const, required: true },
    {
      name: 'links', type: 'array' as const, minRows: 0,
      admin: { components: { RowLabel: rowLabel('Footer link') } },
      fields: [{ name: 'label', localized: true, type: 'text' as const, required: true }, { name: 'href', type: 'text' as const, required: true }],
    },
    { name: 'note', localized: true, type: 'text' as const, required: true },
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
      { label: 'Site Globals', fields: [brand, nav, accessibility, footer] },
    ],
  }],
}
