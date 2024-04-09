import { forwardRef } from 'react'

import { useTheme } from '@emotion/react'

import { Flex } from '../Flex'

import type { PaperProps } from './types'

/**
 * Base layout component used as a building block for creating pages
 * and other components.
 * */
export const Paper = forwardRef<HTMLDivElement, PaperProps>((props, ref) => {
  const {
    backgroundColor = 'white',
    border,
    borderRadius = 'm',
    shadow = 'mid',
    ...other
  } = props

  const { onClick } = other

  const theme = useTheme()

  const css = {
    boxShadow: theme.shadows[shadow],
    border: border && `1px solid ${theme.color.border[border]}`,
    borderRadius: theme.cornerRadius[borderRadius],
    backgroundColor: theme.color.background[backgroundColor],
    overflow: 'hidden',
    transition: theme.motion.hover
  }

  const interactiveCss = {
    '&:hover': {
      transform: 'scale(1.01)',
      boxShadow: theme.shadows.far
    },
    '&:active': {
      transform: 'scale(0.995)',
      boxShadow: theme.shadows.near,
      transition: theme.motion.press
    }
  }

  return (
    <Flex
      css={[css, onClick && interactiveCss]}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      ref={ref}
      {...other}
    />
  )
})
