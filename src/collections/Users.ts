import type { CollectionConfig } from 'payload'

import { passkeyEndpoints, passkeyFields } from '../auth/passkeys'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'name',
    group: 'Admin',
  },
  auth: true,
  endpoints: passkeyEndpoints,
  fields: [
    { name: 'name', type: 'text' },
    ...passkeyFields,
  ],
}