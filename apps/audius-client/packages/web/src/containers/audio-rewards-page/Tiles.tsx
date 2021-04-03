import React, { useCallback } from 'react'
import styles from './Tiles.module.css'
import cn from 'classnames'
import { useSelector } from 'utils/reducer'
import {
  getAccountBalance,
  formatWei,
  BNWei,
  getAccountTotalBalance
} from 'store/wallet/slice'
import BN from 'bn.js'
import { Button, ButtonType } from '@audius/stems'
import { useDispatch } from 'react-redux'
import { ReactComponent as IconSend } from 'assets/img/iconSend.svg'
import { ReactComponent as IconReceive } from 'assets/img/iconReceive.svg'
import {
  getAssociatedWallets,
  pressConnectWallets,
  pressReceive,
  pressSend
} from 'store/token-dashboard/slice'
import TokenHoverTooltip from './components/TokenHoverTooltip'
import { isMobile } from 'utils/clientUtil'
import { useModalState } from 'hooks/useModalState'
import { useWithMobileStyle } from 'hooks/useWithMobileStyle'
import { Nullable } from 'utils/typeUtils'
import MobileConnectWalletsDrawer from 'containers/mobile-connect-wallets-drawer/MobileConnectWalletsDrawer'
const messages = {
  noClaim1: 'You earn $AUDIO by using Audius.',
  noClaim2: 'The more you use Audius, the more $AUDIO you earn.',
  balance: '$AUDIO BALANCE',
  receiveLabel: 'RECEIVE $AUDIO',
  sendLabel: 'SEND $AUDIO',
  audio: '$AUDIO',
  manageWallets: 'Manage Wallets',
  connectWallets: 'Connect Other Wallets',
  multipleWallets: 'Total $AUDIO across Wallets: '
}

export const LEARN_MORE_URL = 'http://blog.audius.co/posts/community-meet-audio'

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

  const wm = useWithMobileStyle(styles.mobile)

  return (
    <Tile className={wm(styles.balanceTile, className)}>
      <>
        <TokenHoverTooltip balance={balance || (new BN(0) as BNWei)}>
          <div
            className={cn(styles.balanceAmount, {
              [styles.hidden]: !balance
            })}
          >
            {formatWei(balance || (new BN(0) as BNWei), true, 0)}
          </div>
        </TokenHoverTooltip>
        <div
          className={cn(styles.balance, {
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

export const WalletTile = ({ className }: { className?: string }) => {
  const balance = useSelector(getAccountBalance) ?? (new BN(0) as BNWei)
  const hasBalance = balance && !balance.isZero()
  const dispatch = useDispatch()
  const [, openTransferDrawer] = useModalState('TransferAudioMobileWarning')

  const mobile = isMobile()
  const onClickReceive = useCallback(() => {
    if (mobile) {
      openTransferDrawer(true)
    } else {
      dispatch(pressReceive())
    }
  }, [dispatch, mobile, openTransferDrawer])

  const onClickSend = useCallback(() => {
    if (mobile) {
      openTransferDrawer(true)
    } else {
      dispatch(pressSend())
    }
  }, [mobile, dispatch, openTransferDrawer])
  const [, setOpen] = useModalState('MobileConnectWalletsDrawer')

  const onClickConnectWallets = useCallback(() => {
    if (mobile) {
      setOpen(true)
    } else {
      dispatch(pressConnectWallets())
    }
  }, [mobile, setOpen, dispatch])

  const onCloseConnectWalletsDrawer = useCallback(() => {
    setOpen(false)
  }, [setOpen])

  const { connectedWallets: wallets } = useSelector(getAssociatedWallets)
  const hasMultipleWallets = (wallets?.length ?? 0) > 0

  return (
    <Tile className={cn([styles.walletTile, className])}>
      <>
        <div className={styles.buttons}>
          <Button
            className={cn(styles.balanceBtn, {
              [styles.balanceDisabled]: !hasBalance
            })}
            text={messages.sendLabel}
            isDisabled={!hasBalance}
            includeHoverAnimations={hasBalance}
            textClassName={styles.textClassName}
            onClick={onClickSend}
            leftIcon={<IconSend className={styles.iconStyle} />}
            type={ButtonType.GLASS}
          />
          <Button
            className={cn(styles.balanceBtn, styles.receiveBtn)}
            text={messages.receiveLabel}
            textClassName={styles.textClassName}
            onClick={onClickReceive}
            leftIcon={<IconReceive className={styles.iconStyle} />}
            type={ButtonType.GLASS}
          />
          <Button
            className={cn(styles.balanceBtn, styles.connectWalletsBtn)}
            text={
              hasMultipleWallets
                ? messages.manageWallets
                : messages.connectWallets
            }
            includeHoverAnimations
            textClassName={styles.textClassName}
            onClick={onClickConnectWallets}
            type={ButtonType.GLASS}
          />
          {mobile && (
            <MobileConnectWalletsDrawer onClose={onCloseConnectWalletsDrawer} />
          )}
        </div>
      </>
    </Tile>
  )
}
