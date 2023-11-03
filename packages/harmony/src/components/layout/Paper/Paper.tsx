import { useTheme } from '@emotion/react'
import styled from '@emotion/styled'

import { Flex } from '../Flex'

import type { PaperProps } from './types'

/**
 * Base layout component used as a building block for creating pages
 * and other components.
 * */
export const Paper = styled(Flex)(
  ({
    backgroundColor = 'default',
    border = 'default',
    borderRadius = 'm',
    shadow = 'mid'
  }: PaperProps) => {
    const theme = useTheme()
    return {
      position: 'relative',
      boxSizing: 'border-box',
      boxShadow: shadow && theme.shadows[shadow],
      border: border && `1px solid ${theme.color.border[border]}`,
      borderRadius: borderRadius && theme.cornerRadius[borderRadius],
      backgroundColor:
        backgroundColor && theme.color.background[backgroundColor]
    }
  }
)
