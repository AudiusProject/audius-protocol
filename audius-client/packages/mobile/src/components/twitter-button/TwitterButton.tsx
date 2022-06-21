import { useCallback, useEffect, useState } from 'react'

import { getUser } from 'audius-client/src/common/store/cache/users/selectors'
import { Nullable } from 'audius-client/src/common/utils/typeUtils'
import { fetchUserSocials } from 'common/store/cache/users/actions'

import IconTwitterBird from 'app/assets/images/iconTwitterBird.svg'
import { Button, ButtonProps, useOnOpenLink } from 'app/components/core'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles'
import { make, track } from 'app/utils/analytics'
import { getTwitterLink } from 'app/utils/twitter'

const messages = {
  share: 'Share to Twitter'
}

const useStyles = makeStyles(({ palette }) => ({
  root: {
    backgroundColor: palette.staticTwitterBlue
  }
}))

export type ShareStatus = 'idle' | 'loading' | 'success'

type StaticTwitterProps = {
  type: 'static'
  shareText: string
  analytics?: ReturnType<typeof make>
}

type DynamicTwitterProps = {
  type: 'dynamic'
  handle: string
  shareData: (
    twitterHandle: string | null | undefined
  ) => Nullable<{
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
  const [shareTwitterStatus, setShareTwitterStatus] = useState<ShareStatus>(
    'idle'
  )
  const user = useSelectorWeb(state =>
    getUser(state, { handle: 'handle' in other ? other.handle : undefined })
  )
  const userName = user?.name
  const twitterHandle = user ? user.twitter_handle : null

  const handlePress = useCallback(() => {
    if (other.type === 'static' && other.analytics) {
      track(other.analytics)
    }
    if (other.type === 'dynamic') {
      dispatchWeb(fetchUserSocials(other.handle))
      setShareTwitterStatus('loading')
    }
  }, [other, dispatchWeb])

  useEffect(() => {
    if (shareTwitterStatus === 'loading' && twitterHandle !== null) {
      setShareTwitterStatus('success')
    }
  }, [shareTwitterStatus, twitterHandle])

  useEffect(() => {
    if (other.type === 'dynamic' && shareTwitterStatus === 'success') {
      const handle = twitterHandle ? `@${twitterHandle}` : userName
      const twitterData = other.shareData(handle)
      if (twitterData) {
        const { shareText, analytics } = twitterData
        openLink(getTwitterLink(url, shareText))
        track(analytics)
        setShareTwitterStatus('idle')
      }
    }
  }, [other, shareTwitterStatus, twitterHandle, userName, openLink, url])

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
