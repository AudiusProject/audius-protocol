import { createModal } from '../createModal'

export type LeavingAudiusModalState = {
  link: string
}

const leavingAudiusModal = createModal<LeavingAudiusModalState>({
  reducerPath: 'LeavingAudiusModal',
  initialState: {
    isOpen: false,
    link: ''
  },
  sliceSelector: (state) => state.ui.modals
})

export const {
  hook: useLeavingAudiusModal,
  reducer: leavingAudiusModalReducer
} = leavingAudiusModal
