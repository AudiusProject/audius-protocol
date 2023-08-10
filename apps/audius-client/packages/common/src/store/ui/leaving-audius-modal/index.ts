import { createModal } from '../modals/createModal'

export type LeavingAudiusModalState = {
  link: string
}

const leavingAudiusModal = createModal<LeavingAudiusModalState>({
  reducerPath: 'leavingAudiusModal',
  initialState: {
    isOpen: false,
    link: ''
  },
  sliceSelector: (state) => state.ui.modalsWithState
})

export const {
  hook: useLeavingAudiusModal,
  reducer: leavingAudiusModalReducer
} = leavingAudiusModal
