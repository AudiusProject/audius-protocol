/**
 * Default [Neue] theme - light variant
 * Tokens v2 (Oct 2026): neutral chrome, one accent, AA contrast on every text pair.
 */
const defaultLightPrimitives = {
  static: {
    primary: '#6A52E0',
    secondary: '#5B44B8',
    white: '#FFFFFF',
    staticWhite: '#F6F8FC',
    black: '#0B0B0E'
  },
  primary: {
    p100: '#EFEBFF',
    p200: '#D9D1FF',
    p300: '#6A52E0',
    p400: '#5B44B8',
    p500: '#3B2A86',
    default: '#6A52E0',
    primary: '#6A52E0'
  },
  secondary: {
    s100: '#EFEBFF',
    s200: '#CFC3FF',
    s300: '#5B44B8',
    s400: '#4A369E',
    s500: '#3B2A86',
    default: '#5B44B8',
    secondary: '#5B44B8'
  },
  neutral: {
    n25: '#F5F5F7',
    n50: '#ECECF0',
    n100: '#D4D4DC',
    n150: '#C4C4CC',
    n200: '#A8A8B2',
    n300: '#6B6B75',
    n400: '#5C5C66',
    n500: '#50505A',
    n600: '#44444E',
    n700: '#30303A',
    n800: '#16161A',
    n900: '#101014',
    n950: '#0B0B0E',
    default: '#16161A',
    neutral: '#16161A'
  },
  special: {
    background: '#FFFFFF',
    blue: '#6A52E0',
    darkRed: '#B91C1C',
    glassOverlay: '#FFFFFFC7',
    gradientStop1: '#6A52E0',
    gradientStop2: '#5B44B8',
    gradient: 'linear-gradient(315deg, #6A52E0 0%, #5B44B8 100%)',
    coinGradient:
      'linear-gradient(85deg, #7F6AD6 -4.82%, #A74CFF 49.8%, #7F6AD6 104.43%)',
    coinGradientColor1: '#7F6AD6',
    coinGradientColor2: '#A74CFF',
    coinGradientColor3: '#7F6AD6',
    green: '#0F9E48',
    lightGreen: '#15803D',
    orange: '#B45309',
    red: '#DC2626',
    trendingBlue: '#2A85E8',
    white: '#FFFFFF',
    default: '#6A52E0',
    special: '#6A52E0'
  }
}

/**
 * Default [Neue] theme - dark variant
 * Tokens v2 (Oct 2026): neutral chrome, one accent, AA contrast on every text pair.
 */
const defaultDarkPrimitives = {
  static: {
    primary: '#6A52E0',
    secondary: '#A594FF',
    white: '#1C1C21',
    staticWhite: '#F6F8FC',
    black: '#FFFFFF'
  },
  primary: {
    p100: '#1E1A33',
    p200: '#2E2752',
    p300: '#6A52E0',
    p400: '#8E7CE8',
    p500: '#D8CFFF',
    default: '#6A52E0',
    primary: '#6A52E0'
  },
  secondary: {
    s100: '#2E2752',
    s200: '#6A52E0',
    s300: '#A594FF',
    s400: '#BDB2FF',
    s500: '#D8CFFF',
    default: '#A594FF',
    secondary: '#A594FF'
  },
  neutral: {
    n25: '#141418',
    n50: '#1C1C21',
    n100: '#34343C',
    n150: '#42424B',
    n200: '#55555F',
    n300: '#85858F',
    n400: '#A9A9B3',
    n500: '#B8B8C1',
    n600: '#C8C8CF',
    n700: '#D8D8DE',
    n800: '#F2F2F5',
    n900: '#F7F7F9',
    n950: '#FFFFFF',
    default: '#F2F2F5',
    neutral: '#F2F2F5'
  },
  special: {
    background: '#0B0B0E',
    blue: '#A594FF',
    darkRed: '#DC2626',
    glassOverlay: '#0B0B0EB8',
    gradientStop1: '#6A52E0',
    gradientStop2: '#A594FF',
    gradient: 'linear-gradient(315deg, #6A52E0 0%, #A594FF 100%)',
    coinGradient:
      'linear-gradient(85deg, #806AD8 -4.82%, #C67CFF 49.8%, #806AD8 104.43%)',
    coinGradientColor1: '#806AD8',
    coinGradientColor2: '#C67CFF',
    coinGradientColor3: '#806AD8',
    green: '#84DF64',
    lightGreen: '#4ADE80',
    orange: '#FBBF24',
    red: '#F87171',
    trendingBlue: '#2A85E8',
    white: '#1C1C21',
    default: '#A594FF',
    special: '#A594FF'
  }
}

/** Classic theme light variant (legacy day) */
const classicLightPrimitives = {
  static: {
    primary: '#CC0FE0FF',
    secondary: '#7E1BCCFF',
    white: '#FFFFFFFF',
    staticWhite: '#FFFFFFFF',
    black: '#000000'
  },
  primary: {
    p100: '#D63FE6FF',
    p200: '#D127E3FF',
    p300: '#CC0FE0FF',
    p400: '#B80ECAFF',
    p500: '#A30CB3FF',
    default: '#CC0FE0FF',
    primary: '#CC0FE0FF'
  },
  secondary: {
    s100: '#9849D6FF',
    s200: '#8B32D1FF',
    s300: '#7E1BCCFF',
    s400: '#7118B8FF',
    s500: '#6516A3FF',
    default: '#7E1BCCFF',
    secondary: '#7E1BCCFF'
  },
  neutral: {
    n25: '#FAFAFAFF',
    n50: '#F7F7F8FF',
    n100: '#EFEFF1FF',
    n150: '#E7E7EAFF',
    n200: '#D6D5DBFF',
    n300: '#C3C1CBFF',
    n400: '#A2A0AFFF',
    n500: '#938FA3FF',
    n600: '#817D95FF',
    n700: '#736E88FF',
    n800: '#6C6780FF',
    n900: '#615D73FF',
    n950: '#524F62FF',
    default: '#6C6780FF',
    neutral: '#6C6780FF'
  },
  special: {
    background: '#F6F5F7FF',
    blue: '#1BA1F1FF',
    darkRed: '#BB0218FF',
    glassOverlay: '#FFFFFFD9',
    gradientStop1: '#5B23E1FF',
    gradientStop2: '#A22FEBFF',
    gradient: 'linear-gradient(315deg, #5B23E1FF 0%, #A22FEBFF 100%)',
    coinGradient:
      'linear-gradient(85deg, #CC0FE0FF -4.82%, #7E1BCCFF 49.8%, #1BA1F1FF 104.43%)',
    coinGradientColor1: '#CC0FE0FF',
    coinGradientColor2: '#7E1BCCFF',
    coinGradientColor3: '#1BA1F1FF',
    green: '#0F9E48FF',
    lightGreen: '#13C65AFF',
    orange: '#FF9400FF',
    red: '#D0021BFF',
    trendingBlue: '#216FDCFF',
    white: '#FFFFFFFF',
    default: '#1BA1F1FF',
    special: '#1BA1F1FF'
  }
}

/** Classic theme dark variant (legacy dark) */
const classicDarkPrimitives = {
  static: {
    primary: '#B94CC2FF',
    secondary: '#7E1BCCFF',
    white: '#2F3348FF',
    staticWhite: '#F6F8FCFF',
    black: '#000000'
  },
  primary: {
    p100: '#924699FF',
    p200: '#B356BBFF',
    p300: '#D767E1FF',
    p400: '#F479FFFF',
    p500: '#F7A4FFFF',
    default: '#D767E1FF',
    primary: '#D767E1FF'
  },
  secondary: {
    s100: '#9A66CAFF',
    s200: '#B071E4FF',
    s300: '#C67CFFFF',
    s400: '#CF90FFFF',
    s500: '#D7A3FFFF',
    default: '#C67CFFFF',
    secondary: '#C67CFFFF'
  },
  neutral: {
    n25: '#30354AFF',
    n50: '#353A51FF',
    n100: '#3C425DFF',
    n150: '#444B69FF',
    n200: '#4F577AFF',
    n300: '#656F9BFF',
    n400: '#7B83A7FF',
    n500: '#969BB6FF',
    n600: '#A6AAC0FF',
    n700: '#B6B9CBFF',
    n800: '#C6C8D6FF',
    n900: '#D6D7E1FF',
    n950: '#E6E7EDFF',
    default: '#C6C8D6FF',
    neutral: '#C6C8D6FF'
  },
  special: {
    background: '#202131FF',
    blue: '#58B9F4FF',
    darkRed: '#C43047FF',
    glassOverlay: '#2F334899',
    gradientStop1: '#9469EEFF',
    gradientStop2: '#C781FCFF',
    gradient: 'linear-gradient(315deg, #9469EEFF 0%, #C781FCFF 100%)',
    coinGradient:
      'linear-gradient(85deg, #D767E1FF -4.82%, #C67CFFFF 49.8%, #58B9F4FF 104.43%)',
    coinGradientColor1: '#D767E1FF',
    coinGradientColor2: '#C67CFFFF',
    coinGradientColor3: '#58B9F4FF',
    green: '#6CDF44FF',
    lightGreen: '#15D864FF',
    orange: '#EFA947FF',
    red: '#F9344CFF',
    trendingBlue: '#2A85E8FF',
    white: '#2F3348FF',
    default: '#58B9F4FF',
    special: '#58B9F4FF'
  }
}

/** Matrix theme (single mode, no light/dark variant) */
const matrixPrimitives = {
  static: {
    primary: '#B94CC2FF',
    secondary: '#7E1BCCFF',
    white: '#020804FF',
    staticWhite: '#F6F8FCFF',
    black: '#000000'
  },
  primary: {
    p100: '#08A008FF',
    p200: '#09B509FF',
    p300: '#0BD90BFF',
    p400: '#0BE40BFF',
    p500: '#3DF23DFF',
    default: '#0BD90BFF',
    primary: '#0BD90BFF'
  },
  secondary: {
    s100: '#00A73CFF',
    s200: '#00BD44FF',
    s300: '#00E252FF',
    s400: '#00ED56FF',
    s500: '#3CFB6BFF',
    default: '#00E252FF',
    secondary: '#00E252FF'
  },
  neutral: {
    n25: '#010B06FF',
    n50: '#041308FF',
    n100: '#0A1F0DFF',
    n150: '#0F2F15FF',
    n200: '#123F1BFF',
    n300: '#166527FF',
    n400: '#1C8736FF',
    n500: '#1F9E3FFF',
    n600: '#2EB954FF',
    n700: '#34D561FF',
    n800: '#3EF56BFF',
    n900: '#54FF80FF',
    n950: '#9BFFA7FF',
    default: '#3EF56BFF',
    neutral: '#3EF56BFF'
  },
  special: {
    background: '#000000FF',
    blue: '#20E290FF',
    darkRed: '#D63C5AFF',
    glassOverlay: '#01010199',
    gradientStop1: '#6CDF44FF',
    gradientStop2: '#13C65AFF',
    gradient: 'linear-gradient(315deg, #6CDF44FF 0%, #13C65AFF 100%)',
    coinGradient:
      'linear-gradient(85deg, #0BD90BFF -4.82%, #00E252FF 49.8%, #20E290FF 104.43%)',
    coinGradientColor1: '#0BD90BFF',
    coinGradientColor2: '#00E252FF',
    coinGradientColor3: '#20E290FF',
    green: '#2EB954FF',
    lightGreen: '#0BF90BFF',
    orange: '#FFA524FF',
    red: '#F9344CFF',
    trendingBlue: '#1EEB6FFF',
    white: '#020804FF',
    default: '#20E290FF',
    special: '#20E290FF'
  }
}

export const primitiveTheme = {
  /** Default theme light variant (Neue design system) */
  defaultLight: defaultLightPrimitives,
  /** Default theme dark variant (Neue design system) */
  defaultDark: defaultDarkPrimitives,
  /** Classic theme light variant (legacy day) */
  classicLight: classicLightPrimitives,
  /** Classic theme dark variant (legacy dark) */
  classicDark: classicDarkPrimitives,
  /** Matrix theme (single mode, no light/dark) */
  matrix: matrixPrimitives,
  /** @deprecated Use classicLight. Backward compatibility. */
  day: classicLightPrimitives,
  /** @deprecated Use classicDark. Backward compatibility. */
  dark: classicDarkPrimitives
}

export type PrimitiveColors = typeof primitiveTheme.defaultLight
export type PrimaryColors = keyof PrimitiveColors['primary']
export type SecondaryColors = keyof PrimitiveColors['secondary']
export type NeutralColors = keyof PrimitiveColors['neutral']
export type SpecialColors = keyof PrimitiveColors['special']
export type StaticColors = keyof PrimitiveColors['static']
