import { CommonState } from '~/store/commonStore'

export const getIsOpen = (state: CommonState) => state.ui.nowPlaying.isOpen
