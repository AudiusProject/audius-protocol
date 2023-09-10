import { AppState } from 'store/types'

const getBaseState = (state: AppState) => state.application.ui.editFolderModal

export const getFolderId = (state: AppState) => {
  return getBaseState(state).folderId
}
