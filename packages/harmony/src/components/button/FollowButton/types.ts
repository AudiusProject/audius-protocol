import type { ComponentPropsWithoutRef } from 'react'

type InputProps =
  | ({
      type: 'checkbox'
    } & Omit<ComponentPropsWithoutRef<'input'>, 'chiildren' | 'size'>)
  | ({
      type?: 'button' | undefined
    } & Omit<ComponentPropsWithoutRef<'button'>, 'children'>)

export type FollowButtonProps = {
  /**
   * Swap between the default (squared) and pill (rounded) forms.
   * @default default
   */
  variant?: 'default' | 'pill'

  /**
   * Swap between the default and small sizes.
   * @default default
   */
  size?: 'default' | 'small'

  /**
   * The current state of the button
   */
  isFollowing?: boolean

  /**
   * Callback for when a follow is triggered.
   */
  onFollow?: () => void

  /**
   * Callback for when an unfollow is triggered.
   */
  onUnfollow?: () => void

  fullWidth?: boolean
  messages?: {
    follow?: string
    following?: string
    unfollow?: string
  }
} & InputProps
