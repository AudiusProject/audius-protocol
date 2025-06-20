import { type AudioWei, AUDIO } from '@audius/fixed-decimal'
import cn from 'classnames'

import styles from './DisplayAudio.module.css'
import TokenHoverTooltip from './TokenHoverTooltip'

type DisplayAudioProps = {
  amount: AudioWei
  showLabel?: boolean
  className?: string
  tokenClassName?: string
}

const messages = {
  currency: '$AUDIO'
}

const DisplayAudio = ({
  amount,
  showLabel = true,
  className,
  tokenClassName
}: DisplayAudioProps) => {
  return (
    <div className={cn({ [className!]: !!className })}>
      <TokenHoverTooltip balance={amount} parentMount>
        <span
          className={cn(styles.amount, {
            [tokenClassName!]: !!tokenClassName
          })}
        >
          {AUDIO(amount).trunc().toLocaleString()}
        </span>
      </TokenHoverTooltip>
      {showLabel && <span className={styles.label}>{messages.currency}</span>}
    </div>
  )
}

export default DisplayAudio
