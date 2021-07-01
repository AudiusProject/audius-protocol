import React from 'react'

import BN from 'bn.js'
import cn from 'classnames'

import { getAssociatedWallets } from 'store/token-dashboard/slice'
import {
  getAccountBalance,
  getAccountTotalBalance,
  formatWei,
  BNWei
} from 'store/wallet/slice'
import { useSelector } from 'utils/reducer'
import { Nullable } from 'utils/typeUtils'

import styles from './BalanceTile.module.css'
import TokenHoverTooltip from './TokenHoverTooltip'

const messages = {
  audio: '$AUDIO',
  multipleWallets: 'Total $AUDIO across Wallets: '
}

type TileProps = {
  className?: string
}

export const Tile: React.FC<TileProps> = ({ className, children }) => {
  return (
    <div className={cn([styles.tileContainer, className])}> {children}</div>
  )
}

export const BalanceTile = ({ className }: { className?: string }) => {
  const balance = useSelector(getAccountBalance) ?? null
  const totalBalance: Nullable<BNWei> =
    useSelector(getAccountTotalBalance) ?? null
  const { connectedWallets: wallets } = useSelector(getAssociatedWallets)
  const hasMultipleWallets = (wallets?.length ?? 0) > 0

  return (
    <Tile className={cn([styles.container, className])}>
      <>
        <TokenHoverTooltip balance={balance || (new BN(0) as BNWei)}>
          <div
            className={cn(styles.balanceAmount, {
              [styles.hidden]: !balance
            })}
          >
            {formatWei(balance || (new BN(0) as BNWei), true)}
          </div>
        </TokenHoverTooltip>
        <div
          className={cn(styles.balanceLabel, {
            [styles.hidden]: !balance
          })}
        >
          {messages.audio}
        </div>
        {hasMultipleWallets && totalBalance && (
          <div className={styles.multipleWalletsContainer}>
            <span className={styles.multipleWalletsMessage}>
              {messages.multipleWallets}
            </span>
            <TokenHoverTooltip balance={totalBalance}>
              <span className={styles.totalBalance}>
                {formatWei(totalBalance, true)}
              </span>
            </TokenHoverTooltip>
          </div>
        )}
      </>
    </Tile>
  )
}

export default BalanceTile
