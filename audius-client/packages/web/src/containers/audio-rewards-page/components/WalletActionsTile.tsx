import React from 'react'
import styles from './WalletActionsTile.module.css'
import cn from 'classnames'
import { useSelector } from 'utils/reducer'
import { getAccountBalance, BNWei } from 'store/wallet/slice'
import BN from 'bn.js'
import { Button, ButtonType } from '@audius/stems'
import { useDispatch } from 'react-redux'
import { ReactComponent as IconSend } from 'assets/img/iconSend.svg'
import { ReactComponent as IconReceive } from 'assets/img/iconReceive.svg'
import {
  pressReceive,
  pressSend,
  pressConnectWallets,
  getAssociatedWallets
} from 'store/token-dashboard/slice'

const messages = {
  receiveLabel: 'RECEIVE $AUDIO',
  sendLabel: 'SEND $AUDIO',
  manageWallets: 'Manage Wallets',
  connectWallets: 'Connect Other Wallets'
}

export const WalletActions = ({ className }: { className?: string }) => {
  const balance = useSelector(getAccountBalance) ?? (new BN(0) as BNWei)
  const hasBalance = balance && !balance.isZero()
  const dispatch = useDispatch()

  const onClickReceive = () => dispatch(pressReceive())
  const onClickSend = () => dispatch(pressSend())
  const onClickConnectWallets = () => dispatch(pressConnectWallets())
  const { connectedWallets: wallets } = useSelector(getAssociatedWallets)
  const hasMultipleWallets = (wallets?.length ?? 0) > 0

  return (
    <div className={cn([styles.container, className])}>
      <Button
        className={cn(styles.btn, {
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
        className={cn(styles.btn, styles.receiveBtn)}
        text={messages.receiveLabel}
        textClassName={styles.textClassName}
        onClick={onClickReceive}
        leftIcon={<IconReceive className={styles.iconStyle} />}
        type={ButtonType.GLASS}
      />
      <Button
        className={cn(styles.btn, styles.connectWalletsBtn)}
        text={
          hasMultipleWallets ? messages.manageWallets : messages.connectWallets
        }
        includeHoverAnimations
        textClassName={styles.textClassName}
        onClick={onClickConnectWallets}
        type={ButtonType.GLASS}
      />
    </div>
  )
}

export default WalletActions
