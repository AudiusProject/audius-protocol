import React, { useCallback, useContext } from 'react'

import {
  IconLink,
  IconTikTok,
  IconTikTokInverted,
  IconTwitterBird
} from '@audius/stems'
import { useDispatch, useSelector } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import { Name } from 'common/models/Analytics'
import { CommonState } from 'common/store'
import { getAccountUser } from 'common/store/account/selectors'
import { getUser } from 'common/store/cache/users/selectors'
import { shareTrack } from 'common/store/social/tracks/actions'
import { getSource, getTrack } from 'common/store/ui/share-modal/selectors'
import { requestOpen as requestOpenTikTokModal } from 'common/store/ui/share-sound-to-tiktok-modal/slice'
import ActionDrawer from 'components/action-drawer/ActionDrawer'
import { ToastContext } from 'components/toast/ToastContext'
import { make, useRecord } from 'store/analytics/actions'
import { getCopyableLink } from 'utils/clipboardUtil'
import { SHARE_TOAST_TIMEOUT_MILLIS } from 'utils/constants'
import { isDarkMode } from 'utils/theme/theme'
import { openTwitterLink } from 'utils/tweet'

import { messages } from '../messages'

import styles from './ShareDrawer.module.css'

export const ShareDrawer = () => {
  const [isOpen, setIsOpen] = useModalState('Share')
  const { toast } = useContext(ToastContext)
  const dispatch = useDispatch()
  const track = useSelector(getTrack)
  const artist = useSelector((state: CommonState) =>
    getUser(state, { id: track?.owner_id })
  )
  const account = useSelector(getAccountUser)
  const source = useSelector(getSource)
  const record = useRecord()

  const getActions = useCallback(() => {
    const isOwner = account && artist && account.user_id === artist.user_id

    const shareToTwitterAction = {
      text: messages.twitter,
      icon: <IconTwitterBird height={20} width={26} />,
      className: styles.shareToTwitterAction,
      onClick: () => {
        if (track && artist && source) {
          const twitterText = `Check out ${track.title} by ${artist.handle} on @AudiusProject #Audius`
          const trackLink = getCopyableLink(track.permalink)
          openTwitterLink(trackLink, twitterText)
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
      }
    }

    const shareToTikTokAction = {
      text: messages.tikTok,
      icon: isDarkMode() ? (
        <IconTikTokInverted height={26} width={26} />
      ) : (
        <IconTikTok height={26} width={26} />
      ),
      onClick: () => {
        if (track) {
          setIsOpen(false)
          dispatch(requestOpenTikTokModal({ id: track.track_id }))
        } else {
          console.error('Tried to share sound to TikTok but track was missing')
        }
      }
    }

    const copyLinkAction = {
      text: messages.copyLink,
      icon: <IconLink height={26} width={26} />,
      className: styles.copyLinkAction,
      onClick: () => {
        if (track && source) {
          dispatch(shareTrack(track.track_id, source))
          toast('Copied Link to Track', SHARE_TOAST_TIMEOUT_MILLIS)
        } else {
          console.error(
            'Tried to copy link to track, but track and/or source was missing'
          )
        }
      }
    }

    return isOwner
      ? [shareToTwitterAction, shareToTikTokAction, copyLinkAction]
      : [shareToTwitterAction, copyLinkAction]
  }, [account, artist, dispatch, record, setIsOpen, source, toast, track])

  return (
    <ActionDrawer
      title='Share Track'
      actions={getActions()}
      didSelectRow={() => {}}
      onClose={() => setIsOpen(false)}
      isOpen={isOpen}
      classes={{ actionItem: styles.actionItem }}
    />
  )
}
