import { useEffect, useState } from 'react'

import {
  ID,
  StringWei,
  Nullable,
  formatWei,
  stringWeiToBN,
  tippingSelectors,
  topSupportersUserListSelectors,
  supportingUserListSelectors,
  SUPPORTING_USER_LIST_TAG,
  TOP_SUPPORTERS_USER_LIST_TAG
} from '@audius/common'
import { IconTrophy, IconTrending } from '@audius/stems'
import cn from 'classnames'

import { ReactComponent as IconTip } from 'assets/img/iconTip.svg'
import { useSelector } from 'common/hooks/useSelector'
import { TIPPING_TOP_RANK_THRESHOLD } from 'utils/constants'

import styles from './ArtistChip.module.css'
const { getId: getSupportingId } = supportingUserListSelectors
const { getId: getSupportersId } = topSupportersUserListSelectors
const { getOptimisticSupporters, getOptimisticSupporting } = tippingSelectors

const messages = {
  audio: '$AUDIO',
  supporter: 'Supporter'
}

type ArtistChipTipsProps = {
  artistId: ID
  tag: string
}

export const ArtistChipTips = ({ artistId, tag }: ArtistChipTipsProps) => {
  const supportingId = useSelector(getSupportingId)
  const supportersId = useSelector(getSupportersId)
  const supportingMap = useSelector(getOptimisticSupporting)
  const supportersMap = useSelector(getOptimisticSupporters)
  const [amount, setAmount] = useState<Nullable<StringWei>>(null)
  const [rank, setRank] = useState<Nullable<number>>(null)

  useEffect(() => {
    if (artistId && supportingId && tag === SUPPORTING_USER_LIST_TAG) {
      const userSupportingMap = supportingMap[supportingId] ?? {}
      const artistSupporting = userSupportingMap[artistId] ?? {}
      setAmount(artistSupporting.amount ?? null)
    } else if (
      artistId &&
      supportersId &&
      tag === TOP_SUPPORTERS_USER_LIST_TAG
    ) {
      const userSupportersMap = supportersMap[supportersId] ?? {}
      const artistSupporter = userSupportersMap[artistId] ?? {}
      setRank(artistSupporter.rank ?? null)
      setAmount(artistSupporter.amount ?? null)
    }
  }, [artistId, supportingId, supportersId, supportingMap, supportersMap, tag])

  return (
    <div className={styles.tipContainer}>
      {TOP_SUPPORTERS_USER_LIST_TAG === tag ? (
        <div className={styles.rank}>
          {rank && rank >= 1 && rank <= TIPPING_TOP_RANK_THRESHOLD ? (
            <div className={styles.topSupporter}>
              <IconTrophy className={styles.icon} />
              <span className={styles.topRankNumber}>#{rank}</span>
              <span>{messages.supporter}</span>
            </div>
          ) : (
            <div className={styles.supporter}>
              <IconTrending className={styles.icon} />
              <span className={styles.rankNumber}>#{rank}</span>
            </div>
          )}
        </div>
      ) : null}
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
