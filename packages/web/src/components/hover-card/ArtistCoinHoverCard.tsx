import { useUserCoinBalance } from '@audius/common/api'
import { ID } from '@audius/common/models'
import { formatCount } from '@audius/common/utils'
import {
  HoverCard,
  HoverCardHeader,
  HoverCardProps,
  IconArrowRight,
  IconTokenBonk,
  useTheme
} from '@audius/harmony'

import { HoverCardBody } from './HoverCardBody'

type ArtistCoinHoverCardProps = Pick<
  HoverCardProps,
  'children' | 'onClose' | 'onClick' | 'anchorOrigin' | 'transformOrigin'
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
  onClick
}: ArtistCoinHoverCardProps) => {
  const { cornerRadius } = useTheme()

  const { data: coinBalance, isPending } = useUserCoinBalance({
    userId,
    mint
  })

  if (isPending || !coinBalance) return null

  const balance = coinBalance?.data[0]?.balance
  const formattedBalance = formatCount(Number(balance))
  const coinName = 'BONK'

  return (
    <HoverCard
      content={
        <>
          <HoverCardHeader
            iconLeft={() => <IconTokenBonk size='l' hex />}
            title={coinName}
            onClose={onClose}
            iconRight={IconArrowRight}
          />
          <HoverCardBody
            icon={
              <IconTokenBonk
                size='3xl'
                css={{ borderRadius: cornerRadius.circle }}
                hex
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
