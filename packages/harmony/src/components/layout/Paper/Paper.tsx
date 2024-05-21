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
    borderRadius = 'm',
    shadow = 'mid',
    ...other
  } = props

  const { onClick } = other

  const { shadows, motion } = useTheme()

  const css = {
    overflow: 'hidden',
    transition: motion.hover,
    cursor: onClick ? 'pointer' : undefined
  }

  const interactiveCss = {
    '&:hover': {
      transform: 'scale(1.01)',
      boxShadow: shadows.far
    },
    '&:active': {
      transform: 'scale(0.995)',
      boxShadow: shadows.near,
      transition: motion.press
    }
  }

  return (
    <Flex
      css={[css, onClick && interactiveCss]}
      backgroundColor={backgroundColor}
      borderRadius={borderRadius}
      shadow={shadow}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      ref={ref}
      {...other}
    />
  )
})
