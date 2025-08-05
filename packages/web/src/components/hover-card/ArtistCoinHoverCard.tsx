import { useTokenBalance, useArtistCoin } from '@audius/common/api'
import { ID } from '@audius/common/models'
import { formatCount } from '@audius/common/utils'
import {
  Artwork,
  HoverCard,
  HoverCardHeader,
  HoverCardProps,
  IconArrowRight,
  useTheme
} from '@audius/harmony'

import { HoverCardBody } from './HoverCardBody'

type ArtistCoinHoverCardProps = Pick<
  HoverCardProps,
  | 'children'
  | 'onClose'
  | 'onClick'
  | 'anchorOrigin'
  | 'transformOrigin'
  | 'triggeredBy'
> & {
  /**
   * The mint address of the artist coin
   */
  mint: string

  /**
   * The user ID to fetch balance information for
   */
  userId: ID
}

/**
 * A complete HoverCard for artist coin badges that includes both header and body
 */
export const ArtistCoinHoverCard = ({
  children,
  mint,
  userId,
  onClose,
  anchorOrigin,
  transformOrigin,
  onClick,
  triggeredBy
}: ArtistCoinHoverCardProps) => {
  const { cornerRadius, spacing } = useTheme()

  const { data: coin } = useArtistCoin({ mint })
  const { data: coinBalance } = useTokenBalance({ mint })

  if (!coinBalance || !coin) return null

  const balance = coinBalance
  const formattedBalance = formatCount(Number(balance))
  const coinName = coin.ticker || ''
  const logoURI = coin.logoUri

  return (
    <HoverCard
      content={
        <>
          <HoverCardHeader
            iconLeft={() =>
              logoURI ? (
                <Artwork
                  src={logoURI}
                  hex
                  w={spacing.unit6}
                  h={spacing.unit6}
                  borderWidth={0}
                />
              ) : null
            }
            title={coinName}
            onClose={onClose}
            iconRight={IconArrowRight}
          />
          <HoverCardBody
            icon={
              logoURI ? (
                <Artwork
                  src={logoURI}
                  hex
                  w={spacing.unit16}
                  h={spacing.unit16}
                  borderWidth={0}
                  css={{ borderRadius: cornerRadius.circle }}
                />
              ) : null
            }
            amount={formattedBalance}
            currency={coinName}
          />
        </>
      }
      anchorOrigin={anchorOrigin}
      transformOrigin={transformOrigin}
      onClick={onClick}
      triggeredBy={triggeredBy}
    >
      {children}
    </HoverCard>
  )
}
