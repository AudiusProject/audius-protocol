import styled from '@emotion/native'

import { Flex } from '../Flex/Flex'

import type { PaperProps } from './types'

/**
 * Base layout component used as a building block for creating pages
 * and other components.
 * */
export const Paper = styled(Flex)<PaperProps>((props) => {
  const {
    theme: { color, shadows, cornerRadius },
    backgroundColor = 'white',
    border,
    borderRadius = 'm',
    shadow = 'mid'
  } = props

  return {
    ...shadows[shadow],
    backgroundColor: color.background[backgroundColor],
    ...(border && {
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: color.border[border]
    }),
    borderRadius: cornerRadius[borderRadius]
  }
})
