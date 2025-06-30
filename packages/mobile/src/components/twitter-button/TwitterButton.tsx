import { useCallback } from 'react'

import { useUserByHandle } from '@audius/common/api'
import { makeTwitterShareUrl } from '@audius/common/utils'
import type { Nullable } from '@audius/common/utils'

import type { ButtonProps } from '@audius/harmony-native'
import { IconTwitter, Button } from '@audius/harmony-native'
import { useLink, useOnOpenLink } from 'app/components/core'
import { make, track } from 'app/services/analytics'
import type { AllEvents } from 'app/types/analytics'

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

  const { data: user } = useUserByHandle(
    'handle' in other ? other.handle : undefined
  )

  const { data: additionalUser } = useUserByHandle(
    'additionalHandle' in other ? other.additionalHandle : undefined
  )

  const { onPress: onPressLink } = useLink(
    other.type === 'static' ? makeTwitterShareUrl(url, other.shareText) : ''
  )

  const handlePress = useCallback(() => {
    onPressLink()
    if (other.type === 'static' && other.analytics) {
      track(make(other.analytics))
    }
  }, [onPressLink, other])

  if (other.type === 'dynamic' && user?.handle) {
    const handle = user?.handle ? `@${user?.handle}` : user?.name
    const otherHandle = other.additionalHandle
      ? additionalUser?.handle
        ? `@${additionalUser?.handle}`
        : additionalUser?.name
      : null

    const twitterData = other.shareData(handle, otherHandle)

    if (twitterData) {
      const { shareText, analytics } = twitterData
      openLink(makeTwitterShareUrl(url, shareText))
      track(make(analytics))
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
