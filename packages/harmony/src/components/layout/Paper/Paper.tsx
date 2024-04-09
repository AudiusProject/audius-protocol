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

  const { shadows, color, cornerRadius, motion } = useTheme()

  const css = {
    boxShadow: shadows[shadow],
    border: border && `1px solid ${color.border[border]}`,
    borderRadius: cornerRadius[borderRadius],
    backgroundColor: color.background[backgroundColor],
    overflow: 'hidden',
    transition: motion.hover
  }

  const interactiveCss = {
    '&:hover': {
      transform: 'scale(1.01)',
      boxShadow: shadows.far
    },
    '&:active': {
      transform: 'scale(0.95)',
      boxShadow: shadows.near,
      transition: motion.press
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
