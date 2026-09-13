import { vercelPostgresAdapter } from '@payloadcms/db-vercel-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { mcpPlugin } from '@payloadcms/plugin-mcp'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Sections } from './collections/Sections'
import { SiteGlobals } from './globals/SiteGlobals'
import { Pages } from './collections/Pages'
import {
  blobReadWriteToken,
  cmsOrigin,
  databasePush,
  defaultLocale,
  locales,
  payloadSecret,
  postgresUrl,
  siteGlobalSlug,
  siteOrigin,
} from './config/runtime'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const siteBaseURL = `${siteOrigin}/`

function getAstroPreviewURL(localeCode: string, slug?: string) {
  let path = `${localeCode}/${encodeURIComponent(slug || '')}`
  if (slug === 'home') path = localeCode === defaultLocale ? '' : `${localeCode}/`

  return new URL(path, siteBaseURL).toString()
}

export default buildConfig({
  endpoints: [
    {
      path: '/locales',
      method: 'get',
      handler: async (req) => {
        const localization = req.payload.config.localization
        return Response.json({
          locales: localization ? localization.locales : [],
          defaultLocale: localization ? localization.defaultLocale : undefined,
        })
      },
    },
  ],
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    livePreview: {
      url: ({ collectionConfig, data, locale }) => {
        if (collectionConfig?.slug === Pages.slug && typeof data.slug === 'string') {
          return getAstroPreviewURL(locale.code, data.slug)
        }

        return siteOrigin
      },
      globals: [siteGlobalSlug],
      collections: [Pages.slug, Sections.slug],
      breakpoints: [
        { name: 'mobile', label: 'Mobile', width: 400, height: 900 },
        { name: 'tablet', label: 'Tablet', width: 900, height: 1000 },
        { name: 'desktop', label: 'Desktop', width: 1440, height: 1000 },
      ],
    },
  },
  collections: [Users, Media, Sections, Pages],
  globals: [SiteGlobals],
  editor: lexicalEditor(),
  localization: {
    locales,
    defaultLocale,
  },
  serverURL: cmsOrigin,
  cors: [siteOrigin, cmsOrigin],
  // Setting a custom csrf list requires including Payload's own origin too —
  // it's not trusted automatically once you customize this array. Without
  // it, the admin panel's own same-origin requests (e.g. "Publish changes")
  // fail cookie auth and get "You are not allowed to perform this action."
  csrf: [siteOrigin, cmsOrigin],
  secret: payloadSecret,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: vercelPostgresAdapter({
    pool: {
      connectionString: postgresUrl,
    },
    push: databasePush,
  }),
  sharp,
  plugins: [
    vercelBlobStorage({
      collections: {
        [Media.slug]: true,
      },
      token: blobReadWriteToken,
    }),
    mcpPlugin({
      collections: {
        [Pages.slug]: {
          enabled: {
            create: true,
            find: true,
            update: true,
          },
          description: 'Page content and reusable sections served by the website.',
        },
      },
      globals: {
        [siteGlobalSlug]: {
          enabled: {
            find: true,
            update: true,
          },
          description:
            'Shared site globals. Homepage and page content are managed through the Pages collection.',
        },
      },
    }),
  ],
})
