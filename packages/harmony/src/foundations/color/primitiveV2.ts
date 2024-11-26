export const primitiveThemeV2 = {
  day: {
    static: {
      primary: '#CC0FE0',
      white: '#FFFFFF',
      staticWhite: '#FFFFFF',
      black: '#000000'
    },
    primary: {
      p100: '#D63FE6',
      p200: '#D127E3',
      p300: '#CC0FE0',
      p400: '#B80ECA',
      p500: '#A30CB3',
      default: '#CC0FE0',
      primary: '#CC0FE0'
    },
    secondary: {
      s100: '#9849D6',
      s200: '#8B32D1',
      s300: '#7E1BCC',
      s400: '#7118B8',
      s500: '#6516A3',
      default: '#7E1BCC',
      secondary: '#7E1BCC'
    },
    neutral: {
      n25: '#FEFEFE',
      n50: '#F7F7F8',
      n100: '#EFEFF1',
      n150: '#E7E7EA',
      n200: '#D6D5DB',
      n300: '#C3C1CB',
      n400: '#A2A0AF',
      n500: '#938FA3',
      n600: '#817D95',
      n700: '#736E88',
      n800: '#6C6780',
      n900: '#615D73',
      n950: '#524F62',
      default: '#6C6780',
      neutral: '#6C6780'
    },
    special: {
      aiGreen: '#1FD187',
      background: '#F6F5F7',
      blue: '#1BA1F1',
      darkRed: '#BB0218',
      glassOverlay: '#FFFFFFD9',
      gradientStop1: '#5B23E1',
      gradientStop2: '#A22FEB',
      gradient: 'linear-gradient(315deg, #5B23E1 0%, #A22FEB 100%)',
      green: '#0F9E48',
      lightGreen: '#13C65A',
      orange: '#FF9400',
      red: '#D0021B',
      trendingBlue: '#216FDC',
      white: '#FFFFFF',
      default: '#1BA1F1',
      special: '#1BA1F1'
    }
  },
  dark: {
    static: {
      primary: '#B94CC2',
      white: '#2F3348',
      staticWhite: '#F6F8FC',
      black: '#000000'
    },
    primary: {
      p100: '#924699',
      p200: '#B356BB',
      p300: '#D767E1',
      p400: '#F479FF',
      p500: '#F7A4FF',
      default: '#D767E1',
      primary: '#D767E1'
    },
    secondary: {
      s100: '#9A66CA',
      s200: '#B071E4',
      s300: '#C67CFF',
      s400: '#CF90FF',
      s500: '#D7A3FF',
      default: '#C67CFF',
      secondary: '#C67CFF'
    },
    neutral: {
      n25: '#30354A',
      n50: '#353A51',
      n100: '#3C425D',
      n150: '#444B69',
      n200: '#4F577A',
      n300: '#656F9B',
      n400: '#7B83A7',
      n500: '#969BB6',
      n600: '#A6AAC0',
      n700: '#B6B9CB',
      n800: '#C6C8D6',
      n900: '#D6D7E1',
      n950: '#E6E7ED',
      default: '#C6C8D6',
      neutral: '#C6C8D6'
    },
    special: {
      aiGreen: '#1FD187',
      background: '#202131',
      blue: '#58B9F4',
      darkRed: '#C43047',
      glassOverlay: '#2F334899',
      gradientStop1: '#9469EE',
      gradientStop2: '#C781FC',
      gradient: 'linear-gradient(315deg, #9469EE 0%, #C781FC 100%)',
      green: '#6CDF44',
      lightGreen: '#13C65A',
      orange: '#EFA947',
      red: '#F9344C',
      trendingBlue: '#216FDC',
      white: '#2F3348',
      default: '#58B9F4',
      special: '#58B9F4'
    }
  },
  matrix: {
    static: {
      primary: '#B94CC2',
      white: '#020804',
      staticWhite: '#F6F8FC',
      black: '#000000'
    },
    primary: {
      p100: '#08A008',
      p200: '#09B509',
      p300: '#0BD90B',
      p400: '#0BE40B',
      p500: '#3DF23D',
      default: '#0BD90B',
      primary: '#0BD90B'
    },
    secondary: {
      s100: '#00A73C',
      s200: '#00BD44',
      s300: '#00E252',
      s400: '#00ED56',
      s500: '#3CFB6B',
      default: '#00E252',
      secondary: '#00E252'
    },
    neutral: {
      n25: '#041208',
      n50: '#071C0C',
      n100: '#0D3718',
      n150: '#18632A',
      n200: '#1C7632',
      n300: '#218B3B',
      n400: '#28A747',
      n500: '#2EC253',
      n600: '#33D75C',
      n700: '#37E762',
      n800: '#3AF267',
      n900: '#3CFA6B',
      n950: '#49FB72',
      default: '#3AF267',
      neutral: '#3AF267'
    },
    special: {
      aiGreen: '#1FD187',
      background: '#000000',
      blue: '#58B9F4',
      darkRed: '#C43047',
      glassOverlay: '#01010199',
      gradientStop1: '#6CDF44',
      gradientStop2: '#13C65A',
      gradient: 'linear-gradient(315deg, #6CDF44 0%, #13C65A 100%)',
      green: '#6CDF44',
      lightGreen: '#13C65A',
      orange: '#EFA947',
      red: '#F9344C',
      trendingBlue: '#216FDC',
      white: '#020804',
      default: '#58B9F4',
      special: '#58B9F4'
    }
  }
}

export type PrimitiveColorsV2 = typeof primitiveThemeV2.day
export type PrimaryColorsV2 = keyof PrimitiveColorsV2['primary']
export type SecondaryColorsV2 = keyof PrimitiveColorsV2['secondary']
export type NeutralColorsV2 = keyof PrimitiveColorsV2['neutral']
export type SpecialColorsV2 = keyof PrimitiveColorsV2['special']
export type StaticColorsV2 = keyof PrimitiveColorsV2['static']
