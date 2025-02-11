import { keyframes, useTheme } from '@emotion/react'

import { Box, BoxProps } from '../layout/Box'

const shimmer = keyframes({
  from: {
    backgroundPosition: 'right'
  },
  to: {
    backgroundPosition: 'left'
  }
})

type SkeletonProps = BoxProps

export const Skeleton = (props: SkeletonProps) => {
  const { color } = useTheme()
  const color1 = color.neutral.n50
  const color2 = color.neutral.n100
  const css = {
    backgroundImage: `linear-gradient(
      90deg,
      ${color1} 0%,
      ${color1} 32%,
      ${color2} 46%,
      ${color2} 54%,
      ${color1} 68%,
      ${color2} 100%
    )`,
    animation: `${shimmer} 1.5s forwards infinite ease`,
    backgroundSize: '400%'
  }

  return <Box borderRadius='s' css={css} aria-busy {...props} />
}
