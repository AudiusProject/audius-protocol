import { useCallback } from 'react'

import { useArtistCoin, useTokenBalance } from '@audius/common/api'
import { ID } from '@audius/common/models'
import { WALLET_PAGE } from '@audius/common/src/utils/route'
import { formatCount } from '@audius/common/utils'
import {
  Artwork,
  HoverCard,
  HoverCardHeader,
  HoverCardProps,
  IconArrowRight,
  useTheme
} from '@audius/harmony'

import { useNavigateToPage } from 'hooks/useNavigateToPage'

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
  const navigate = useNavigateToPage()
  const { cornerRadius, spacing } = useTheme()

  const { data: coin } = useArtistCoin({ mint })
  const { data: tokenBalance } = useTokenBalance({
    mint,
    userId
  })

  const handleClick = useCallback(() => {
    onClick?.()
    navigate(`${WALLET_PAGE}/${coin?.ticker}`)
  }, [onClick, navigate, coin?.ticker])

  if (!tokenBalance || !coin) return null

  const formattedBalance = formatCount(Number(tokenBalance.balance))
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
            onClick={handleClick}
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
      onClick={handleClick}
      triggeredBy={triggeredBy}
    >
      {children}
    </HoverCard>
  )
}
