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

export type TextSize =
  | 'xxLarge'
  | 'xLarge'
  | 'large'
  | 'medium'
  | 'small'
  | 'xSmall'

export type TextVariant =
  | 'display'
  | 'heading'
  | 'title'
  | 'label'
  | 'body'
  | 'inherit'
export type VariantSizeTagMap = Partial<Record<TextSize, ElementType>>
