import type { PropsWithChildren } from 'react'

export type AvatarProps = PropsWithChildren<{
  className?: string
  /**
   * Url image source
   */
  src: string | undefined

  /**
   * Variant
   * @default default
   */
  variant?: 'default' | 'strong'

  /**
   * Size
   * @default auto
   */
  size?: 'auto' | 'small' | 'large'

  /**
   * Stroke Width
   * @default default
   */
  strokeWidth?: 'thin' | 'default'
}>
