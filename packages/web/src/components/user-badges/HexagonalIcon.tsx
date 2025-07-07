import { ReactElement } from 'react'

import { Box, IconSize, iconSizes } from '@audius/harmony'

type HexagonalIconProps = {
  children: ReactElement
  size?: IconSize
  className?: string
  onClick?: () => void
}

/**
 * A reusable wrapper component that applies the Audius hexagonal styling to any icon
 */
export const HexagonalIcon = ({
  children,
  size = 'm',
  className,
  onClick
}: HexagonalIconProps) => {
  return (
    <Box
      className={className}
      onClick={onClick}
      css={{
        clipPath: 'url(#rounded-hex-clip-path)',
        transform: 'translate(0 7)'
      }}
      w={iconSizes[size]}
      h={iconSizes[size]}
    >
      {children}
    </Box>
  )
}
