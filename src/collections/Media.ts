import type { CollectionConfig } from 'payload'

export const mediaSlug = 'media' as const

export const Media: CollectionConfig = {
  slug: mediaSlug,
  admin: {
    group: 'Content',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  upload: true,
}
