import { useCallback, useEffect, useState } from 'react'

import { useDispatch, useSelector } from 'react-redux'

import { ReactComponent as IconTwitterBird } from 'assets/img/iconTwitterBird.svg'
import { CommonState } from 'common/store'
import { fetchUserSocials } from 'common/store/cache/users/actions'
import { getUser } from 'common/store/cache/users/selectors'
import { Nullable } from 'common/utils/typeUtils'
import { make, useRecord } from 'store/analytics/actions'
import { openTwitterLink } from 'utils/tweet'

import styles from './TwitterShareButton.module.css'

const messages = {
  share: 'Share'
}

type ShareStatus = 'idle' | 'loading' | 'success'

type StaticTwitterProps = {
  type: 'static'
  shareText: string
  analytics?: ReturnType<typeof make>
}

type DynamicTwitterProps = {
  type: 'dynamic'
  handle: string
  shareData: (
    twitterHandle: string
  ) => Nullable<{ shareText: string; analytics: ReturnType<typeof make> }>
}

type TwitterShareButtonProps = { url?: string } & (
  | StaticTwitterProps
  | DynamicTwitterProps
)

export const TwitterShareButton = (props: TwitterShareButtonProps) => {
  const { url = null, ...other } = props
  const record = useRecord()
  const dispatch = useDispatch()
  const [shareTwitterStatus, setShareTwitterStatus] = useState<ShareStatus>(
    'idle'
  )
  const user = useSelector((state: CommonState) =>
    getUser(state, { handle: 'handle' in other ? other.handle : undefined })
  )
  const userName = user?.name
  const twitterHandle = user ? user.twitter_handle : null

  const handleClick = useCallback(() => {
    if (other.type === 'static') {
      openTwitterLink(url, other.shareText)
      if (other.analytics) {
        // @ts-ignore issues with record type
        record(other.analytics)
      }
    }
    if (other.type === 'dynamic') {
      dispatch(fetchUserSocials(other.handle))
      setShareTwitterStatus('loading')
    }
  }, [url, other, dispatch, record])

  useEffect(() => {
    if (shareTwitterStatus === 'loading' && twitterHandle !== null) {
      setShareTwitterStatus('success')
    }
  }, [shareTwitterStatus, twitterHandle])

  useEffect(() => {
    if (
      other.type === 'dynamic' &&
      shareTwitterStatus === 'success' &&
      userName
    ) {
      const handle = twitterHandle ? `@${twitterHandle}` : userName
      const twitterData = other.shareData(handle)
      if (twitterData) {
        const { shareText, analytics } = twitterData
        openTwitterLink(url, shareText)
        // @ts-ignore issues with record type
        record(analytics)
        setShareTwitterStatus('idle')
      }
    }
  }, [other, shareTwitterStatus, twitterHandle, userName, url, record])

  return (
    <button className={styles.root} onClick={handleClick}>
      <IconTwitterBird className={styles.icon} />
      {messages.share}
    </button>
  )
}
