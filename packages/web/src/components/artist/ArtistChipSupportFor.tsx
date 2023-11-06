import { useEffect, useState } from 'react'

import {
  ID,
  StringWei,
  Nullable,
  formatWei,
  stringWeiToBN,
  tippingSelectors
} from '@audius/common'
import { IconTrophy, IconTrending } from '@audius/stems'
import cn from 'classnames'

import IconTip from 'assets/img/iconTip.svg'
import { useSelector } from 'common/hooks/useSelector'
import { TIPPING_TOP_RANK_THRESHOLD } from 'utils/constants'

import styles from './ArtistChip.module.css'
const { getOptimisticSupporters, getOptimisticSupporting } = tippingSelectors

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
  const supportingMap = useSelector(getOptimisticSupporting)
  const supportersMap = useSelector(getOptimisticSupporters)
  const [amount, setAmount] = useState<Nullable<StringWei>>(null)
  const [rank, setRank] = useState<Nullable<number>>(null)

  useEffect(() => {
    if (artistId && userId) {
      const userSupportersMap = supportersMap[userId] ?? {}
      const artistSupporter = userSupportersMap[artistId] ?? {}
      setRank(artistSupporter.rank ?? null)
      setAmount(artistSupporter.amount ?? null)
    }
  }, [artistId, supportingMap, supportersMap, userId])

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
