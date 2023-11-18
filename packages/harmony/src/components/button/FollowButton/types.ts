import type { ChangeEventHandler, ComponentPropsWithoutRef } from 'react'

export type CheckboxProps = {
  type: 'checkbox'
  onChange?: ChangeEventHandler<HTMLInputElement>
} & Omit<ComponentPropsWithoutRef<'input'>, 'chiildren' | 'size'>

type InputProps =
  | CheckboxProps
  | ({
      type?: 'button'
      onChange: undefined
      checked: undefined
    } & Omit<ComponentPropsWithoutRef<'button'>, 'children' | 'onChange'>)

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

  /**
   * Html input type to use
   */
  type?: 'button' | 'checkbox'
} & InputProps
