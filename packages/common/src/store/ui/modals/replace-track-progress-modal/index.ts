import { createModal } from '../createModal'

export type ReplaceTrackProgressModalState = {
  progress: {
    upload: number
    transcode: number
  }
  error: boolean
}

const replaceTrackProgressModal = createModal<ReplaceTrackProgressModalState>({
  reducerPath: 'ReplaceTrackProgress',
  initialState: {
    isOpen: false,
    progress: {
      upload: 0,
      transcode: 0
    },
    error: false
  },
  sliceSelector: (state) => state.ui.modals
})

export const {
  hook: useReplaceTrackProgressModal,
  reducer: replaceTrackProgressModalReducer,
  actions: replaceTrackProgressModalActions
} = replaceTrackProgressModal
