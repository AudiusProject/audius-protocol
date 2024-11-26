export const primitiveTheme = {
  day: {
    static: {
      white: '#FFFFFF',
      black: '#000000',
      primary: '#CC0FE0'
    },
    primary: {
      primary: '#CC0FE0',
      p100: '#D63FE6',
      p200: '#D127E3',
      p300: '#CC0FE0',
      p400: '#B80ECA',
      p500: '#A30CB3'
    },
    secondary: {
      secondary: '#7E1BCC',
      s100: '#9849D6',
      s200: '#8B32D1',
      s300: '#7E1BCC',
      s400: '#7118B8',
      s500: '#6516A3'
    },
    neutral: {
      neutral: '#858199',
      n25: '#FCFCFC',
      n50: '#F7F7F9',
      n100: '#F2F2F4',
      n150: '#E7E6EB',
      n200: '#DAD9E0',
      n300: '#CECDD6',
      n400: '#C2C0CC',
      n500: '#B6B3C2',
      n600: '#AAA7B8',
      n700: '#9D9AAD',
      n800: '#858199',
      n900: '#78748A',
      n950: '#6A677A'
    },
    special: {
      white: '#FFFFFF',
      background: '#F3F0F7',
      blue: '#1BA1F1',
      orange: '#FF9400',
      red: '#D0021B',
      darkRed: '#BB0218',
      green: '#0F9E48',
      lightGreen: '#13C65A',
      trendingBlue: '#216FDC',
      aiGreen: '#1FD187',
      gradient: 'linear-gradient(315deg, #5b23e1 0%, #a22feb 100%)'
    }
  },

  dark: {
    static: {
      white: '#FFFFFF',
      black: '#000000',
      primary: '#CC0FE0'
    },
    primary: {
      primary: '#C74BD3',
      p100: '#A945B9',
      p200: '#B748C6',
      p300: '#C74BD3',
      p400: '#C556D4',
      p500: '#C563D6'
    },
    secondary: {
      secondary: '#9147CC',
      s100: '#7440A4',
      s200: '#8244B8',
      s300: '#9147CC',
      s400: '#975ACD',
      s500: '#9A60CF'
    },
    neutral: {
      neutral: '#BEC5E0',
      n25: '#35364F',
      n50: '#393A54',
      n100: '#3F415B',
      n150: '#4E4F6A',
      n200: '#5A5E78',
      n300: '#696D88',
      n400: '#777C96',
      n500: '#868AA4',
      n600: '#9399B3',
      n700: '#A2A8C2',
      n800: '#BEC5E0',
      n900: '#CFD5EC',
      n950: '#D9DEF1'
    },
    special: {
      white: '#32334D',
      background: '#242438',
      blue: '#58B9F4',
      orange: '#EFA947',
      red: '#F9344C',
      darkRed: '#C43047',
      green: '#6CDF44',
      lightGreen: '#13C65A',
      trendingBlue: '#216FDC',
      aiGreen: '#1FD187',
      gradient: 'linear-gradient(315deg, #7652cc 0%, #b05ce6 100%)'
    }
  },
  matrix: {
    static: {
      white: '#FFFFFF',
      black: '#000000',
      primary: '#CC0FE0'
    },
    primary: {
      primary: '#0CF10C',
      p100: '#0CF10C',
      p200: '#0CF10C',
      p300: '#0CF10C',
      p400: '#0CF10C',
      p500: '#0CF10C'
    },
    secondary: {
      secondary: '#184F17',
      s100: '#184F17',
      s200: '#184F17',
      s300: '#184F17',
      s400: '#184F17',
      s500: '#184F17'
    },
    neutral: {
      neutral: '#21B404',
      n25: '#1D211B',
      n50: '#202A1D',
      n100: '#1A2F15',
      n150: '#1B3714',
      n200: '#1C5610',
      n300: '#1D5E0F',
      n400: '#1D660E',
      n500: '#1F850A',
      n600: '#1F9508',
      n700: '#20A406',
      n800: '#21B404',
      n900: '#21B404',
      n950: '#21B404'
    },
    special: {
      white: '#1F211F',
      background: '#191818',
      blue: '#58B9F4',
      orange: '#EFA947',
      red: '#F9344C',
      darkRed: '#C43047',
      green: '#6CDF44',
      lightGreen: '#13C65A',
      trendingBlue: '#216FDC',
      aiGreen: '#1FD187',
      gradient: 'linear-gradient(323.08deg, #4FF069 36.13%, #09BD51 133.51%)'
    }
  }
}

export type PrimitiveColors = typeof primitiveTheme.day
export type PrimaryColors = keyof PrimitiveColors['primary']
export type SecondaryColors = keyof PrimitiveColors['secondary']
export type NeutralColors = keyof PrimitiveColors['neutral']
export type SpecialColors = keyof PrimitiveColors['special']
