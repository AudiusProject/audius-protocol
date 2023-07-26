import {
  FontWeight,
  TextVariant,
  TextVariantSizeInfo,
  TextVariantStrengthInfo
} from './types'

export const fontWeightMap: Record<FontWeight, number> = {
  heavy: 900,
  bold: 700,
  demiBold: 600,
  medium: 500,
  regular: 400,
  light: 300,
  thin: 200,
  ultraLight: 100
}

export const variantInfoMap: Record<TextVariant, TextVariantSizeInfo> = {
  display: {
    XL: {
      tag: 'h1',
      fontSize: '96px',
      lineHeight: '120px'
    },
    L: {
      tag: 'h1',
      fontSize: '72px',
      lineHeight: '88px'
    },
    M: {
      tag: 'h1',
      fontSize: '56px',
      lineHeight: '68px'
    },
    S: {
      tag: 'h1',
      fontSize: '42px',
      lineHeight: '52px'
    }
  },
  heading: {
    XL: {
      tag: 'h1',
      fontSize: '36px',
      lineHeight: '40px'
    },
    L: {
      tag: 'h2',
      fontSize: '28px',
      lineHeight: '32px'
    },
    M: {
      tag: 'h3',
      fontSize: '24px',
      lineHeight: '32px'
    },
    S: {
      tag: 'h4',
      fontSize: '20px',
      lineHeight: '24px'
    }
  },
  title: {
    L: {
      tag: 'p',
      fontSize: '18px',
      lineHeight: '24px'
    },
    M: {
      tag: 'p',
      fontSize: '16px',
      lineHeight: '20px'
    },
    S: {
      tag: 'p',
      fontSize: '14px',
      lineHeight: '16px'
    },
    XS: {
      tag: 'p',
      fontSize: '12px',
      lineHeight: '16px'
    }
  },
  label: {
    XL: {
      tag: 'label',
      fontSize: '20px',
      lineHeight: '24px',
      letterSpacing: '0.5px',
      textTransform: 'uppercase'
    },
    L: {
      tag: 'label',
      fontSize: '16px',
      lineHeight: '16px',
      letterSpacing: '0.5px',
      textTransform: 'uppercase'
    },
    M: {
      tag: 'label',
      fontSize: '14px',
      lineHeight: '16px',
      letterSpacing: '0.5px',
      textTransform: 'uppercase'
    },
    S: {
      tag: 'label',
      fontSize: '12px',
      lineHeight: '12px',
      letterSpacing: '0.5px',
      textTransform: 'uppercase'
    },
    XS: {
      tag: 'label',
      fontSize: '10px',
      lineHeight: '12px',
      letterSpacing: '0.5px',
      textTransform: 'uppercase'
    }
  },
  body: {
    L: {
      tag: 'p',
      fontSize: '18px',
      lineHeight: '24px'
    },
    M: {
      tag: 'p',
      fontSize: '16px',
      lineHeight: '20px'
    },
    S: {
      tag: 'p',
      fontSize: '14px',
      lineHeight: '20px'
    },
    XS: {
      tag: 'p',
      fontSize: '12px',
      lineHeight: '20px'
    }
  }
}

export const variantStrengthMap: Record<TextVariant, TextVariantStrengthInfo> =
  {
    display: {
      default: { fontWeight: 'bold' },
      strong: { fontWeight: 'heavy' }
    },
    heading: {
      default: { fontWeight: 'bold' },
      strong: { fontWeight: 'heavy' }
    },
    title: {
      weak: { fontWeight: 'demiBold' },
      default: { fontWeight: 'bold' },
      strong: { fontWeight: 'heavy' }
    },
    label: {
      default: { fontWeight: 'bold' },
      strong: { fontWeight: 'heavy' }
    },
    body: {
      default: { fontWeight: 'medium' },
      strong: { fontWeight: 'demiBold' }
    }
  }
