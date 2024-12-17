import { ComponentProps, useMemo } from 'react'

import { Flex, IconComponent, Text, TextProps, useTheme } from '@audius/harmony'
import { CSSInterpolation } from '@emotion/css'
import { Interpolation, Theme } from '@emotion/react'
import { Slot } from '@radix-ui/react-slot'
import { NavLink, NavLinkProps } from 'react-router-dom'

import {
  RestrictionType,
  useRequiresAccountOnClick
} from 'hooks/useRequiresAccount'

export type LeftNavLinkProps =
  | {
      disabled?: boolean
      asChild?: boolean
      icon?: IconComponent
      iconSize?: 's' | 'm' | 'l'
      hideIconPadding?: boolean
    } & (
      | Omit<NavLinkProps, 'onDrop'>
      | Omit<ComponentProps<'div'>, 'onDrop'>
    ) & {
        restriction?: RestrictionType
      }

export const LeftNavLink = (props: LeftNavLinkProps) => {
  const {
    asChild,
    disabled,
    children,
    onClick,
    restriction,
    icon: Icon,
    iconSize = 's',
    ...other
  } = props

  const theme = useTheme()

  const handleClick = useRequiresAccountOnClick(
    (e) => onClick?.(e as any),
    [onClick],
    undefined,
    undefined,
    restriction
  )

  const css = useMemo(() => {
    const { color, spacing, typography } = theme

    const linkInteractionCss: CSSInterpolation = {
      '&:hover': {
        cursor: 'pointer',
        color: color.neutral.n950,
        backgroundColor: color.neutral.n100
      },
      '&.active': {
        color: color.text.active,
        fontWeight: typography.weight.medium,
        backgroundColor: color.neutral.n200
      }
    }

    const disabledDropCss: CSSInterpolation = {
      opacity: 0.6,
      cursor: 'not-allowed'
    }

    const combined: Interpolation<Theme> = [
      {
        position: 'relative',
        minHeight: spacing.xl,
        display: 'flex',
        alignItems: 'center',
        gap: spacing.s,
        minWidth: 100,
        paddingRight: spacing.l,
        paddingLeft: spacing.s,
        paddingTop: spacing.s,
        paddingBottom: spacing.s,
        color: color.text.default,
        border: 0,
        background: 'none',
        textAlign: 'inherit',
        borderRadius: spacing.xs
      },
      linkInteractionCss,
      disabled && disabledDropCss
    ]
    return combined
  }, [disabled, theme])

  const TextComp = asChild ? Slot : Text
  const textProps = asChild
    ? undefined
    : ({
        variant: 'title',
        size: 's',
        css: { display: 'flex', alignItems: 'center' }
      } as TextProps<'span'>)

  const content = (
    <Flex alignItems='center' gap='s' css={{ width: '100%' }}>
      {Icon && <Icon size={iconSize} color='default' />}
      <TextComp {...textProps} css={{ width: '100%' }}>
        {children}
      </TextComp>
    </Flex>
  )

  if ('to' in other) {
    return (
      <NavLink
        {...other}
        onClick={handleClick}
        activeClassName='active'
        css={css}
      >
        {content}
      </NavLink>
    )
  }

  return (
    <div {...other} css={css} onClick={handleClick}>
      {content}
    </div>
  )
}
