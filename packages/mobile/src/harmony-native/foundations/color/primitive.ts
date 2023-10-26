import type { LinearGradientProps } from 'react-native-linear-gradient'

import type { Theme } from '../types'

export type GradientColor = Pick<
  LinearGradientProps,
  'start' | 'end' | 'locations' | 'colors'
>

export type PrimitiveColors = {
  static: {
    white: string
    primary: string
  }
  primary: {
    primary: string
    'p-100': string
    'p-200': string
    'p-300': string
    'p-400': string
    'p-500': string
  }
  secondary: {
    secondary: string
    's-100': string
    's-200': string
    's-300': string
    's-400': string
    's-500': string
  }
  neutral: {
    neutral: string
    'n-25': string
    'n-50': string
    'n-100': string
    'n-150': string
    'n-200': string
    'n-300': string
    'n-400': string
    'n-500': string
    'n-600': string
    'n-700': string
    'n-800': string
    'n-900': string
    'n-950': string
  }
  special: {
    white: string
    background: string
    blue: string
    orange: string
    red: string
    'dark-red': string
    green: string
    'light-green': string
    gradient: GradientColor
  }
}

// linear-gradient at 315deg
const baseLinearGradient = {
  start: { x: 0, y: 1 },
  end: { x: 1, y: 0 }
}

export const primitiveTheme: Record<Theme, PrimitiveColors> = {
  day: {
    static: {
      white: '#FFFFFF',
      primary: '#CC0FE0'
    },
    primary: {
      primary: '#CC0FE0',
      'p-100': '#D63FE6',
      'p-200': '#D127E3',
      'p-300': '#CC0FE0',
      'p-400': '#B80ECA',
      'p-500': '#A30CB3'
    },
    secondary: {
      secondary: '#7E1BCC',
      's-100': '#9849D6',
      's-200': '#8B32D1',
      's-300': '#7E1BCC',
      's-400': '#7118B8',
      's-500': '#6516A3'
    },
    neutral: {
      neutral: '#858199',
      'n-25': '#FCFCFC',
      'n-50': '#F7F7F9',
      'n-100': '#F2F2F4',
      'n-150': '#E7E6EB',
      'n-200': '#DAD9E0',
      'n-300': '#CECDD6',
      'n-400': '#C2C0CC',
      'n-500': '#B6B3C2',
      'n-600': '#AAA7B8',
      'n-700': '#9D9AAD',
      'n-800': '#858199',
      'n-900': '#78748A',
      'n-950': '#6A677A'
    },
    special: {
      white: '#FFFFFF',
      background: '#F3F0F7',
      blue: '#1BA1F1',
      orange: '#FF9400',
      red: '#D0021B',
      'dark-red': '#BB0218',
      green: '#0F9E48',
      'light-green': '#13C65A',
      gradient: {
        ...baseLinearGradient,
        colors: ['#5B23E1', '#A22FEB']
      }
    }
  },

  dark: {
    static: {
      white: '#FFFFFF',
      primary: '#CC0FE0'
    },
    primary: {
      primary: '#C74BD3',
      'p-100': '#A945B9',
      'p-200': '#B748C6',
      'p-300': '#C74BD3',
      'p-400': '#C556D4',
      'p-500': '#C563D6'
    },
    secondary: {
      secondary: '#9147CC',
      's-100': '#7440A4',
      's-200': '#8244B8',
      's-300': '#9147CC',
      's-400': '#975ACD',
      's-500': '#9A60CF'
    },
    neutral: {
      neutral: '#BEC5E0',
      'n-25': '#35364F',
      'n-50': '#393A54',
      'n-100': '#3F415B',
      'n-150': '#4E4F6A',
      'n-200': '#5A5E78',
      'n-300': '#696D88',
      'n-400': '#777C96',
      'n-500': '#868AA4',
      'n-600': '#9399B3',
      'n-700': '#A2A8C2',
      'n-800': '#BEC5E0',
      'n-900': '#CFD5EC',
      'n-950': '#D9DEF1'
    },
    special: {
      white: '#32334D',
      background: '#242438',
      blue: '#58B9F4',
      orange: '#EFA947',
      red: '#F9344C',
      'dark-red': '#C43047',
      green: '#6CDF44',
      'light-green': '#13C65A',
      gradient: {
        ...baseLinearGradient,
        colors: ['#7652CC', '#B05CE6']
      }
    }
  },
  matrix: {
    static: {
      white: '#FFFFFF',
      primary: '#CC0FE0'
    },
    primary: {
      primary: '#0CF10C',
      'p-100': '#0CF10C',
      'p-200': '#0CF10C',
      'p-300': '#0CF10C',
      'p-400': '#0CF10C',
      'p-500': '#0CF10C'
    },
    secondary: {
      secondary: '#184F17',
      's-100': '#184F17',
      's-200': '#184F17',
      's-300': '#184F17',
      's-400': '#184F17',
      's-500': '#184F17'
    },
    neutral: {
      neutral: '#21B404',
      'n-25': '#1D211B',
      'n-50': '#202A1D',
      'n-100': '#1A2F15',
      'n-150': '#1B3714',
      'n-200': '#1C5610',
      'n-300': '#1D5E0F',
      'n-400': '#1D660E',
      'n-500': '#1F850A',
      'n-600': '#1F9508',
      'n-700': '#20A406',
      'n-800': '#21B404',
      'n-900': '#21B404',
      'n-950': '#21B404'
    },
    special: {
      white: '#1F211F',
      background: '#191818',
      blue: '#58B9F4',
      orange: '#EFA947',
      red: '#F9344C',
      'dark-red': '#BB0218',
      green: '#6CDF44',
      'light-green': '#13C65A',
      gradient: {
        ...baseLinearGradient,
        colors: ['#7652CC', '#B05CE6']
      }
    }
  }
}
