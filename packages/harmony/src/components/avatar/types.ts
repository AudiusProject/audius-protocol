export type AvatarProps = {
  /**
   * Url image source
   */
  url?: string

  /**
   * Variant
   * @default default
   */
  variant?: 'default' | 'strong'

  /**
   * Size
   * @default auto
   */
  size?: 'auto' | '24px' | '40px'

  /**
   * Stroke Width
   * @default 2px
   */
  strokeWidth?: '1.2px' | '2px'
}
