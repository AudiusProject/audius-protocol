import { useCallback, useContext } from 'react'

import { Name, FeatureFlags } from '@audius/common'
import { useDispatch } from 'react-redux'

import { getAccountUser } from 'common/store/account/selectors'
import { make, useRecord } from 'common/store/analytics/actions'
import {
  shareAudioNftPlaylist,
  shareCollection
} from 'common/store/social/collections/actions'
import { shareTrack } from 'common/store/social/tracks/actions'
import { shareUser } from 'common/store/social/users/actions'
import { getShareState } from 'common/store/ui/share-modal/selectors'
import { requestOpen as requestOpenTikTokModal } from 'common/store/ui/share-sound-to-tiktok-modal/slice'
import { ToastContext } from 'components/toast/ToastContext'
import { useFlag } from 'hooks/useRemoteConfig'
import { useModalState } from 'pages/modals/useModalState'
import { isMobile } from 'utils/clientUtil'
import { SHARE_TOAST_TIMEOUT_MILLIS } from 'utils/constants'
import { useSelector } from 'utils/reducer'
import { openTwitterLink } from 'utils/tweet'

import { ShareDialog } from './components/ShareDialog'
import { ShareDrawer } from './components/ShareDrawer'
import { messages } from './messages'
import { getTwitterShareText } from './utils'

export const ShareModal = () => {
  const { isOpen, onClose, onClosed } = useModalState('Share')

  const { toast } = useContext(ToastContext)
  const dispatch = useDispatch()
  const record = useRecord()
  const { content, source } = useSelector(getShareState)
  const account = useSelector(getAccountUser)

  const { isEnabled: isShareSoundToTikTokEnabled } = useFlag(
    FeatureFlags.SHARE_SOUND_TO_TIKTOK
  )

  const isOwner =
    content?.type === 'track' && account?.user_id === content.artist.user_id

  const handleShareToTwitter = useCallback(() => {
    if (!source || !content) return
    const isPlaylistOwner =
      content.type === 'audioNftPlaylist' &&
      account?.user_id === content.user.user_id
    const { twitterText, link, analyticsEvent } = getTwitterShareText(
      content,
      isPlaylistOwner
    )
    openTwitterLink(link, twitterText)
    record(make(Name.SHARE_TO_TWITTER, { source, ...analyticsEvent }))
    onClose()
  }, [source, content, account, record, onClose])

  const handleShareToTikTok = useCallback(() => {
    if (content?.type === 'track') {
      dispatch(requestOpenTikTokModal({ id: content.track.track_id }))
      onClose()
    } else {
      console.error('Tried to share sound to TikTok but track was missing')
    }
  }, [content, dispatch, onClose])

  const handleCopyLink = useCallback(() => {
    if (!source || !content) return
    switch (content.type) {
      case 'track':
        dispatch(shareTrack(content.track.track_id, source))
        break
      case 'profile':
        dispatch(shareUser(content.profile.user_id, source))
        break
      case 'album':
        dispatch(shareCollection(content.album.playlist_id, source))
        break
      case 'playlist':
        dispatch(shareCollection(content.playlist.playlist_id, source))
        break
      case 'audioNftPlaylist':
        dispatch(shareAudioNftPlaylist(content.user.handle, source))
        break
    }
    toast(messages.toast(content.type), SHARE_TOAST_TIMEOUT_MILLIS)
    onClose()
  }, [dispatch, toast, content, source, onClose])

  const shareProps = {
    isOpen,
    isOwner,
    onShareToTwitter: handleShareToTwitter,
    onShareToTikTok: handleShareToTikTok,
    onCopyLink: handleCopyLink,
    onClose,
    onClosed,
    showTikTokShareAction: Boolean(
      content?.type === 'track' &&
        isShareSoundToTikTokEnabled &&
        isOwner &&
        !content.track.is_unlisted &&
        !content.track.is_delete
    ),
    shareType: content?.type ?? 'track'
  }

  if (isMobile()) return <ShareDrawer {...shareProps} />
  return <ShareDialog {...shareProps} />
}
