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

export type TextStrength = 'Weak' | 'Default' | 'Strong'

export type TextSize = 'XLarge' | 'Large' | 'Medium' | 'Small' | 'XSmall'

export type TextVariant = 'display' | 'heading' | 'title' | 'label' | 'body'
export type VariantSizeTagMap = Partial<Record<TextSize, ElementType>>
