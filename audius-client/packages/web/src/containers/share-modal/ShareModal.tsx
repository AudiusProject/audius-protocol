import React, { useCallback, useContext } from 'react'

import { useDispatch, useSelector } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import { Name } from 'common/models/Analytics'
import { FeatureFlags } from 'common/services/remote-config'
import { CommonState } from 'common/store'
import { getAccountUser } from 'common/store/account/selectors'
import { getUser } from 'common/store/cache/users/selectors'
import { shareTrack } from 'common/store/social/tracks/actions'
import { shareUser } from 'common/store/social/users/actions'
import { getShareState, getTrack } from 'common/store/ui/share-modal/selectors'
import { requestOpen as requestOpenTikTokModal } from 'common/store/ui/share-sound-to-tiktok-modal/slice'
import { ToastContext } from 'components/toast/ToastContext'
import { useFlag } from 'hooks/useRemoteConfig'
import { make, useRecord } from 'store/analytics/actions'
import { isMobile } from 'utils/clientUtil'
import { SHARE_TOAST_TIMEOUT_MILLIS } from 'utils/constants'
import { fullProfilePage, fullTrackPage } from 'utils/route'
import { openTwitterLink } from 'utils/tweet'

import { ShareDialog } from './components/ShareDialog'
import { ShareDrawer } from './components/ShareDrawer'

const IS_NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

export const ShareModal = () => {
  const [isOpen, setIsOpen] = useModalState('Share')

  const { toast } = useContext(ToastContext)
  const dispatch = useDispatch()
  const record = useRecord()
  const track = useSelector(getTrack)
  const { content, source } = useSelector(getShareState)
  const trackArtist = useSelector((state: CommonState) =>
    getUser(state, { id: track?.owner_id })
  )
  const account = useSelector(getAccountUser)

  const { isEnabled: isShareSoundToTikTokEnabled } = useFlag(
    FeatureFlags.SHARE_SOUND_TO_TIKTOK
  )

  const isOwner = Boolean(
    account && trackArtist && account.user_id === trackArtist.user_id
  )

  const handleClose = useCallback(() => {
    setIsOpen(false)
  }, [setIsOpen])

  const handleShareToTwitter = useCallback(() => {
    let twitterText = ''
    let link = ''
    if (!source || !content) return
    if (content.type === 'track') {
      const { track, artist } = content
      twitterText = `Check out ${track.title} by ${artist.handle} on @AudiusProject #Audius`
      link = fullTrackPage(track.permalink)
      record(
        make(Name.SHARE_TO_TWITTER, {
          kind: 'track',
          source,
          id: track.track_id,
          url: link
        })
      )
    } else {
      const { profile } = content
      twitterText = `Check out ${profile.handle} on @AudiusProject #Audius`
      link = fullProfilePage(profile.handle)
      record(
        make(Name.SHARE_TO_TWITTER, {
          kind: 'profile',
          source,
          id: profile.user_id,
          url: link
        })
      )
    }

    openTwitterLink(link, twitterText)
    handleClose()
  }, [content, source, handleClose, record])

  const handleShareToTikTok = useCallback(() => {
    if (content?.type === 'track') {
      dispatch(requestOpenTikTokModal({ id: content.track.track_id }))
      handleClose()
    } else {
      console.error('Tried to share sound to TikTok but track was missing')
    }
  }, [content, dispatch, handleClose])

  const handleCopyLink = useCallback(() => {
    if (!source || !content) return
    if (content.type === 'track') {
      dispatch(shareTrack(content.track.track_id, source))
      toast('Copied Link to Track', SHARE_TOAST_TIMEOUT_MILLIS)
    } else if (content.type === 'profile') {
      dispatch(shareUser(content.profile.user_id, source))
      toast('Copied Link to Profile', SHARE_TOAST_TIMEOUT_MILLIS)
    }
    handleClose()
  }, [dispatch, toast, content, source, handleClose])

  const shareProps = {
    isOpen,
    isOwner,
    onShareToTwitter: handleShareToTwitter,
    onShareToTikTok: handleShareToTikTok,
    onCopyLink: handleCopyLink,
    onClose: handleClose,
    showTikTokShareAction: Boolean(
      isShareSoundToTikTokEnabled &&
        isOwner &&
        !track?.is_unlisted &&
        !track?.is_delete
    ),
    shareType: content?.type ?? 'track'
  }

  if (IS_NATIVE_MOBILE) return null
  if (isMobile()) return <ShareDrawer {...shareProps} />
  return <ShareDialog {...shareProps} />
}
