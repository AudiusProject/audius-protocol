import { useCallback, ReactNode } from 'react'

import { Button, ButtonType, IconInfo } from '@audius/stems'
import BN from 'bn.js'
import cn from 'classnames'
import { useDispatch } from 'react-redux'

import { ReactComponent as IconReceive } from 'assets/img/iconReceive.svg'
import { ReactComponent as IconSend } from 'assets/img/iconSend.svg'
import { useModalState } from 'common/hooks/useModalState'
import { BNWei } from 'common/models/Wallet'
import { getHasAssociatedWallets } from 'common/store/pages/token-dashboard/selectors'
import {
  pressConnectWallets,
  pressReceive,
  pressSend
} from 'common/store/pages/token-dashboard/slice'
import {
  getAccountBalance,
  getAccountTotalBalance
} from 'common/store/wallet/selectors'
import { Nullable } from 'common/utils/typeUtils'
import { formatWei } from 'common/utils/wallet'
import MobileConnectWalletsDrawer from 'components/mobile-connect-wallets-drawer/MobileConnectWalletsDrawer'
import { useWithMobileStyle } from 'hooks/useWithMobileStyle'
import { isMobile } from 'utils/clientUtil'
import { useSelector } from 'utils/reducer'

import styles from './Tiles.module.css'
import TokenHoverTooltip from './components/TokenHoverTooltip'

const messages = {
  noClaim1: 'You earn $AUDIO by using Audius.',
  noClaim2: 'The more you use Audius, the more $AUDIO you earn.',
  balance: '$AUDIO BALANCE',
  receiveLabel: 'RECEIVE $AUDIO',
  sendLabel: 'SEND $AUDIO',
  audio: '$AUDIO',
  manageWallets: 'Manage Wallets',
  connectWallets: 'Connect Other Wallets',
  totalAudio: 'Total $AUDIO'
}

export const LEARN_MORE_URL = 'http://blog.audius.co/posts/community-meet-audio'

type TileProps = {
  className?: string
  children: ReactNode
}

const IS_NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

export const Tile = ({ className, children }: TileProps) => {
  return (
    <div className={cn([styles.tileContainer, className])}> {children}</div>
  )
}

export const BalanceTile = ({ className }: { className?: string }) => {
  const totalBalance: Nullable<BNWei> =
    useSelector(getAccountTotalBalance) ?? null
  const hasMultipleWallets = useSelector(getHasAssociatedWallets)

  const [, setOpen] = useModalState('AudioBreakdown')
  const onClickOpen = useCallback(() => {
    setOpen(true)
  }, [setOpen])

  const wm = useWithMobileStyle(styles.mobile)

  return (
    <Tile className={wm(styles.balanceTile, className)}>
      <>
        <TokenHoverTooltip balance={totalBalance || (new BN(0) as BNWei)}>
          <div
            className={cn(styles.balanceAmount, {
              [styles.hidden]: !totalBalance
            })}>
            {formatWei(totalBalance || (new BN(0) as BNWei), true, 0)}
          </div>
        </TokenHoverTooltip>
        <div
          className={cn(styles.balance, {
            [styles.hidden]: !totalBalance
          })}>
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

  const hasMultipleWallets = useSelector(getHasAssociatedWallets)

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
          {mobile && !IS_NATIVE_MOBILE && (
            <MobileConnectWalletsDrawer onClose={onCloseConnectWalletsDrawer} />
          )}
        </div>
      </>
    </Tile>
  )
}
