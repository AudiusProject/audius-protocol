import { useCallback, ReactNode } from 'react'

import {
  tokenDashboardPageSelectors,
  tokenDashboardPageActions,
  walletSelectors
} from '@audius/common/store'
import { isNullOrUndefined, formatWei } from '@audius/common/utils'
import { IconReceive, IconSend, IconInfo } from '@audius/harmony'
import { Button, ButtonType } from '@audius/stems'
import cn from 'classnames'
import { useDispatch } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import MobileConnectWalletsDrawer from 'components/mobile-connect-wallets-drawer/MobileConnectWalletsDrawer'
import { useIsMobile } from 'hooks/useIsMobile'
import { useWithMobileStyle } from 'hooks/useWithMobileStyle'
import { useSelector } from 'utils/reducer'

import styles from './Tiles.module.css'
import TokenHoverTooltip from './components/TokenHoverTooltip'
const { getAccountBalance, getAccountTotalBalance } = walletSelectors
const { getHasAssociatedWallets } = tokenDashboardPageSelectors
const { pressConnectWallets, pressReceive, pressSend } =
  tokenDashboardPageActions

const messages = {
  noClaim1: 'You earn $AUDIO by using Audius.',
  noClaim2: 'The more you use Audius, the more $AUDIO you earn.',
  balance: '$AUDIO BALANCE',
  receiveLabel: 'RECEIVE $AUDIO',
  sendLabel: 'SEND $AUDIO',
  audio: '$AUDIO',
  manageWallets: 'Manage Wallets',
  totalAudio: 'Total $AUDIO'
}

export const LEARN_MORE_URL = 'http://blog.audius.co/posts/community-meet-audio'

type TileProps = {
  className?: string
  children: ReactNode
}

export const Tile = ({ className, children }: TileProps) => {
  return (
    <div className={cn([styles.tileContainer, className])}> {children}</div>
  )
}

export const BalanceTile = ({ className }: { className?: string }) => {
  const totalBalance = useSelector(getAccountTotalBalance)
  const hasMultipleWallets = useSelector(getHasAssociatedWallets)

  const [, setOpen] = useModalState('AudioBreakdown')
  const onClickOpen = useCallback(() => {
    setOpen(true)
  }, [setOpen])

  const wm = useWithMobileStyle(styles.mobile)

  return (
    <Tile className={wm(styles.balanceTile, className)}>
      <>
        {isNullOrUndefined(totalBalance) ? (
          <LoadingSpinner className={styles.spinner} />
        ) : (
          <TokenHoverTooltip balance={totalBalance}>
            <div className={cn(styles.balanceAmount)}>
              {formatWei(totalBalance, true, 0)}
            </div>
          </TokenHoverTooltip>
        )}
        <div className={styles.balance}>
          {hasMultipleWallets ? (
            <div onClick={onClickOpen}>
              {messages.totalAudio}
              <IconInfo className={styles.iconInfo} />
            </div>
          ) : (
            messages.audio
          )}
        </div>
      </>
    </Tile>
  )
}

export const WalletTile = ({ className }: { className?: string }) => {
  const balance = useSelector(getAccountBalance)
  const hasBalance = !isNullOrUndefined(balance) && !balance.isZero()
  const dispatch = useDispatch()
  const [, openTransferDrawer] = useModalState('TransferAudioMobileWarning')

  const isMobile = useIsMobile()
  const onClickReceive = useCallback(() => {
    if (isMobile) {
      openTransferDrawer(true)
    } else {
      dispatch(pressReceive())
    }
  }, [dispatch, isMobile, openTransferDrawer])

  const onClickSend = useCallback(() => {
    if (isMobile) {
      openTransferDrawer(true)
    } else {
      dispatch(pressSend())
    }
  }, [isMobile, dispatch, openTransferDrawer])
  const [, setOpen] = useModalState('MobileConnectWalletsDrawer')

  const onClickConnectWallets = useCallback(() => {
    if (isMobile) {
      setOpen(true)
    } else {
      dispatch(pressConnectWallets())
    }
  }, [isMobile, setOpen, dispatch])

  const onCloseConnectWalletsDrawer = useCallback(() => {
    setOpen(false)
  }, [setOpen])

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
            text={messages.manageWallets}
            includeHoverAnimations
            textClassName={styles.textClassName}
            onClick={onClickConnectWallets}
            type={ButtonType.GLASS}
          />
          {isMobile && (
            <MobileConnectWalletsDrawer onClose={onCloseConnectWalletsDrawer} />
          )}
        </div>
      </>
    </Tile>
  )
}
