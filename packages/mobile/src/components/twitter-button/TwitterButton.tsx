import { useCallback } from 'react'

import type { Nullable } from '@audius/common'
import { getUser } from 'audius-client/src/common/store/cache/users/selectors'
import { useTwitterButtonStatus } from 'common/hooks/useTwitterButtonStatus'
import { fetchUserSocials } from 'common/store/cache/users/actions'

import IconTwitterBird from 'app/assets/images/iconTwitterBird.svg'
import type { ButtonProps } from 'app/components/core'
import { Button, useOnOpenLink } from 'app/components/core'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles'
import type { make } from 'app/utils/analytics'
import { track } from 'app/utils/analytics'
import { getTwitterLink } from 'app/utils/twitter'

const messages = {
  share: 'Share to Twitter'
}

const useStyles = makeStyles(({ palette }) => ({
  root: {
    backgroundColor: palette.staticTwitterBlue
  }
}))

type StaticTwitterProps = {
  type: 'static'
  shareText: string
  analytics?: ReturnType<typeof make>
}

type DynamicTwitterProps = {
  type: 'dynamic'
  handle: string
  shareData: (twitterHandle: string | null | undefined) => Nullable<{
    shareText: string
    analytics: ReturnType<typeof make>
  }>
}

export type TwitterButtonProps = Partial<ButtonProps> &
  (StaticTwitterProps | DynamicTwitterProps)

export const TwitterButton = (props: TwitterButtonProps) => {
  const { url = null, style, ...other } = props
  const styles = useStyles()
  const openLink = useOnOpenLink()
  const dispatchWeb = useDispatchWeb()
  const user = useSelectorWeb((state) =>
    getUser(state, { handle: 'handle' in other ? other.handle : undefined })
  )

  const { userName, shareTwitterStatus, twitterHandle, setLoading, setIdle } =
    useTwitterButtonStatus(user)

  const handlePress = useCallback(() => {
    if (other.type === 'static' && other.analytics) {
      track(other.analytics)
    }
    if (other.type === 'dynamic') {
      dispatchWeb(fetchUserSocials(other.handle))
      setLoading()
    }
  }, [other, dispatchWeb, setLoading])

  if (other.type === 'dynamic' && shareTwitterStatus === 'success') {
    const handle = twitterHandle ? `@${twitterHandle}` : userName
    const twitterData = other.shareData(handle)
    if (twitterData) {
      const { shareText, analytics } = twitterData
      openLink(getTwitterLink(url, shareText))
      track(analytics)
      setIdle()
    }
  }

  return (
    <Button
      title={messages.share}
      style={[styles.root, style]}
      icon={IconTwitterBird}
      iconPosition='left'
      url={
        other.type === 'static'
          ? getTwitterLink(url, other.shareText)
          : undefined
      }
      onPress={handlePress}
      {...other}
    />
  )
}
