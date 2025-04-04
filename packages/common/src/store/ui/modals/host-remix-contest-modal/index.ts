import { ID } from '~/models/Identifiers'

import { createModal } from '../createModal'

export type HostRemixContestModalState = {
  trackId: ID | null
}

const hostRemixContestModal = createModal<HostRemixContestModalState>({
  reducerPath: 'HostRemixContest',
  initialState: {
    isOpen: false,
    trackId: null
  },
  sliceSelector: (state) => state.ui.modals
})

export const {
  hook: useHostRemixContestModal,
  reducer: hostRemixContestModalReducer,
  actions: hostRemixContestModalActions
} = hostRemixContestModal
