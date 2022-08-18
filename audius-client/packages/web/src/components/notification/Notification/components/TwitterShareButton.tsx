import { MouseEventHandler, useCallback } from 'react'

import { Nullable } from '@audius/common'
import { useDispatch, useSelector } from 'react-redux'

import { ReactComponent as IconTwitterBird } from 'assets/img/iconTwitterBird.svg'
import { useTwitterButtonStatus } from 'common/hooks/useTwitterButtonStatus'
import { CommonState } from 'common/store'
import { make, useRecord } from 'common/store/analytics/actions'
import { fetchUserSocials } from 'common/store/cache/users/actions'
import { getUser } from 'common/store/cache/users/selectors'
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
  additionalHandle?: string
  shareData: (
    twitterHandle: string,
    otherTwitterHandle?: Nullable<string>
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

  const additionalUser = useSelector((state: CommonState) =>
    getUser(state, {
      handle: 'additionalHandle' in other ? other.additionalHandle : undefined
    })
  )

  const {
    userName,
    additionalUserName,
    shareTwitterStatus,
    twitterHandle,
    additionalTwitterHandle,
    setLoading,
    setIdle
  } = useTwitterButtonStatus(user, additionalUser)

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
        if (other.additionalHandle) {
          dispatch(fetchUserSocials(other.additionalHandle))
        }
        setLoading()
      }
    },
    [url, other, dispatch, record, setLoading]
  )

  if (
    other.type === 'dynamic' &&
    shareTwitterStatus === 'success' &&
    userName &&
    (other.additionalHandle ? additionalUserName : true)
  ) {
    const handle = twitterHandle ? `@${twitterHandle}` : userName

    const otherHandle = other.additionalHandle
      ? additionalTwitterHandle
        ? `@${additionalTwitterHandle}`
        : additionalUserName
      : null

    const twitterData = other.shareData(handle, otherHandle)
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
