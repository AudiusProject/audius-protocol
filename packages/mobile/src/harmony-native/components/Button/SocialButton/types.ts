import type { ButtonProps } from '../types'

export type SocialMedia = 'tiktok' | 'instagram' | 'twitter'

export type SocialButtonProps = ButtonProps & {
  /**
   * Which social media.
   */
  socialType: SocialMedia

  /**
   * Aria label text. Required since these buttons just have icons
   */
  'aria-label': string
}
