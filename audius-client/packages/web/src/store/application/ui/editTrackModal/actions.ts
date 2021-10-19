import { ID } from 'common/models/Identifiers'

export const OPEN = 'APPLICATION/UI/EDIT_TRACK_MODAL/OPEN'
export const CLOSE = 'APPLICATION/UI/EDIT_TRACK_MODAL/CLOSE'

type OpenAction = { type: typeof OPEN; trackId: ID }
type CloseAction = { type: typeof CLOSE }
export type EditTrackModalActions = OpenAction | CloseAction

export const open = (trackId: ID) => ({ type: OPEN, trackId })
export const close = () => ({ type: CLOSE })
