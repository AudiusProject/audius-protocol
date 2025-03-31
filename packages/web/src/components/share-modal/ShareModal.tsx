import { useCallback, useContext } from 'react'

import { useIsManagedAccount } from '@audius/common/hooks'
import { Name, PlayableType } from '@audius/common/models'
import {
  accountSelectors,
  collectionsSocialActions,
  tracksSocialActions,
  usersSocialActions,
  shareModalUISelectors,
  modalsActions,
  useCreateChatModal
} from '@audius/common/store'
import { useDispatch } from 'react-redux'

import { make, useRecord } from 'common/store/analytics/actions'
import * as embedModalActions from 'components/embed-modal/store/actions'
import { ToastContext } from 'components/toast/ToastContext'
import { useIsMobile } from 'hooks/useIsMobile'
import { useModalState } from 'pages/modals/useModalState'
import { SHARE_TOAST_TIMEOUT_MILLIS } from 'utils/constants'
import { useSelector } from 'utils/reducer'
import { openTwitterLink } from 'utils/tweet'

import { ShareDialog } from './components/ShareDialog'
import { ShareDrawer } from './components/ShareDrawer'
import { messages } from './messages'
import { getTwitterShareText } from './utils'

const { getShareState } = shareModalUISelectors
const { shareUser } = usersSocialActions
const { shareTrack } = tracksSocialActions
const { shareAudioNftPlaylist, shareCollection } = collectionsSocialActions
const { getUserId } = accountSelectors
const { setVisibility } = modalsActions

export const ShareModal = () => {
  const { isOpen, onClose, onClosed } = useModalState('Share')

  const { toast } = useContext(ToastContext)
  const dispatch = useDispatch()
  const isMobile = useIsMobile()
  const record = useRecord()
  const { content, source } = useSelector(getShareState)
  const accountUserId = useSelector(getUserId)
  const { onOpen: openCreateChatModal } = useCreateChatModal()
  const isManagerMode = useIsManagedAccount()

  const isOwner =
    content?.type === 'track' && accountUserId === content.artist.user_id

  const handleShareToDirectMessage = useCallback(async () => {
    if (!content) return
    onClose()
    openCreateChatModal({
      // Just care about the link
      presetMessage: (await getTwitterShareText(content, false)).link,
      onCancelAction: setVisibility({ modal: 'Share', visible: true }),
      defaultUserList: 'chats'
    })
    dispatch(make(Name.CHAT_ENTRY_POINT, { source: 'share' }))
  }, [openCreateChatModal, dispatch, onClose, content])

  const handleShareToTwitter = useCallback(async () => {
    if (!source || !content) return
    const isPlaylistOwner =
      content.type === 'audioNftPlaylist' &&
      accountUserId === content.user.user_id
    const { twitterText, link, analyticsEvent } = await getTwitterShareText(
      content,
      isPlaylistOwner
    )
    openTwitterLink(link, twitterText)
    record(make(Name.SHARE_TO_TWITTER, { source, ...analyticsEvent }))
    onClose()
  }, [source, content, accountUserId, record, onClose])

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

  const handleEmbed = useCallback(() => {
    if (content?.type === 'track') {
      dispatch(
        embedModalActions.open(content.track.track_id, PlayableType.TRACK)
      )
      onClose()
    } else if (content?.type === 'playlist') {
      dispatch(
        embedModalActions.open(
          content.playlist.playlist_id,
          PlayableType.PLAYLIST
        )
      )
      onClose()
    } else if (content?.type === 'album') {
      dispatch(
        embedModalActions.open(content.album.playlist_id, PlayableType.ALBUM)
      )
      onClose()
    }
  }, [content, dispatch, onClose])

  const shareProps = {
    isOpen,
    isOwner,
    // Disable DM share in manager mode since we can't do that as a managed user
    onShareToDirectMessage: isManagerMode
      ? undefined
      : handleShareToDirectMessage,
    onShareToTwitter: handleShareToTwitter,
    onCopyLink: handleCopyLink,
    onEmbed: ['playlist', 'album', 'track'].includes(content?.type ?? '')
      ? handleEmbed
      : undefined,
    onClose,
    onClosed,
    shareType: content?.type ?? 'track',
    isPrivate:
      content?.type === 'playlist' ? content.playlist.is_private : false
  }

  if (isMobile) return <ShareDrawer {...shareProps} />
  return <ShareDialog {...shareProps} />
}
