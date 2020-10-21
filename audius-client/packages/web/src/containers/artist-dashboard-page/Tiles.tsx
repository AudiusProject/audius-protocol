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
import { ReactComponent as IconDiscord } from 'assets/img/iconDiscord.svg'
import platformTokenImage from 'assets/img/platformToken@2x.png'
import featureChartLevel0 from 'assets/img/featureChartLevel0@2x.png'
import featureChartLevel1 from 'assets/img/featureChartLevel1@2x.png'
import {
  pressClaim,
  pressDiscord,
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
  whyCare: 'And why should YOU care?',
  audioDescription:
    '$AUDIO gives you partial ownership of the Audius platform. Yep, that’s right, Audius is owned by people like you, not major corporations. Holding $AUDIO will also give you access to special features as they are released.',
  learnMore: 'Learn More',
  level1: 'LEVEL 1',
  level1More: '(1 or more $AUDIO)',
  vip: 'Access to our VIP Discord',
  vipDiscord: 'Launch The VIP Discord',
  level2: 'LEVEL 2',
  tba: 'To Be Announced!'
}

type TileProps = {
  className?: string
  children: React.ReactChild
}

const Tile = ({ className, children }: TileProps) => {
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
        <div>
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

export const ExplainerTile = ({ className }: { className?: string }) => {
  const balance = useSelector(getAccountBalance) ?? new BN(0)
  const hasAudio = balance && !balance.isZero()
  const featureChart = hasAudio ? featureChartLevel1 : featureChartLevel0
  const disabled = { [styles.disabled]: !hasAudio }
  const dispatch = useDispatch()
  const onClickDiscord = () => dispatch(pressDiscord())

  return (
    <Tile className={cn([styles.explainerTile, className])}>
      <>
        <div className={styles.platformToken}>
          <img
            alt={'Platform Token'}
            className={styles.platformTokenImage}
            src={platformTokenImage}
          />
        </div>
        <div className={styles.whatIsAudioContainer}>
          <h4 className={styles.whatIsAudio}>{messages.whatIsAudio}</h4>
          <div className={styles.whyCare}>{messages.whyCare}</div>
          <p className={styles.description}>{messages.audioDescription}</p>
          <div className={styles.learnMore}>{messages.learnMore}</div>
          <div className={styles.levels}>
            <img
              alt={'Feature Chart'}
              className={styles.levelImg}
              src={featureChart}
            />
            <div className={cn(styles.levelContainer, disabled)}>
              <div className={styles.level}>
                <span className={styles.levelText}>{messages.level1} </span>
                <span className={styles.levelMore}>{messages.level1More}</span>
              </div>
              <div className={styles.vip}>{messages.vip}</div>
              <Button
                className={cn(styles.vipButton, {
                  [styles.vipDiscordDisabled]: !hasAudio
                })}
                text={messages.vipDiscord}
                isDisabled={!hasAudio}
                includeHoverAnimations={hasAudio}
                textClassName={styles.vipTextClassName}
                onClick={onClickDiscord}
                leftIcon={<IconDiscord className={styles.iconDiscord} />}
                type={ButtonType.GLASS}
              />
            </div>
            <div className={cn(styles.levelContainer, styles.disabled)}>
              <div
                className={cn(styles.level, styles.levelText, styles.disabled)}
              >
                {messages.level2}
              </div>
              <div className={cn(styles.tba, styles.disabled)}>
                {messages.tba}
              </div>
            </div>
          </div>
        </div>
      </>
    </Tile>
  )
}
