import { useFeatureFlag } from '@audius/common/hooks'
import { Theme } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import type { CommonState } from '@audius/common/store'
import { themeSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import { themeColorsV2 } from './themeV2'

const { getTheme, getSystemAppearance } = themeSelectors

export { Theme } from '@audius/common/models'

export const defaultTheme = {
  aiPrimary: '#1FD187',
  aiSecondary: '#0FC578',
  background: '#F3F0F7',
  backgroundSecondary: '#FAFAFA',
  backgroundSurface: '#FCFCFC',
  backgroundSurface2: '#F2F2F4',
  borderDefault: '#F2F2F4',
  borderStrong: '#E7E6EB',
  primary: '#CC0FE0',
  primaryDark1: '#B80ECA',
  primaryDark2: '#A30CB3',
  primaryLight1: '#D127E3',
  primaryLight2: '#D63FE6',
  secondary: '#7E1BCC',
  secondaryDark1: '#7118B8',
  secondaryDark2: '#6516A3',
  secondaryLight1: '#8B32D1',
  secondaryLight2: '#9849D6',
  neutral: '#858199',
  neutralDark1: '#78748A',
  neutralDark2: '#6A677A',
  neutralDark3: '#4D535A',
  neutralLight1: '#9D9AAD',
  neutralLight2: '#AAA7B8',
  neutralLight3: '#B6B3C2',
  neutralLight4: '#C2C0CC',
  neutralLight5: '#CECDD6',
  neutralLight6: '#DAD9E0',
  neutralLight7: '#E7E6EB',
  neutralLight8: '#F2F2F4',
  neutralLight9: '#F7F7F9',
  neutralLight10: '#FCFCFC',
  white: '#FFFFFF',
  accentRed: '#D0021B',
  accentRedDark1: '#AA0115',
  accentRedLight1: '#D51B32',
  accentGreen: '#0BA400',
  accentGreenDark1: '#0A9400',
  accentGreenLight1: '#23AD1A',
  accentOrange: '#FF9400',
  accentOrangeDark1: '#F28100',
  accentOrangeLight1: '#FFA70F',
  accentPurple: '#8E51CF',
  shadow: '#E3E3E3',
  staticTwitterBlue: '#1BA1F1',
  staticWhite: '#FFFFFF',
  staticNeutral: '#858199',
  staticNeutralLight2: '#AAA7B8',
  staticNeutralLight8: '#F2F2F4',
  staticAccentGreenLight1: '#23AD1A',
  specialLightGreen: '#13C65A',
  specialGreen: '#0F9E48',
  staticPrimary: '#CC0FE0',
  staticSecondary: '#7E1BCC',
  pageHeaderGradientColor1: '#5B23E1',
  pageHeaderGradientColor2: '#A22FEB',
  skeleton: '#F7F7F9',
  skeletonHighlight: '#F2F2F4',
  statTileText: '#C675FF',
  progressBackground: '#D9D9D9',
  accentBlue: '#1ba1f1',
  textIconSubdued: '#C2C0CC',
  focus: '#7E1BCC'
}

export const darkTheme = {
  aiPrimary: '#1FD187',
  aiSecondary: '#0FC578',
  background: '#242438',
  backgroundSecondary: '#2F3048',
  backgroundSurface: '#35364F',
  backgroundSurface2: '#3F415B',
  borderDefault: '#3F415B',
  borderStrong: '#4E4F6A',
  primary: '#C74BD3',
  primaryDark1: '#C556D4',
  primaryDark2: '#C563D6',
  primaryLight1: '#B748C6',
  primaryLight2: '#A945B9',
  secondary: '#9147CC',
  secondaryDark1: '#975ACD',
  secondaryDark2: '#9A60CF',
  secondaryLight1: '#8244B8',
  secondaryLight2: '#7440A4',
  neutral: '#BEC5E0',
  neutralDark1: '#C4CAE1',
  neutralDark2: '#CBD1E3',
  neutralDark3: '#E0E6FA',
  neutralLight1: '#A2A8C2',
  neutralLight2: '#9399B3',
  neutralLight3: '#868AA4',
  neutralLight4: '#777C96',
  neutralLight5: '#696D88',
  neutralLight6: '#5A5E78',
  neutralLight7: '#4E4F6A',
  neutralLight8: '#3F415B',
  neutralLight9: '#393A54',
  neutralLight10: '#35364F',
  white: '#32334D',
  accentRed: '#D0021B',
  accentRedDark1: '#AA0115',
  accentRedLight1: '#D51B32',
  accentGreen: '#0BA400',
  accentGreenDark1: '#0A9400',
  accentGreenLight1: '#23AD1A',
  accentOrange: '#FF9400',
  accentOrangeDark1: '#F28100',
  accentOrangeLight1: '#FFA70F',
  accentPurple: '#8E51CF',
  shadow: '#35364F',
  staticTwitterBlue: '#1BA1F1',
  staticWhite: '#FFFFFF',
  staticNeutral: '#858199',
  staticNeutralLight2: '#AAA7B8',
  staticNeutralLight8: '#F2F2F4',
  staticAccentGreenLight1: '#23AD1A',
  specialLightGreen: '#13C65A',
  specialGreen: '#6CDF44',
  staticPrimary: '#CC0FE0',
  staticSecondary: '#7E1BCC',
  pageHeaderGradientColor1: '#7652CC',
  pageHeaderGradientColor2: '#B05CE6',
  skeleton: '#393A54',
  skeletonHighlight: '#3F415B',
  statTileText: '#C675FF',
  progressBackground: '#D9D9D9',
  accentBlue: '#1ba1f1',
  textIconSubdued: '#777C96',
  focus: '#9147CC'
}

export const matrixTheme = {
  ...darkTheme,
  background: '#1A1818',
  backgroundSecondary: '#1A1818',
  backgroundSurface: '#1D211B',
  backgroundSurface2: '#1A2F15',
  borderDefault: '#3F415B',
  borderStrong: '#4E4F6A',
  primary: '#0CF10C',
  primaryDark1: '#0CF10C',
  primaryDark2: '#0CF10C',
  primaryLight1: '#0CF10C',
  primaryLight2: '#0CF10C',
  secondary: '#184F17',
  secondaryTransparent: '#184F17',
  secondaryDark1: '#184F17',
  secondaryDark2: '#184F17',
  secondaryLight1: '#184F17',
  secondaryLight2: '#184F17',
  neutral: '#21B404',
  neutralDark1: '#21B404',
  neutralDark2: '#21B404',
  neutralDark3: '#21B404',
  neutralLight1: '#20A406',
  neutralLight2: '#1F9508',
  neutralLight3: '#1F850A',
  neutralLight4: '#1D660E',
  neutralLight5: '#1D5E0F',
  neutralLight6: '#1C5610',
  neutralLight7: '#1B3714',
  neutralLight8: '#1A2F15',
  neutralLight9: '#202A1D',
  neutralLight10: '#1D211B',
  white: '#1F211F',
  staticTwitterBlue: '#1BA1F1',
  staticWhite: '#FFFFFF',
  staticNeutral: '#858199',
  staticNeutralLight2: '#AAA7B8',
  staticNeutralLight8: '#F2F2F4',
  staticAccentGreenLight1: '#23AD1A',
  specialLightGreen: '#13C65A',
  specialGreen: '#6CDF44',
  staticPrimary: '#CC0FE0',
  staticSecondary: '#7E1BCC',
  pageHeaderGradientColor1: '#4FF069',
  pageHeaderGradientColor2: '#09BD51',
  accentRed: '#D0021B',
  accentOrange: '#EFA947',
  accentGreen: '#23AD1A',
  skeleton: '#1B3714',
  skeletonHighlight: '#1C5610',
  statTileText: '#184F17',
  progressBackground: '#D9D9D9',
  accentBlue: '#1ba1f1',
  textIconSubdued: '#1D660E',
  focus: '#184F17'
}

export type ThemeColors = {
  aiPrimary: string
  aiSecondary: string
  background: string
  backgroundSecondary: string
  backgroundSurface: string
  backgroundSurface2: string
  borderDefault: string
  borderStrong: string
  primary: string
  primaryDark1: string
  primaryDark2: string
  primaryLight1: string
  primaryLight2: string
  secondary: string
  secondaryDark1: string
  secondaryDark2: string
  secondaryLight1: string
  secondaryLight2: string
  neutral: string
  neutralDark1: string
  neutralDark2: string
  neutralDark3: string
  neutralLight1: string
  neutralLight2: string
  neutralLight3: string
  neutralLight4: string
  neutralLight5: string
  neutralLight6: string
  neutralLight7: string
  neutralLight8: string
  neutralLight9: string
  neutralLight10: string
  white: string
  accentRed: string
  accentRedDark1: string
  accentRedLight1: string
  accentGreen: string
  accentGreenDark1: string
  accentGreenLight1: string
  accentOrange: string
  accentOrangeDark1: string
  accentOrangeLight1: string
  accentPurple: string
  shadow: string
  staticTwitterBlue: string
  staticWhite: string
  staticNeutral: string
  staticNeutralLight2: string
  staticNeutralLight8: string
  staticAccentGreenLight1: string
  specialLightGreen: string
  specialGreen: string
  staticPrimary: string
  staticSecondary: string
  pageHeaderGradientColor1: string
  pageHeaderGradientColor2: string
  skeleton: string
  skeletonHighlight: string
  statTileText: string
  progressBackground: string
  accentBlue: string
  textIconSubdued: string
  focus: string
}

const themeColorsByThemeVariant: Record<
  Theme.DARK | Theme.DEFAULT | Theme.MATRIX,
  ThemeColors
> = {
  [Theme.DEFAULT]: defaultTheme,
  [Theme.DARK]: darkTheme,
  [Theme.MATRIX]: matrixTheme
}

export const selectSystemTheme = (state: CommonState) => {
  const systemAppearance = getSystemAppearance(state)
  const systemTheme = systemAppearance === 'dark' ? Theme.DARK : Theme.DEFAULT
  return themeColorsByThemeVariant[systemTheme]
}

export const useThemeVariant = (): keyof typeof themeColorsByThemeVariant => {
  const theme = useSelector(getTheme)
  const systemAppearance = useSelector(getSystemAppearance)
  const systemTheme = systemAppearance === 'dark' ? Theme.DARK : Theme.DEFAULT
  return theme === Theme.AUTO ? systemTheme : theme ?? Theme.DEFAULT
}

export const useThemeColors = () => {
  const themeVariant = useThemeVariant()
  const { isEnabled: isThemeV2Enabled } = useFeatureFlag(FeatureFlags.THEME_V2)

  const themeColors = isThemeV2Enabled
    ? themeColorsV2
    : themeColorsByThemeVariant

  return themeColors[themeVariant]
}

export const useThemePalette = () => {
  const themeVariant = useThemeVariant()
  const { isEnabled: isThemeV2Enabled } = useFeatureFlag(FeatureFlags.THEME_V2)

  const themeColors = isThemeV2Enabled
    ? themeColorsV2
    : themeColorsByThemeVariant

  return themeColors[themeVariant]
}

export const useColor = (color: string): string => {
  const theme = useThemeColors()
  return (theme as any)[color]
}

// Uses normalColor when in light/dark mode, but "special color" when in other mode
export const useSpecialColor = (normalColor: string, specialColor: string) => {
  const theme = useSelector(getTheme)
  const themeVariant = useThemeColors()
  if (theme === Theme.MATRIX) {
    return (themeVariant as any)[specialColor]
  }
  return (themeVariant as any)[normalColor]
}

export const useTheme = (baseStyles: object, toTheme: object) => {
  const themeStyles = useThemeColors()

  const newStyles = {}
  Object.keys(toTheme).forEach((key) => {
    // @ts-ignore
    if (toTheme[key] in themeStyles) {
      // @ts-ignore
      newStyles[key] = themeStyles[toTheme[key]]
    }
  })
  return { ...baseStyles, ...newStyles }
}
