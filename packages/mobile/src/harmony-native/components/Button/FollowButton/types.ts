import type { ChangeEvent } from 'react'

import type { PressableProps } from 'react-native'

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
  value?: any
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void
} & Pick<PressableProps, 'onPress' | 'disabled'>
