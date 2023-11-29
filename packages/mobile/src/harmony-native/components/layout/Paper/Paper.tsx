import styled from '@emotion/native'

import { Flex } from '../Flex/Flex'

import type { NativePaperProps } from './types'


/**
 * Base layout component used as a building block for creating pages
 * and other components.
 * */
export const Paper = styled(Flex)<NativePaperProps>((props) => {
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
