import { useCallback } from 'react'

import { useTwitterButtonStatus } from '@audius/common/hooks'
import { cacheUsersSelectors } from '@audius/common/store'
import { makeTwitterShareUrl } from '@audius/common/utils'
import type { Nullable } from '@audius/common/utils'
import { useSelector } from 'react-redux'

import type { ButtonProps } from '@audius/harmony-native'
import { IconTwitter, Button } from '@audius/harmony-native'
import { useLink, useOnOpenLink } from 'app/components/core'
import { make, track } from 'app/services/analytics'
import type { AllEvents } from 'app/types/analytics'
const { getUser } = cacheUsersSelectors

const messages = {
  share: 'Share to Twitter'
}

type StaticTwitterProps = {
  type: 'static'
  shareText: string
  analytics?: AllEvents
}

type DynamicTwitterProps = {
  type: 'dynamic'
  handle: string
  additionalHandle?: string
  shareData: (
    twitterHandle?: Nullable<string>,
    otherHandle?: Nullable<string>
  ) => Nullable<{
    shareText: string
    analytics: AllEvents
  }>
}

export type TwitterButtonProps = Partial<ButtonProps> & { url?: string } & (
    | StaticTwitterProps
    | DynamicTwitterProps
  )

export const TwitterButton = (props: TwitterButtonProps) => {
  const { url = null, children = messages.share, ...other } = props
  const openLink = useOnOpenLink()

  const user = useSelector((state) =>
    getUser(state, { handle: 'handle' in other ? other.handle : undefined })
  )

  const additionalUser = useSelector((state) =>
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

  const { onPress: onPressLink } = useLink(
    other.type === 'static' ? makeTwitterShareUrl(url, other.shareText) : ''
  )

  const handlePress = useCallback(() => {
    onPressLink()
    if (other.type === 'static' && other.analytics) {
      track(make(other.analytics))
    }
    if (other.type === 'dynamic') {
      setLoading()
    }
  }, [onPressLink, other, setLoading])

  if (other.type === 'dynamic' && shareTwitterStatus === 'success') {
    const handle = twitterHandle ? `@${twitterHandle}` : userName
    const otherHandle = other.additionalHandle
      ? additionalTwitterHandle
        ? `@${additionalTwitterHandle}`
        : additionalUserName
      : null

    const twitterData = other.shareData(handle, otherHandle)

    if (twitterData) {
      const { shareText, analytics } = twitterData
      openLink(makeTwitterShareUrl(url, shareText))
      track(make(analytics))
      setIdle()
    }
  }

  return (
    <Button
      color='blue'
      iconLeft={IconTwitter}
      onPress={handlePress}
      {...other}
    >
      {children}
    </Button>
  )
}
