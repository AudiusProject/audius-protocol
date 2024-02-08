import { MouseEvent } from 'react'

import { CSSObject, useTheme } from '@emotion/react'

import { IconButton } from 'components/button'

import { IconCloseAlt, IconPlus } from '../../icons'
import { Text } from '../text'

const messages = {
  add: 'Add Tag',
  remove: 'Remove Tag'
}

export type TagProps = {
  children: string
  className?: string
  onClick?: (e: MouseEvent<HTMLElement>) => void
  variant?: 'default' | 'composed'
  multiselect?: boolean
}

export const Tag = (props: TagProps) => {
  const { children, variant, multiselect, onClick, ...other } = props
  const { color, motion, cornerRadius, spacing } = useTheme()

  const rootCss: CSSObject = {
    all: 'unset',
    cursor: multiselect && variant === 'composed' ? 'pointer' : undefined,
    display: 'inline-flex',
    alignItems: 'center',
    height: 23,
    boxSizing: 'border-box',
    padding: '5.5px 8px',
    // gap: spacing.xs,
    borderRadius: cornerRadius.xs,
    backgroundColor:
      variant === 'composed' ? color.secondary.s300 : color.neutral.n400,
    transition: `transform ${motion.hover}, background-color ${motion.hover}, color ${motion.hover}`,

    ':hover': {
      backgroundColor:
        variant === 'composed' ? color.secondary.s100 : color.secondary.s300,
      transform: 'scale(1.04)'
    },
    ':active': {
      transform: 'scale(0.98)'
    }
  }

  const Icon = multiselect
    ? variant === 'composed'
      ? IconPlus
      : IconCloseAlt
    : null

  const Root = multiselect && variant === 'composed' ? 'button' : 'span'
  const isDefaultMultiselect = multiselect && variant === 'default'

  return (
    <Root
      css={rootCss}
      onClick={isDefaultMultiselect ? undefined : onClick}
      {...other}
    >
      <Text
        variant='label'
        size='xs'
        color='staticWhite'
        css={{ lineHeight: '8px' }}
      >
        {children}
      </Text>
      {Icon ? (
        <IconButton
          icon={Icon}
          color='staticWhite'
          onClick={isDefaultMultiselect ? onClick : undefined}
          aria-label={variant === 'composed' ? messages.add : messages.remove}
          height={spacing.unit2}
          width={spacing.unit2}
          css={{ paddingRight: 0 }}
        />
      ) : null}
    </Root>
  )
}
