import { ElementType } from 'react'

export type FontWeight =
  | 'heavy' // 900
  | 'bold' // 700
  | 'demiBold' // 600
  | 'medium' // 500
  | 'regular' // 400
  | 'light' // 300
  | 'thin' // 200
  | 'ultraLight' // 100

export type TextStrength = 'weak' | 'default' | 'strong'
export type TextStrengthInfo = {
  fontWeight: FontWeight
}
type TextTransformValue = 'uppercase' | 'lowercase' | 'capitalize' | 'inherit'

export type TextSize = 'XL' | 'L' | 'M' | 'S' | 'XS'
export type TextSizeInfo = {
  tag: ElementType
  fontSize: string | number
  lineHeight: string | number
  letterSpacing?: string | number
  textTransform?: TextTransformValue
}

export type TextVariant = 'display' | 'heading' | 'title' | 'label' | 'body'
export type TextVariantSizeInfo = Partial<Record<TextSize, TextSizeInfo>>
export type TextVariantStrengthInfo = Partial<
  Record<TextStrength, TextStrengthInfo>
>
