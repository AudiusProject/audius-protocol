export type AlbumTrackRemoveConfirmationState = {
  confirmCallback: () => void
}

export type AlbumTrackRemoveConfirmationModalState = {
  isOpen: boolean
} & AlbumTrackRemoveConfirmationState
