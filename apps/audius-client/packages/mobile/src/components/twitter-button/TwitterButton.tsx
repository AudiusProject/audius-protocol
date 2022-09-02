import { useCallback } from 'react'

import type { Nullable } from '@audius/common'
import {
  useTwitterButtonStatus,
  cacheUsersActions,
  cacheUsersSelectors
} from '@audius/common'
import { useDispatch, useSelector } from 'react-redux'

import IconTwitterBird from 'app/assets/images/iconTwitterBird.svg'
import type { ButtonProps } from 'app/components/core'
import { Button, useOnOpenLink } from 'app/components/core'
import type { make } from 'app/services/analytics'
import { track } from 'app/services/analytics'
import { makeStyles } from 'app/styles'
import { getTwitterLink } from 'app/utils/twitter'
const { getUser } = cacheUsersSelectors
const { fetchUserSocials } = cacheUsersActions

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
  additionalHandle?: string
  shareData: (
    twitterHandle?: Nullable<string>,
    otherHandle?: Nullable<string>
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
  const dispatch = useDispatch()

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

  const handlePress = useCallback(() => {
    if (other.type === 'static' && other.analytics) {
      track(other.analytics)
    }
    if (other.type === 'dynamic') {
      dispatch(fetchUserSocials(other.handle))
      if (other.additionalHandle) {
        dispatch(fetchUserSocials(other.additionalHandle))
      }
      setLoading()
    }
  }, [other, dispatch, setLoading])

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
