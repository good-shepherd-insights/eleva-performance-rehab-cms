import type { Field } from 'payload'

const rowLabel = (label: string) => ({
  path: '/admin/ArrayRowLabel#default',
  clientProps: { label },
})

const required = (value: boolean) => (value ? { required: true } : {})

export function createBannerField(isRequired = false): Field {
  return {
    name: 'banner', type: 'group', ...required(isRequired), fields: [
      { name: 'backLabel', localized: true, type: 'text', required: true },
      { name: 'centerLabel', localized: true, type: 'text', required: true },
      { name: 'nextLabel', localized: true, type: 'text', required: true },
      { name: 'nextHref', type: 'text', required: true },
    ],
  }
}

export function createMetadataField(options: { isRequired?: boolean; pageTitle?: boolean } = {}): Field {
  return {
    name: 'metadata', type: 'group', ...required(options.isRequired ?? false), fields: [{
      name: 'titleTemplate', localized: true, type: 'text', required: true,
      defaultValue: options.pageTitle ? '{title}' : '{title}',
      ...(options.pageTitle ? { admin: { description: 'Use exactly one {title} placeholder for the localized page title.' } } : {
        admin: { description: 'Use {title} to insert the page title.' },
      }),
    }],
  }
}

export function createHeroField(isRequired = false): Field {
  return {
    name: 'hero', type: 'group', ...required(isRequired), fields: [
      { name: 'kicker', localized: true, type: 'text', required: true },
      { name: 'headline', localized: true, type: 'text', required: true },
      { name: 'subhead', localized: true, type: 'textarea', required: true },
      { name: 'image', type: 'upload', relationTo: 'media', required: true },
      { name: 'imageAlt', localized: true, type: 'text', required: true },
      { name: 'visualCaption', localized: true, type: 'textarea', required: true },
      { name: 'secondaryCtaLabel', localized: true, type: 'text', required: true },
      { name: 'primaryCtaHref', type: 'text', required: true },
      { name: 'secondaryCtaHref', type: 'text', required: true },
    ],
  }
}

export function createProcessField(isRequired = false): Field {
  return {
    name: 'process', type: 'group', ...required(isRequired), fields: [{
      name: 'steps', type: 'array', minRows: 1,
      admin: { components: { RowLabel: rowLabel('Step') } },
      fields: [{ name: 'label', type: 'text', required: true, localized: true }],
    }],
  }
}

export function createHighlightsField(isRequired = false): Field {
  return {
    name: 'highlights', type: 'group', ...required(isRequired), fields: [{
      name: 'items', type: 'array', minRows: 1,
      admin: { components: { RowLabel: rowLabel('Item') } },
      fields: [{ name: 'label', type: 'text', required: true, localized: true }],
    }],
  }
}

export function createContentField(isRequired = false): Field {
  return {
    name: 'content', type: 'group', ...required(isRequired), fields: [
      { name: 'headingTop', localized: true, type: 'text', required: true },
      { name: 'headingBottom', localized: true, type: 'text', required: true },
      { name: 'intro', type: 'textarea', required: true, localized: true },
      {
        name: 'pillars', type: 'array', minRows: 1,
        admin: { components: { RowLabel: rowLabel('Pillar') } },
        fields: [
          { name: 'index', type: 'text', required: true },
          { name: 'title', type: 'text', required: true, localized: true },
          { name: 'body', type: 'textarea', required: true, localized: true },
        ],
      },
    ],
  }
}

export function createMediaFeatureField(isRequired = false): Field {
  return {
    name: 'mediaFeature', type: 'group', ...required(isRequired), fields: [
      { name: 'photo', type: 'upload', relationTo: 'media', required: true },
      { name: 'photoAlt', localized: true, type: 'text', required: true },
      { name: 'kicker', localized: true, type: 'text', required: true },
      { name: 'headingTop', localized: true, type: 'text', required: true },
      { name: 'headingBottom', localized: true, type: 'text', required: true },
      {
        name: 'steps', type: 'array', minRows: 1,
        admin: { components: { RowLabel: rowLabel('Step') } },
        fields: [
          { name: 'number', type: 'text', required: true },
          { name: 'title', type: 'text', required: true, localized: true },
          { name: 'body', type: 'textarea', required: true, localized: true },
        ],
      },
      { name: 'linkLabel', localized: true, type: 'text', required: true },
      { name: 'linkHref', type: 'text', required: true },
    ],
  }
}

export function createItemListField(isRequired = false): Field {
  return {
    name: 'itemList', type: 'group', ...required(isRequired), fields: [
      { name: 'kicker', localized: true, type: 'text', required: true },
      { name: 'heading', localized: true, type: 'text', required: true },
      { name: 'intro', type: 'textarea', required: true, localized: true },
      {
        name: 'items', type: 'array', minRows: 1,
        admin: { components: { RowLabel: rowLabel('Item') } },
        fields: [
          { name: 'title', type: 'text', required: true, localized: true },
          { name: 'detail', type: 'text', required: true, localized: true },
          { name: 'tag', type: 'text', required: true, localized: true },
          { name: 'itemLabel', type: 'text', required: true, localized: true },
          { name: 'viewLabel', type: 'text', required: true, localized: true },
          { name: 'viewAriaLabel', type: 'text', required: true, localized: true },
          { name: 'href', type: 'text', required: true },
        ],
      },
      { name: 'allLabel', localized: true, type: 'text', required: true },
      { name: 'allHref', type: 'text', required: true },
    ],
  }
}

export function createQuoteField(isRequired = false): Field {
  return {
    name: 'quote', type: 'group', ...required(isRequired), fields: [
      { name: 'quote', type: 'textarea', required: true, localized: true },
      { name: 'attribution', type: 'text', required: true, localized: true },
    ],
  }
}

export function createCallToActionField(isRequired = false): Field {
  return {
    name: 'callToAction', type: 'group', ...required(isRequired), fields: [
      { name: 'kicker', localized: true, type: 'text', required: true },
      { name: 'headingTop', localized: true, type: 'text', required: true },
      { name: 'headingBottom', localized: true, type: 'text', required: true },
      { name: 'ctaLabel', localized: true, type: 'text', required: true },
      { name: 'href', type: 'text', required: true },
    ],
  }
}