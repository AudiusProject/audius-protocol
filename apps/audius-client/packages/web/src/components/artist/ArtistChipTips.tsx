import React, { useEffect, useState } from 'react'

import { IconTrophy, IconTrending } from '@audius/stems'
import cn from 'classnames'

import { ReactComponent as IconTip } from 'assets/img/iconTip.svg'
import { useSelector } from 'common/hooks/useSelector'
import { ID } from 'common/models/Identifiers'
import { StringWei } from 'common/models/Wallet'
import {
  getMainUser,
  getOptimisticSupporters,
  getOptimisticSupporting
} from 'common/store/tipping/selectors'
import { Nullable } from 'common/utils/typeUtils'
import { formatWei, stringWeiToBN } from 'common/utils/wallet'
import { USER_LIST_TAG as SUPPORTING_USER_LIST_TAG } from 'pages/supporting-page/sagas'
import { USER_LIST_TAG as TOP_SUPPORTERS_USER_LIST_TAG } from 'pages/top-supporters-page/sagas'
import { TIPPING_TOP_RANK_THRESHOLD } from 'utils/constants'

import styles from './ArtistChip.module.css'

const messages = {
  audio: '$AUDIO',
  supporter: 'Supporter'
}

type ArtistChipTipsProps = {
  artistId: ID
  tag: string
}

export const ArtistChipTips = ({ artistId, tag }: ArtistChipTipsProps) => {
  const mainUser = useSelector(getMainUser)
  const supportingMap = useSelector(getOptimisticSupporting)
  const supportersMap = useSelector(getOptimisticSupporters)
  const [amount, setAmount] = useState<Nullable<StringWei>>(null)
  const [rank, setRank] = useState<Nullable<number>>(null)

  useEffect(() => {
    if (mainUser && artistId) {
      if (tag === SUPPORTING_USER_LIST_TAG) {
        const userSupportingMap = supportingMap[mainUser.user_id] ?? {}
        const artistSupporting = userSupportingMap[artistId] ?? {}
        setAmount(artistSupporting.amount ?? null)
      } else if (tag === TOP_SUPPORTERS_USER_LIST_TAG) {
        const userSupportersMap = supportersMap[mainUser.user_id] ?? {}
        const artistSupporter = userSupportersMap[artistId] ?? {}
        setRank(artistSupporter.rank ?? null)
        setAmount(artistSupporter.amount ?? null)
      }
    }
  }, [mainUser, artistId, supportingMap, supportersMap, tag])

  return (
    <div className={styles.tipContainer}>
      {TOP_SUPPORTERS_USER_LIST_TAG === tag ? (
        <div className={styles.rank}>
          {rank && rank >= 1 && rank <= TIPPING_TOP_RANK_THRESHOLD ? (
            <div className={styles.topSupporter}>
              <IconTrophy className={styles.icon} />
              <span className={styles.rankNumber}>#{rank}</span>
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
