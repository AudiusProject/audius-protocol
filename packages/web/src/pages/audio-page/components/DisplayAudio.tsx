import { BNWei } from '@audius/common/models'
import { formatWei } from '@audius/common/utils'
import cn from 'classnames'

import styles from './DisplayAudio.module.css'
import TokenHoverTooltip from './TokenHoverTooltip'

type DisplayAudioProps = {
  amount: BNWei
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
          {formatWei(amount, true)}
        </span>
      </TokenHoverTooltip>
      {showLabel && <span className={styles.label}>{messages.currency}</span>}
    </div>
  )
}

export default DisplayAudio
