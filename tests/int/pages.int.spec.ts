import { describe, expect, it, vi } from 'vitest'

import { Pages } from '../../src/collections/Pages'

const beforeOperation = Pages.hooks?.beforeOperation?.[0]
const beforeValidate = Pages.hooks?.beforeValidate?.[0]

async function validatePage({
  ctaCount,
  draft,
  operation,
}: {
  ctaCount: number
  draft: boolean
  operation: 'create' | 'update'
}) {
  const context: Record<string, unknown> = {}
  const findGlobal = vi.fn().mockResolvedValue({
    nav: { items: Array.from({ length: ctaCount }, () => ({ type: 'cta' })) },
  })
  const req = { context, query: {}, payload: { findGlobal } }

  if (typeof beforeOperation !== 'function' || typeof beforeValidate !== 'function') {
    throw new Error('Pages publish hooks are required')
  }

  await beforeOperation({ args: { draft, req }, context, operation } as never)
  await beforeValidate({ data: { _status: 'draft' }, context, req } as never)

  return findGlobal
}

function registerOperationTests(operation: 'create' | 'update') {
  it(`checks the CTA invariant for published ${operation} operations`, async () => {
    await expect(validatePage({ ctaCount: 0, draft: false, operation })).rejects.toThrow('exactly one CTA')
    await expect(validatePage({ ctaCount: 2, draft: false, operation })).rejects.toThrow('exactly one CTA')
  })

  it(`does not trust submitted draft status for ${operation}`, async () => {
    await expect(validatePage({ ctaCount: 1, draft: false, operation })).resolves.toBeDefined()
  })

  it(`skips the CTA invariant for draft ${operation} operations`, async () => {
    const findGlobal = await validatePage({ ctaCount: 0, draft: true, operation })
    expect(findGlobal).not.toHaveBeenCalled()
  })
}

describe('Pages publish guard', () => {
  registerOperationTests('create')
  registerOperationTests('update')
})
