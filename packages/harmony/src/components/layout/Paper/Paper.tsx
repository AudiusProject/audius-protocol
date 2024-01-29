import styled from '@emotion/styled'

import { Flex } from '../Flex'

import type { PaperProps } from './types'

/**
 * Base layout component used as a building block for creating pages
 * and other components.
 * */
export const Paper = styled(Flex)<PaperProps>((props) => {
  const {
    theme,
    backgroundColor = 'white',
    border,
    borderRadius = 'm',
    shadow = 'mid'
  } = props

  return {
    boxShadow: theme.shadows[shadow],
    border: border && `1px solid ${theme.color.border[border]}`,
    borderRadius: theme.cornerRadius[borderRadius],
    backgroundColor: theme.color.background[backgroundColor],
    overflow: 'hidden'
  }
})
