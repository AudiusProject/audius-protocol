export type UploadConfirmationState = {
  hasPublicTracks: boolean
  confirmCallback: () => void
}

export type UploadConfirmationModalState = {
  isOpen: boolean
} & UploadConfirmationState
