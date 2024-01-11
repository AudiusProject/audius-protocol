export type PublishTrackConfirmationState = {
  confirmCallback: () => void
}

export type PublishTrackConfirmationModalState = {
  isOpen: boolean
} & PublishTrackConfirmationState
