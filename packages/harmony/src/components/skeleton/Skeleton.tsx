import { keyframes, useTheme } from '@emotion/react'

import { roundedHexClipPath } from '~harmony/icons/SVGDefs'

import { Box, BoxProps } from '../layout/Box'

const shimmer = keyframes({
  from: {
    backgroundPosition: 'right'
  },
  to: {
    backgroundPosition: 'left'
  }
})

type SkeletonProps = BoxProps & {
  /** If true, disables the shimmer animation */
  noShimmer?: boolean
  hex?: boolean
}

export const Skeleton = ({ noShimmer, hex, ...props }: SkeletonProps) => {
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
    clipPath: hex ? `url(#${roundedHexClipPath})` : undefined,
    animation: noShimmer ? 'none' : `${shimmer} 1.5s forwards infinite ease`,
    backgroundSize: '400%'
  }

  return <Box borderRadius='s' css={css} aria-busy {...props} />
}
