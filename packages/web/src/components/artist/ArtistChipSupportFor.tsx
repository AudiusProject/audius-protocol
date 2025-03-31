import { useSupporter } from '@audius/common/api'
import { ID } from '@audius/common/models'
import { stringWeiToBN, formatWei } from '@audius/common/utils'
import {
  IconTipping as IconTip,
  IconTrophy,
  IconTrending
} from '@audius/harmony'
import cn from 'classnames'

import { TIPPING_TOP_RANK_THRESHOLD } from 'utils/constants'

import styles from './ArtistChip.module.css'

const messages = {
  audio: '$AUDIO',
  supporter: 'Supporter'
}

type ArtistChipTipsProps = {
  artistId: ID
  userId?: ID
}

export const ArtistChipSupportFor = ({
  artistId,
  userId
}: ArtistChipTipsProps) => {
  const { data: supportFor } = useSupporter({
    supporterUserId: artistId,
    userId
  })

  const rank = supportFor?.rank
  const amount = supportFor?.amount

  return (
    <div className={styles.tipContainer}>
      <div className={styles.rank}>
        {rank && rank >= 1 && rank <= TIPPING_TOP_RANK_THRESHOLD ? (
          <div className={styles.topSupporter}>
            <IconTrophy className={styles.icon} />
            <span className={styles.topRankNumber}>#{rank}</span>
            <span>{messages.supporter}</span>
          </div>
        ) : rank ? (
          <div className={styles.supporter}>
            <IconTrending className={styles.icon} />
            <span className={styles.rankNumber}>#{rank}</span>
          </div>
        ) : null}
      </div>
      {amount && (
        <div className={cn(styles.amount)}>
          <IconTip className={styles.icon} />
          <span className={styles.value}>
            {formatWei(stringWeiToBN(amount), true)}
          </span>
          <span className={styles.label}>{messages.audio}</span>
        </div>
      )}
    </div>
  )
}
