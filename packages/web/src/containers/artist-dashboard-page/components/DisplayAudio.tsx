import React from 'react'
import { BNWei, formatWei } from 'store/wallet/slice'
import styles from './DisplayAudio.module.css'
import cn from 'classnames'
import TokenHoverTooltip from './TokenHoverTooltip'

type DisplayAudioProps = {
  amount: BNWei
  className?: string
}

const messages = {
  currency: '$AUDIO'
}

const DisplayAudio = ({ amount, className }: DisplayAudioProps) => {
  return (
    <div className={cn({ [className!]: !!className })}>
      <TokenHoverTooltip balance={amount} parentMount>
        <span className={styles.amount}>{formatWei(amount, true)}</span>
      </TokenHoverTooltip>
      <span className={styles.label}>{messages.currency}</span>
    </div>
  )
}

export default DisplayAudio
