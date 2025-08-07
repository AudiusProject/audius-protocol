import { TokenInfo } from '@audius/common/store'
import { Artwork, useTheme } from '@audius/harmony'

export type TokenIconProps = {
  tokenInfo: TokenInfo
  size?: string
  [key: string]: any
}

// Component to render token icon - handles both icon component and logoURI
export const TokenIcon = ({
  tokenInfo,
  size = 'l',
  ...props
}: TokenIconProps) => {
  const { spacing } = useTheme()
  const { icon: IconComponent, logoURI } = tokenInfo

  if (IconComponent) {
    return <IconComponent size={size} {...props} />
  }

  if (logoURI) {
    // Handle different size props for Artwork component
    const sizeMap: Record<string, { w: number; h: number }> = {
      l: { w: spacing.unit6, h: spacing.unit6 },
      xl: { w: spacing.unit10, h: spacing.unit10 },
      '2xl': { w: spacing.unit12, h: spacing.unit12 },
      '4xl': { w: spacing.unit16, h: spacing.unit16 }
    }

    const dimensions = sizeMap[size]

    return <Artwork src={logoURI} {...dimensions} borderWidth={0} {...props} />
  }

  return null
}
