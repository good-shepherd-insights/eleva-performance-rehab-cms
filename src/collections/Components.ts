import type { CollectionConfig } from 'payload'

import { sharedBlocks } from '@good-shepherd-insights/website-components/payload'

import { inlinePreviewAdmin } from '../admin/livePreviewConfig'

const reservedSlugs = new Set(['admin', 'api', 'robots.txt'])

function validateSections(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) {
    return 'A Component requires at least one section.'
  }

  if (!value.every((section) => section && typeof section === 'object' && typeof section.blockType === 'string')) {
    return 'Each section requires a blockType.'
  }

  return true
}

export const Components: CollectionConfig = {
  slug: 'components',
  admin: {
    group: 'Pages',
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
    ...inlinePreviewAdmin,
  },
  access: {
    read: () => true,
  },
  versions: {
    drafts: true,
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
        description: 'Unique key for this reusable component. Referenced by the site global\'s curated components list.',
        position: 'sidebar',
      },
    },
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
  ],
}