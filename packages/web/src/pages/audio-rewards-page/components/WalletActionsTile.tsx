import {
  BNWei,
  tokenDashboardPageActions,
  tokenDashboardPageSelectors,
  walletSelectors
} from '@audius/common'
import { Button, ButtonType } from '@audius/stems'
import BN from 'bn.js'
import cn from 'classnames'
import { useDispatch } from 'react-redux'

import { ReactComponent as IconReceive } from 'assets/img/iconReceive.svg'
import { ReactComponent as IconSend } from 'assets/img/iconSend.svg'
import { useSelector } from 'utils/reducer'

import styles from './WalletActionsTile.module.css'
const { getAccountBalance } = walletSelectors
const { getHasAssociatedWallets } = tokenDashboardPageSelectors
const { pressReceive, pressSend, pressConnectWallets } =
  tokenDashboardPageActions

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
  const hasMultipleWallets = useSelector(getHasAssociatedWallets)

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
