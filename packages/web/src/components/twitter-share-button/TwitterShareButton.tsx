import { MouseEventHandler, useCallback } from 'react'

import {
  Nullable,
  useTwitterButtonStatus,
  CommonState,
  cacheUsersActions,
  cacheUsersSelectors
} from '@audius/common'
import { Button, ButtonProps } from '@audius/harmony'
import { useDispatch, useSelector } from 'react-redux'

import IconTwitterBird from 'assets/img/iconTwitterBird.svg'
import { useRecord, TrackEvent } from 'common/store/analytics/actions'
import { openTwitterLink } from 'utils/tweet'

const { fetchUserSocials } = cacheUsersActions
const { getUser } = cacheUsersSelectors

const messages = {
  share: 'Share to Twitter'
}

type StaticTwitterProps = {
  type: 'static'
  shareText: string
  analytics?: TrackEvent
}

type DynamicTwitterProps = {
  type: 'dynamic'
  handle: string
  name?: string
  additionalHandle?: string
  shareData: (
    twitterHandle: string,
    otherTwitterHandle?: Nullable<string>
  ) => Nullable<{ shareText: string; analytics: TrackEvent }>
}

type TwitterShareButtonProps = {
  url?: string
  hideText?: boolean
  fullWidth?: ButtonProps['fullWidth']
  size?: ButtonProps['size']
} & (StaticTwitterProps | DynamicTwitterProps)

export const TwitterShareButton = (props: TwitterShareButtonProps) => {
  const { url = null, fullWidth, size, hideText, ...other } = props
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
      if (analytics) {
        record(analytics)
      }
      setIdle()
    }
  }

  const colorOverride: Partial<ButtonProps> = {
    color: 'blue'
  }

  return (
    <Button
      fullWidth={fullWidth}
      iconLeft={IconTwitterBird}
      size={size}
      {...colorOverride}
      onClick={handleClick}
    >
      {hideText ? undefined : messages.share}
    </Button>
  )
}
