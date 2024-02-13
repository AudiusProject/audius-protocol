import { forwardRef } from 'react'

import { useTheme, type CSSObject } from '@emotion/react'

import type { IconComponent, IconProps } from 'components/icon'

import { BaseButton } from '../BaseButton/BaseButton'
import type { BaseButtonProps } from '../BaseButton/types'

export type IconButtonProps = {
  icon: IconComponent
  ripple?: boolean
  'aria-label': string
} & Pick<IconProps, 'color' | 'size' | 'shadow' | 'height' | 'width'> &
  Pick<BaseButtonProps, 'onClick' | 'disabled' | 'className'>

/**
 * The icon component allows you to pass in an icon and
 * apply color and sizing properties.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (props: IconButtonProps, ref) => {
    const {
      icon: Icon,
      color: iconColor,
      size = 'l',
      shadow,
      ripple,
      height,
      width,
      ...other
    } = props
    const { disabled } = other
    const { color, cornerRadius, spacing } = useTheme()

    const buttonCss: CSSObject = {
      background: 'transparent',
      border: 'none',
      borderRadius: '50%',
      padding: spacing.xs,
      overflow: 'unset'
    }

    const rippleCss: CSSObject = {
      '&:hover': {
        backgroundColor: color.neutral.n100
      },
      '&:active': {
        backgroundColor: color.neutral.n150
      },
      '&:focus-visible': {
        border: `1px solid ${color.secondary.secondary}`,
        borderRadius: cornerRadius.s
      }
    }

    return (
      <BaseButton
        ref={ref}
        {...other}
        type='button'
        css={[buttonCss, ripple && rippleCss]}
      >
        <Icon
          aria-hidden
          color={disabled ? 'disabled' : iconColor}
          size={size}
          shadow={shadow}
          height={height}
          width={width}
        />
      </BaseButton>
    )
  }
)
