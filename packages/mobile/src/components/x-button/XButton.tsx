import { useCallback } from 'react'

import { useUserByHandle } from '@audius/common/api'
import { makeXShareUrl } from '@audius/common/utils'
import type { Nullable } from '@audius/common/utils'

import type { ButtonProps } from '@audius/harmony-native'
import { IconX, Button } from '@audius/harmony-native'
import { useLink, useOnOpenLink } from 'app/components/core'
import { make, track } from 'app/services/analytics'
import type { AllEvents } from 'app/types/analytics'

const messages = {
  share: 'Share to X'
}

type StaticXProps = {
  type: 'static'
  shareText: string
  analytics?: AllEvents
}

type DynamicXProps = {
  type: 'dynamic'
  handle: string
  additionalHandle?: string
  shareData: (
    xHandle?: Nullable<string>,
    otherHandle?: Nullable<string>
  ) => Nullable<{
    shareText: string
    analytics: AllEvents
  }>
}

export type XButtonProps = Partial<ButtonProps> & { url?: string } & (
    | StaticXProps
    | DynamicXProps
  )

export const XButton = (props: XButtonProps) => {
  const { url = null, children = messages.share, ...other } = props
  const openLink = useOnOpenLink()

  const { data: user } = useUserByHandle(
    'handle' in other ? other.handle : undefined
  )

  const { data: additionalUser } = useUserByHandle(
    'additionalHandle' in other ? other.additionalHandle : undefined
  )

  const { onPress: onPressLink } = useLink(
    other.type === 'static' ? makeXShareUrl(url, other.shareText) : ''
  )

  const handlePress = useCallback(() => {
    if (other.type === 'static') {
      onPressLink()
      if (other.analytics) {
        track(make(other.analytics))
      }
    } else if (other.type === 'dynamic' && user?.handle) {
      const handle = user?.handle ? `@${user?.handle}` : user?.name
      const otherHandle = other.additionalHandle
        ? additionalUser?.handle
          ? `@${additionalUser?.handle}`
          : additionalUser?.name
        : null

      const xData = other.shareData(handle, otherHandle)

      if (xData) {
        const { shareText, analytics } = xData
        openLink(makeXShareUrl(url, shareText))
        track(make(analytics))
      }
    }
  }, [onPressLink, other, user, additionalUser, openLink, url])

  return (
    <Button
      variant='secondary'
      iconLeft={IconX}
      onPress={handlePress}
      fullWidth
      {...other}
    >
      {children}
    </Button>
  )
}
