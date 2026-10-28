type LocaleConfig = {
  code: string
  label: string
  rtl?: boolean
}

function requiredEnv(name: string) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

function requiredOrigin(name: string) {
  const value = requiredEnv(name)
  const url = new URL(value)
  if (url.pathname !== '/' || url.search || url.hash) {
    throw new Error(`${name} must be an origin without a path, query, or hash`)
  }
  return url.origin
}

function configuredLocales(): LocaleConfig[] {
  const raw = requiredEnv('CMS_LOCALES')
  let value: unknown

  try {
    value = JSON.parse(raw)
  } catch {
    throw new Error('CMS_LOCALES must be a JSON array of locale objects')
  }

  if (!Array.isArray(value) || value.length === 0) {
    throw new Error('CMS_LOCALES must contain at least one locale object')
  }

  const locales = value.map((entry) => {
    if (!entry || typeof entry !== 'object') {
      throw new Error('CMS_LOCALES entries require non-empty code and label strings and an optional rtl boolean')
    }

    const locale = entry as Partial<LocaleConfig>

    if (
      typeof locale.code !== 'string' ||
      !locale.code.trim() ||
      typeof locale.label !== 'string' ||
      !locale.label.trim() ||
      (locale.rtl !== undefined && typeof locale.rtl !== 'boolean')
    ) {
      throw new Error('CMS_LOCALES entries require non-empty code and label strings and an optional rtl boolean')
    }

    return {
      code: locale.code.trim(),
      label: locale.label.trim(),
      ...(locale.rtl === true ? { rtl: true } : {}),
    }
  })

  if (new Set(locales.map((locale) => locale.code)).size !== locales.length) {
    throw new Error('CMS_LOCALES locale codes must be unique')
  }

  return locales
}

export const cmsOrigin = requiredOrigin('CMS_ORIGIN')
export const siteOrigin = requiredOrigin('SITE_ORIGIN')
export const siteGlobalSlug = requiredEnv('SITE_GLOBAL_SLUG')
export const locales = configuredLocales()
export const defaultLocale = requiredEnv('CMS_DEFAULT_LOCALE')
export const websiteDeployWebhook = process.env.WEBSITE_DEPLOY_WEBHOOK_URL?.trim()

if (!locales.some((locale) => locale.code === defaultLocale)) {
  throw new Error('CMS_DEFAULT_LOCALE must match a CMS_LOCALES code')
}

export const payloadSecret = requiredEnv('PAYLOAD_SECRET')
export const mongodbUrl = requiredEnv('MONGODB_URL')
export const blobReadWriteToken = requiredEnv('BLOB_READ_WRITE_TOKEN')
