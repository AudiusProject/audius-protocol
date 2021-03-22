import React from 'react'
import styles from './Tiles.module.css'
import cn from 'classnames'
import { useSelector } from 'utils/reducer'
import {
  getAccountBalance,
  getClaimableBalance,
  StringWei,
  stringWeiToBN,
  formatWei,
  BNWei
} from 'store/wallet/slice'
import BN from 'bn.js'
import { Button, ButtonType } from '@audius/stems'
import { useDispatch } from 'react-redux'
import { ReactComponent as IconSend } from 'assets/img/iconSend.svg'
import { ReactComponent as IconReceive } from 'assets/img/iconReceive.svg'
import {
  pressClaim,
  pressReceive,
  pressSend
} from 'store/token-dashboard/slice'
import TokenHoverTooltip from './components/TokenHoverTooltip'

const messages = {
  claimCTA: 'CLAIM $AUDIO',
  noClaim1: 'You earn $AUDIO by using Audius.',
  noClaim2: 'The more you use Audius, the more $AUDIO you earn.',
  balance: '$AUDIO BALANCE',
  receiveLabel: 'RECEIVE',
  sendLabel: 'SEND',
  unclaimed: 'UNCLAIMED $AUDIO',
  whatIsAudio: 'WHAT IS $AUDIO',
  audioDescription1: `Audius is owned by people like you, not major corporations.`,
  audioDescription2: `Holding $AUDIO grants you partial ownership of the Audius platform and gives you access to special features as they are released.`,
  confused: 'Still confused? Don’t worry, more details coming soon!',
  learnMore: 'Learn More'
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

export const ClaimTile = ({ className }: { className?: string }) => {
  const unclaimedAudio =
    useSelector(getClaimableBalance) ?? stringWeiToBN('0' as StringWei)
  const hasNoClaim = !unclaimedAudio || unclaimedAudio.isZero()
  const dispatch = useDispatch()
  const onClick = () => dispatch(pressClaim())

  return (
    <Tile
      className={cn([
        styles.claimTile,
        { [styles.claimCollapsed]: hasNoClaim },
        className
      ])}
    >
      <>
        <TokenHoverTooltip balance={unclaimedAudio}>
          <div className={styles.claimAmount}>
            {formatWei(unclaimedAudio, true)}
          </div>
        </TokenHoverTooltip>
        <div className={styles.unclaimed}> {messages.unclaimed}</div>
        {hasNoClaim ? (
          <div className={styles.noClaim}>
            <div>{messages.noClaim1}</div>
            <div>{messages.noClaim2}</div>
          </div>
        ) : (
          <Button
            className={styles.claimBtn}
            text={messages.claimCTA}
            onClick={onClick}
            type={ButtonType.COMMON}
          />
        )}
      </>
    </Tile>
  )
}

export const WalletTile = ({ className }: { className?: string }) => {
  const balance = useSelector(getAccountBalance) ?? (new BN(0) as BNWei)
  const hasBalance = balance && !balance.isZero()
  const dispatch = useDispatch()

  const onClickReceive = () => dispatch(pressReceive())
  const onClickSend = () => dispatch(pressSend())

  return (
    <Tile className={cn([styles.walletTile, className])}>
      <>
        <TokenHoverTooltip balance={balance}>
          <div className={styles.balanceAmount}>{formatWei(balance, true)}</div>
        </TokenHoverTooltip>
        <div className={styles.balanceLabel}>{messages.balance}</div>
        <div className={styles.buttons}>
          <Button
            className={cn(styles.balanceBtn, styles.receiveBtn)}
            text={messages.receiveLabel}
            textClassName={styles.textClassName}
            onClick={onClickReceive}
            leftIcon={<IconReceive className={styles.iconStyle} />}
            type={ButtonType.GLASS}
          />
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
        </div>
      </>
    </Tile>
  )
}
