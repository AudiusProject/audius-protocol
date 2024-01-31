import { CommonState } from '~/store/reducers'

export const getToasts = (state: CommonState) => state.ui.toast.toasts
