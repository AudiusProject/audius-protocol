const PREFIX = 'GOOGLE_CAST'
const makeConst = (name: string) => `${PREFIX}/${name}`
export const SHOW_CAST_PICKER = makeConst('SHOW_CAST_PICKER')
export const UPDATE_STATUS = makeConst('UPDATE_STATUS')
export const SET_PLAY_POSITION = makeConst('SET_PLAY_POSITION')

export enum CastStatus {
  NoDevicesAvailable = 'NoDevicesAvailable',
  NotConnected = 'NotConnected',
  Connecting = 'Connecting',
  Connected = 'Connected'
}

type ShowCastPickerAction = {
  type: typeof SHOW_CAST_PICKER
}

type UpdateCastStatusAction = {
  type: typeof UPDATE_STATUS
  castStatus: CastStatus
}

type SetPlayPosition = {
  type: typeof SET_PLAY_POSITION
  position: number
}

export type GoogleCastActions =
  | ShowCastPickerAction
  | UpdateCastStatusAction
  | SetPlayPosition

export const showCastPicker = (): ShowCastPickerAction => ({
  type: SHOW_CAST_PICKER
})

export const updateCastStatus = (
  castStatus: CastStatus
): UpdateCastStatusAction => ({
  type: UPDATE_STATUS,
  castStatus
})

export const setPlayPosition = (position: number): SetPlayPosition => ({
  type: SET_PLAY_POSITION,
  position
})
