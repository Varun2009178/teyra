declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event',
      targetId: string,
      config?: {
        page_location?: string
        page_title?: string
        send_page_view?: boolean
        event_category?: string
        event_label?: string
        value?: number
        [key: string]: any
      }
    ) => void
  }
}

export {}