import React, { useCallback, useState } from 'react'

import { Nullable, BNWei } from '@audius/common'
import { Button, ButtonType, IconInfo } from '@audius/stems'
import BN from 'bn.js'
import cn from 'classnames'
import { useDispatch, useSelector } from 'react-redux'

import { ReactComponent as CoinbaseLogo } from 'assets/img/coinbase-pay/LogoCoinbase.svg'
import { ReactComponent as IconCaretDownLine } from 'assets/img/iconCaretDownLine.svg'
import { ReactComponent as IconCaretUpLine } from 'assets/img/iconCaretUpLine.svg'
import { ReactComponent as IconReceive } from 'assets/img/iconReceive.svg'
import { ReactComponent as IconSend } from 'assets/img/iconSend.svg'
import { ReactComponent as IconSettings } from 'assets/img/iconSettings.svg'
import IconGoldBadge from 'assets/img/tokenBadgeGold40@2x.png'
import { useModalState } from 'common/hooks/useModalState'
import { getHasAssociatedWallets } from 'common/store/pages/token-dashboard/selectors'
import {
  pressReceive,
  pressSend,
  pressConnectWallets
} from 'common/store/pages/token-dashboard/slice'
import {
  getAccountBalance,
  getAccountTotalBalance
} from 'common/store/wallet/selectors'
import { formatWei } from 'common/utils/wallet'
import MobileConnectWalletsDrawer from 'components/mobile-connect-wallets-drawer/MobileConnectWalletsDrawer'
import { isMobile } from 'utils/clientUtil'

import TokenHoverTooltip from './TokenHoverTooltip'
import styles from './WalletManagementTile.module.css'

const messages = {
  receiveLabel: 'Receive $AUDIO',
  sendLabel: 'Send $AUDIO',
  audio: '$AUDIO',
  manageWallets: 'Manage Wallets',
  connectWallets: 'Connect Other Wallets',
  totalAudio: 'Total $AUDIO',
  buyAudio: 'Buy $AUDIO',
  checkoutWithCoinbase: 'Checkout with Coinbase',
  showAdvanced: 'Show Advanced',
  hideAdvanced: 'Hide Advanced',
  advancedOptions: 'Advanced Options',
  buyWith: 'Buy with',
  buyWithCoinbase: 'Buy with Coinbase'
}
const IS_NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

const AdvancedWalletActions = () => {
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
    <div className={styles.advancedSection}>
      <div className={styles.subtitle}>{messages.advancedOptions}</div>
      <div className={styles.advancedOptions}>
        <Button
          className={cn(styles.advancedButton, {
            [styles.disabled]: !hasBalance
          })}
          text={messages.sendLabel}
          isDisabled={!hasBalance}
          includeHoverAnimations={hasBalance}
          textClassName={styles.textClassName}
          onClick={onClickSend}
          leftIcon={<IconSend className={styles.iconStyle} />}
          type={ButtonType.GLASS}
          minWidth={200}
        />
        <Button
          className={cn(styles.advancedButton, styles.receiveBtn)}
          text={messages.receiveLabel}
          textClassName={styles.textClassName}
          onClick={onClickReceive}
          leftIcon={<IconReceive className={styles.iconStyle} />}
          type={ButtonType.GLASS}
          minWidth={200}
        />
        <Button
          className={cn(styles.advancedButton, styles.connectWalletsBtn)}
          text={
            hasMultipleWallets
              ? messages.manageWallets
              : messages.connectWallets
          }
          includeHoverAnimations
          textClassName={styles.textClassName}
          onClick={onClickConnectWallets}
          type={ButtonType.GLASS}
          leftIcon={<IconSettings className={styles.iconStyle} />}
          minWidth={200}
        />
        {mobile && !IS_NATIVE_MOBILE && (
          <MobileConnectWalletsDrawer onClose={onCloseConnectWalletsDrawer} />
        )}
      </div>
    </div>
  )
}

const ToggleCollapseButton = ({
  className,
  showText,
  hideText,
  children
}: {
  className?: string
  showText: string
  hideText: string
  children: React.ReactNode
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const handleToggle = useCallback(() => {
    setIsCollapsed((isCollapsed) => !isCollapsed)
  }, [setIsCollapsed])
  return (
    <>
      {isCollapsed ? null : children}
      <div
        className={cn(styles.toggleCollapsedButton, className)}
        onClick={handleToggle}
      >
        <span>{isCollapsed ? showText : hideText}</span>
        {isCollapsed ? <IconCaretDownLine /> : <IconCaretUpLine />}
      </div>
    </>
  )
}

export const WalletManagementTile = () => {
  const totalBalance: Nullable<BNWei> =
    useSelector(getAccountTotalBalance) ?? null
  const hasMultipleWallets = useSelector(getHasAssociatedWallets)
  const [, setOpen] = useModalState('AudioBreakdown')
  const onClickOpen = useCallback(() => {
    setOpen(true)
  }, [setOpen])

  return (
    <div className={styles.walletManagementTile}>
      <div className={styles.balanceContainer}>
        <TokenHoverTooltip balance={totalBalance || (new BN(0) as BNWei)}>
          <div
            className={cn(styles.balanceAmount, {
              [styles.hidden]: !totalBalance
            })}
          >
            {formatWei(totalBalance || (new BN(0) as BNWei), true, 0)}
          </div>
        </TokenHoverTooltip>
        <div
          className={cn(styles.balance, {
            [styles.hidden]: !totalBalance
          })}
        >
          {hasMultipleWallets ? (
            <div onClick={onClickOpen}>
              {messages.totalAudio}
              <IconInfo className={styles.iconInfo} />
            </div>
          ) : (
            messages.audio
          )}
        </div>
      </div>
      <div className={styles.container}>
        <div className={styles.header}>
          <img
            className={styles.headerIcon}
            src={IconGoldBadge}
            alt='Gold $AUDIO token'
          />
          <div className={styles.headerText}>
            <div className={styles.title}>{messages.buyAudio}</div>
            <div className={styles.subtitle}>
              {messages.checkoutWithCoinbase}
            </div>
          </div>
        </div>
        <Button
          aria-label={messages.buyWithCoinbase}
          text={
            <>
              <span>{messages.buyWith}</span>
              <CoinbaseLogo
                className={styles.coinbaseLogo}
                width={97}
                height={18}
              />
            </>
          }
          type={ButtonType.GLASS}
          includeHoverAnimations
          className={styles.coinbaseButton}
          textClassName={styles.textClassName}
        />
        <ToggleCollapseButton
          className={styles.advancedToggle}
          showText={messages.showAdvanced}
          hideText={messages.hideAdvanced}
        >
          <AdvancedWalletActions />
        </ToggleCollapseButton>
      </div>
    </div>
  )
}
