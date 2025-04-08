import { useSupporter } from '@audius/common/api'
import { ID } from '@audius/common/models'
import { stringWeiToBN, formatWei } from '@audius/common/utils'
import { IconTipping as IconTip } from '@audius/harmony'
import cn from 'classnames'

import styles from './ArtistChip.module.css'

const messages = {
  audio: '$AUDIO'
}

type ArtistChipTipsProps = {
  artistId: ID
  userId: ID
}

export const ArtistChipSupportFrom = ({
  artistId,
  userId
}: ArtistChipTipsProps) => {
  const { data: supportFrom } = useSupporter({
    supporterUserId: userId,
    userId: artistId
  })

  const amount = supportFrom?.amount

  return (
    <div className={styles.tipContainer}>
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
