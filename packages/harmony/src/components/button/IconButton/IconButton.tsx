import { forwardRef } from 'react'

import { useTheme, type CSSObject } from '@emotion/react'
import { Slottable } from '@radix-ui/react-slot'

import type { IconComponent, IconProps } from '../../icon'
import { BaseButton } from '../BaseButton/BaseButton'
import type { BaseButtonProps } from '../BaseButton/types'

export type IconButtonProps = {
  icon: IconComponent
  ripple?: boolean
  'aria-label': string
  iconCss?: CSSObject
  isActive?: boolean
  activeColor?: IconProps['color']
} & Pick<IconProps, 'color' | 'size' | 'shadow' | 'height' | 'width'> &
  BaseButtonProps

/**
 * The icon component allows you to pass in an icon and
 * apply color and sizing properties.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (props: IconButtonProps, ref) => {
    const {
      icon: Icon,
      color: iconColor = 'default',
      size = 'l',
      shadow,
      ripple,
      height,
      width,
      iconCss,
      children,
      isActive,
      activeColor,
      ...other
    } = props
    const { disabled, isLoading, asChild } = other
    const { color, cornerRadius, spacing, motion, iconSizes } = useTheme()

    const currentIconColor = disabled
      ? 'disabled'
      : (isActive && activeColor) || iconColor

    const buttonCss: CSSObject = {
      background: 'transparent',
      border: 'none',
      borderRadius: cornerRadius.circle,
      padding: ripple ? spacing.xs : 0,
      overflow: 'unset',
      svg: {
        transition: `transform ${motion.hover}`,
        path: {
          transition: `fill ${motion.hover}`
        }
      },
      '&:hover': {
        transform: 'scale(1.0)',
        svg: {
          transform: 'scale(1.1)',
          path: {
            fill: activeColor ? color.icon[activeColor] : undefined
          }
        }
      },
      '&:active': {
        transform: 'scale(1.0)',
        svg: {
          transform: 'scale(0.98)',
          path: {
            fill: activeColor ? color.icon[activeColor] : undefined
          }
        }
      }
    }

    const rippleCss: CSSObject = {
      transition: `background-color ${motion.hover}`,
      '&:hover, &[data-active="true"]': {
        backgroundColor: color.neutral.n100
      },
      '&:active': {
        backgroundColor: color.neutral.n150
      }
    }

    const loadingIconCss: CSSObject = {
      ...iconCss,
      height: iconSizes[size],
      width: iconSizes[size]
    }

    return (
      <BaseButton
        ref={ref}
        type={asChild ? undefined : 'button'}
        {...other}
        css={[buttonCss, (ripple || isActive) && rippleCss]}
        styles={{ icon: loadingIconCss }}
        slotted
        data-active={isActive}
      >
        {isLoading ? null : (
          <Icon
            aria-hidden
            color={currentIconColor}
            size={size}
            shadow={shadow}
            height={height}
            width={width}
            css={iconCss}
          />
        )}
        <Slottable>{children}</Slottable>
      </BaseButton>
    )
  }
)
