import { AppState } from 'store/types'

export const getStatus = (store: AppState) => store.passwordReset.status
