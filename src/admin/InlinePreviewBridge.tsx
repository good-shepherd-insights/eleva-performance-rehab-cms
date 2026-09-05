'use client'

import { LivePreviewWindow, useAllFormFields, useForm } from '@payloadcms/ui'
import { useEffect } from 'react'

// The admin half of the click-to-edit bridge: the frontend sends the full
// field path directly and this just dispatches it — no path prefix assumed.
type InlineEditMessage = {
  type?: string
  path?: string
  value?: string
}

export default function InlinePreviewBridge() {
  const [, dispatchFields] = useAllFormFields()
  const { setModified } = useForm()

  useEffect(() => {
    const handleMessage = (event: MessageEvent<InlineEditMessage>) => {
      const message = event.data
      const preview = document.querySelector<HTMLIFrameElement>('#live-preview-iframe')

      if (message?.type !== 'payload-inline-edit') return
      if (preview?.contentWindow && event.source !== preview.contentWindow) return
      if (!message.path || message.value === undefined) return

      dispatchFields({
        type: 'UPDATE',
        path: message.path,
        value: message.value,
      })
      setModified(true)
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [dispatchFields, setModified])

  return <LivePreviewWindow />
}
