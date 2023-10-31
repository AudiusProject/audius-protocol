export const TRACK_OPENED = 'MODALS/TRACK_OPENED'
export const TRACK_CLOSED = 'MODALS/TRACK_CLOSED'

export const trackModalOpened = (
  reducerPath: string,
  trackingData?: Record<string, any>
) => {
  return {
    type: TRACK_OPENED,
    reducerPath,
    trackingData
  }
}

export const trackModalClosed = (reducerPath: string) => {
  return {
    type: TRACK_CLOSED,
    reducerPath
  }
}
