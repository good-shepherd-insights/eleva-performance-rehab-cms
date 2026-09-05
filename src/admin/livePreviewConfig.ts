const inlineEditBridgeEnabled = process.env.ENABLE_INLINE_EDIT_BRIDGE === 'true'

export const inlinePreviewAdmin = inlineEditBridgeEnabled
  ? {
      components: {
        views: {
          edit: {
            livePreview: {
              Component: '/admin/InlinePreviewBridge#default',
            },
          },
        },
      },
    }
  : {}
