import React, { useCallback, useContext } from 'react'

import { useDispatch, useSelector } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import { Name } from 'common/models/Analytics'
import { CommonState } from 'common/store'
import { getAccountUser } from 'common/store/account/selectors'
import { getUser } from 'common/store/cache/users/selectors'
import { shareTrack } from 'common/store/social/tracks/actions'
import { getSource, getTrack } from 'common/store/ui/share-modal/selectors'
import { ToastContext } from 'components/toast/ToastContext'
import { make, useRecord } from 'store/analytics/actions'
import { isMobile } from 'utils/clientUtil'
import { getCopyableLink } from 'utils/clipboardUtil'
import { SHARE_TOAST_TIMEOUT_MILLIS } from 'utils/constants'
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
  const artist = useSelector((state: CommonState) =>
    getUser(state, { id: track?.owner_id })
  )
  const account = useSelector(getAccountUser)
  const source = useSelector(getSource)

  const isOwner = Boolean(
    account && artist && account.user_id === artist.user_id
  )

  const handleClose = useCallback(() => {
    setIsOpen(false)
  }, [setIsOpen])

  const handleShareToTwitter = useCallback(() => {
    if (track && artist && source) {
      const twitterText = `Check out ${track.title} by ${artist.handle} on @AudiusProject #Audius`
      const trackLink = getCopyableLink(track.permalink)
      openTwitterLink(trackLink, twitterText)
      handleClose()
      record(
        make(Name.SHARE_TO_TWITTER, {
          kind: 'track',
          source,
          id: track.track_id,
          url: trackLink
        })
      )
    } else {
      console.error(
        'Tried to share a track to twitter, but track and/or artist was missing'
      )
    }
  }, [artist, handleClose, record, source, track])

  const handleShareToTikTok = useCallback(() => {
    if (track) {
      dispatch(requestOpenTikTokModal({ id: track.track_id }))
      handleClose()
    } else {
      console.error('Tried to share sound to TikTok but track was missing')
    }
  }, [track, dispatch, handleClose])

  const handleCopyLink = useCallback(() => {
    if (track && source) {
      dispatch(shareTrack(track.track_id, source))
      toast('Copied Link to Track', SHARE_TOAST_TIMEOUT_MILLIS)
      handleClose()
    } else {
      console.error(
        'Tried to copy link to track, but track and/or source was missing'
      )
    }
  }, [dispatch, toast, track, source, handleClose])

  const shareProps = {
    isOpen,
    isOwner,
    onShareToTwitter: handleShareToTwitter,
    onShareToTikTok: handleShareToTikTok,
    onCopyLink: handleCopyLink,
    onClose: handleClose
  }

  if (IS_NATIVE_MOBILE) return null
  if (isMobile()) return <ShareDrawer {...shareProps} />
  return <ShareDialog {...shareProps} />
}
function requestOpenTikTokModal(arg0: { id: number }): any {
  throw new Error('Function not implemented.')
}
