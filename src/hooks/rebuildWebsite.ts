import type { CollectionAfterChangeHook, GlobalAfterChangeHook } from 'payload'

import { websiteDeployWebhook } from '../config/runtime'

// The website is a static build that reads pages, the site global and the
// global components it references, so publishing any of them must rebuild it.
// Drafts and autosaves don't change the live site and are skipped.
export const rebuildWebsite: CollectionAfterChangeHook & GlobalAfterChangeHook = async ({ doc, req }) => {
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
}
