export type AvatarProps = {
  /**
   * Url image source
   */
  src: string

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
}
