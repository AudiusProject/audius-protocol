export const TOGGLE_NOTIFICATION_PANEL =
  'NOTIFICATION/TOGGLE_NOTIFICATION_PANEL'
export const SET_NOTIFICATION_MODAL = 'NOTIFICATION/SET_NOTIFICATION_MODAL'

export const SET_PLAYLIST_UPDATES = 'NOTIFICATION/SET_PLAYLIST_UPDATES'
export const UPDATE_PLAYLIST_VIEW = 'NOTIFICATION/UPDATE_PLAYLIST_VIEW'

export const setNotificationModal = (
  open: boolean,
  notificationId?: string
) => ({
  type: SET_NOTIFICATION_MODAL,
  open,
  notificationId
})

export const toggleNotificationPanel = () => ({
  type: TOGGLE_NOTIFICATION_PANEL
})

export const setPlaylistUpdates = (playlistUpdates: number[]) => ({
  type: SET_PLAYLIST_UPDATES,
  playlistUpdates
})

export const updatePlaylistLastViewedAt = (playlistId: number) => ({
  type: UPDATE_PLAYLIST_VIEW,
  playlistId
})
