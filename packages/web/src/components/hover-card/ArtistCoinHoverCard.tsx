import { ReactNode } from 'react'

import { useUserCoinBalance } from '@audius/common/api'
import { ID } from '@audius/common/models'
import { formatCount } from '@audius/common/utils'
import {
  HoverCard,
  HoverCardHeader,
  IconArrowRight,
  IconTokenBonk,
  useTheme
} from '@audius/harmony'
import { Origin } from '@audius/harmony/src/components/popup/types'

import { HoverCardBody } from './HoverCardBody'

type ArtistCoinHoverCardProps = {
  /**
   * Content displayed as the hover trigger
   */
  children: ReactNode

  /**
   * The mint address of the artist coin
   */
  mint: string

  /**
   * The user ID to fetch balance information for
   */
  userId: ID

  /**
   * Optional callback fired when the hover card is closed
   */
  onClose?: () => void

  /**
   * Position of the anchor origin
   */
  anchorOrigin?: Origin

  /**
   * Position of the transform origin
   */
  transformOrigin?: Origin

  /**
   * Optional callback fired when the hover card is clicked
   */
  onClick?: () => void
}

const formatCoinBalance = (balance?: number) => {
  if (!balance) return '0'
  return formatCount(balance)
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
  onClick
}: ArtistCoinHoverCardProps) => {
  const { cornerRadius } = useTheme()

  const { data: coinBalance } = useUserCoinBalance({
    userId,
    mint
  })

  const balance = coinBalance?.data[0]?.balance
  const formattedBalance = formatCoinBalance(balance)
  const coinName = 'BONK'

  return (
    <HoverCard
      content={
        <>
          <HoverCardHeader
            iconLeft={IconTokenBonk}
            title={coinName}
            onClose={onClose}
            iconRight={IconArrowRight}
          />
          <HoverCardBody
            icon={
              <IconTokenBonk
                size='3xl'
                css={{ borderRadius: cornerRadius.circle }}
              />
            }
            amount={formattedBalance}
            currency={coinName}
          />
        </>
      }
      anchorOrigin={anchorOrigin}
      transformOrigin={transformOrigin}
      onClick={onClick}
    >
      {children}
    </HoverCard>
  )
}
