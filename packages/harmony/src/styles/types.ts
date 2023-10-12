export type Theme = 'day' | 'dark' | 'matrix'

export type ThemeColors = {
  static: {
    white: string
    primary: string
  }
  primary: {
    primary: string
    p100: string
    p200: string
    p300: string
    p400: string
    p500: string
  }
  secondary: {
    secondary: string
    s100: string
    s200: string
    s300: string
    s400: string
    s500: string
  }
  neutral: {
    neutral: string
    n25: string
    n50: string
    n100: string
    n150: string
    n200: string
    n300: string
    n400: string
    n500: string
    n600: string
    n700: string
    n800: string
    n900: string
    n950: string
  }
  special: {
    white: string
    background: string
    blue: string
    orange: string
    red: string
    darkRed: string
    green: string
    lightGreen: string
    gradient: string
  }
}

export type SpacingValue = 'xs' | 's' | 'm' | 'l' | 'xl' | '2xl' | '3xl' | '4xl'
export type BorderValue = 'default' | 'strong'
export type BorderRadiusValue = 'xs' | 's' | 'm' | 'l' | 'xl' | '2xl'
export type ShadowValue = 'near' | 'mid' | 'far' | 'emphasis'
