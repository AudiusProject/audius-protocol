import { MouseEventHandler, useCallback } from 'react'

import { Nullable } from '@audius/common'
import { useDispatch, useSelector } from 'react-redux'

import { ReactComponent as IconTwitterBird } from 'assets/img/iconTwitterBird.svg'
import { useTwitterButtonStatus } from 'common/hooks/useTwitterButtonStatus'
import { CommonState } from 'common/store'
import { fetchUserSocials } from 'common/store/cache/users/actions'
import { getUser } from 'common/store/cache/users/selectors'
import { make, useRecord } from 'store/analytics/actions'
import { openTwitterLink } from 'utils/tweet'

import styles from './TwitterShareButton.module.css'

const messages = {
  share: 'Share'
}

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
  const user = useSelector((state: CommonState) =>
    getUser(state, { handle: 'handle' in other ? other.handle : undefined })
  )

  const { userName, shareTwitterStatus, twitterHandle, setLoading, setIdle } =
    useTwitterButtonStatus(user)

  const handleClick: MouseEventHandler<HTMLButtonElement> = useCallback(
    (e) => {
      e.stopPropagation()
      if (other.type === 'static') {
        openTwitterLink(url, other.shareText)
        if (other.analytics) {
          // @ts-ignore issues with record type
          record(other.analytics)
        }
      }
      if (other.type === 'dynamic') {
        dispatch(fetchUserSocials(other.handle))
        setLoading()
      }
    },
    [url, other, dispatch, record, setLoading]
  )

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
      setIdle()
    }
  }

  return (
    <button className={styles.root} onClick={handleClick}>
      <IconTwitterBird className={styles.icon} />
      {messages.share}
    </button>
  )
}
