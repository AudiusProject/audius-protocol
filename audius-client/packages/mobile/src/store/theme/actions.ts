import { Theme } from '../../utils/theme'

export const SET = 'THEME/SET'

type SetAction = {
  type: typeof SET
  theme: Theme
}

export type ThemeActions = SetAction

export const set = (theme: Theme): SetAction => ({
  type: SET,
  theme
})
