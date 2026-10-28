import type { CollectionConfig, Field } from 'payload'

import { sharedBlocks } from '@good-shepherd-insights/website-components/payload'

import { inlinePreviewAdmin } from '../admin/livePreviewConfig'
import { sectionsSlug } from './Sections'

import { websiteDeployWebhook } from '../config/runtime'

const reservedSlugs = new Set(['admin', 'api', 'robots.txt'])

function validateSections(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) {
    return 'A Page requires at least one section.'
  }

  if (!value.every((section) => section && typeof section === 'object' && typeof section.blockType === 'string')) {
    return 'Each section requires a blockType.'
  }

  return true
}

function validateTitleTemplate(value: unknown) {
  if (typeof value !== 'string') return 'A title template is required.'

  const placeholders = value.match(/\{[^}]+\}/g) || []
  const withoutPlaceholders = value.replace(/\{[^}]+\}/g, '')
  if (
    placeholders.length !== 1 ||
    placeholders[0] !== '{title}' ||
    withoutPlaceholders.includes('{') ||
    withoutPlaceholders.includes('}')
  ) {
    return 'Use exactly one {title} placeholder and no other placeholders.'
  }

  return true
}

export function isPageDraftOperation({
  context,
  query,
}: {
  context?: Record<string, unknown>
  query?: Record<string, unknown>
}) {
  return context?.pagesDraftOperation === true || query?.draft === 'true'
}

const metadata: Field = {
  name: 'metadata', type: 'group', required: true, fields: [{
    name: 'titleTemplate', localized: true, type: 'text', required: true,
    defaultValue: '{title}',
    admin: { description: 'Use exactly one {title} placeholder for the localized page title.' },
  }],
}
if (metadata.type === 'group') {
  const titleTemplate = metadata.fields.find((field) => 'name' in field && field.name === 'titleTemplate')
  if (titleTemplate && titleTemplate.type === 'text') titleTemplate.validate = validateTitleTemplate
}

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    group: 'Pages',
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
    ...inlinePreviewAdmin,
  },
  access: {
    read: () => true,
  },
  versions: {
    drafts: true,
  },
  hooks: {
    beforeOperation: [
      ({ args, context, operation }) => {
        if (operation === 'create' || operation === 'update') {
          context.pagesDraftOperation = args.draft === true
        }

        return args
      },
    ],
    beforeValidate: [
      ({ data }) => {
        if (data && typeof data.slug === 'string') {
          data.slug = data.slug.trim().toLowerCase()
        }

        return data
      },
    ],
    afterChange: [
      async ({ doc, req }) => {
        if (doc._status !== 'published') return doc
        if (!websiteDeployWebhook) return doc

        try {
          const response = await fetch(websiteDeployWebhook, { method: 'POST' })
          if (!response.ok) {
            throw new Error(`Website deploy webhook failed with ${response.status} ${response.statusText}`)
          }
        } catch (error) {
          req.payload.logger.error(error instanceof Error ? error.message : 'Website deploy webhook failed')
          throw error
        }

        return doc
      },
    ],
  },
  fields: [
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      validate: (value: unknown) => {
        if (
          typeof value !== 'string' ||
          reservedSlugs.has(value) ||
          !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) ||
          value.length > 80
        ) {
          return 'Use 1–80 lowercase ASCII letters or numbers separated by single hyphens.'
        }
        return true
      },
      admin: {
        description: 'Shared route key. Example: about → /about in the default locale, /<locale>/about otherwise.',
        position: 'sidebar',
      },
    },
    {
      // Unnamed tabs (no `name` here) are a pure admin UI grouping in
      // Payload — fields keep their exact same storage path either way,
      // so moving `metadata` in here is safe: no schema change, no
      // migration, existing data untouched.
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'title',
              type: 'text',
              localized: true,
              required: true,
            },
            {
              name: 'sections',
              type: 'blocks',
              required: true,
              minRows: 1,
              validate: validateSections,
              blocks: [...sharedBlocks],
            },
            {
              name: 'hiddenGlobalComponents',
              type: 'relationship',
              relationTo: sectionsSlug,
              hasMany: true,
              required: false,
              admin: {
                description: 'Global components (from SiteGlobals.components) to hide on this page only.',
              },
            },
          ],
        },
        {
          label: 'SEO',
          fields: [metadata],
        },
      ],
    },
  ],
}