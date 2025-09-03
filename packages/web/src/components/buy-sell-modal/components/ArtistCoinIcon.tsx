import { ComponentType } from 'react'

import { useArtistCoin } from '@audius/common/api'
import {
  Artwork,
  ArtworkProps,
  IconProps,
  Skeleton,
  useTheme
} from '@audius/harmony'

export type ArtistCoinIconProps = {
  mint?: string
  // todo: deprecate these
  logoURI?: string
  icon?: ComponentType<any>
} & ArtworkProps &
  IconProps

// Component to render token icon - handles both icon component and logoURI
export const ArtistCoinIcon = ({
  mint,
  size = 'l',
  hex,
  w,
  h,
  ...props
}: ArtistCoinIconProps) => {
  const { data: artistCoin } = useArtistCoin({ mint })
  const { logoUri } = artistCoin ?? {}
  const { spacing } = useTheme()

  // Handle different size props for Artwork component
  const sizeMap: Record<string, { w: number; h: number }> = {
    l: { w: spacing.unit6, h: spacing.unit6 },
    xl: { w: spacing.unit10, h: spacing.unit10 },
    '2xl': { w: spacing.unit12, h: spacing.unit12 },
    '4xl': { w: spacing.unit16, h: spacing.unit16 }
  }

  // Use explicit w/h if provided, otherwise use size mapping
  const dimensions = w && h ? { w, h } : sizeMap[size]

  if (logoUri) {
    return (
      <Artwork
        src={logoUri}
        {...dimensions}
        borderWidth={0}
        hex={hex}
        {...props}
      />
    )
  }

  return <Skeleton hex {...dimensions} />
}
