import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'name',
    group: 'Admin',
  },
  auth: true,
  fields: [
    { name: 'name', type: 'text' },
  ],
}