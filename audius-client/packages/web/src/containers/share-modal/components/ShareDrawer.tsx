import React, { useContext } from 'react'

import { IconLink } from '@audius/stems'
import { useDispatch, useSelector } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import { shareTrack } from 'common/store/social/tracks/actions'
import { getSource, getTrack } from 'common/store/ui/share-modal/selectors'
import ActionDrawer from 'components/action-drawer/ActionDrawer'
import { ToastContext } from 'components/toast/ToastContext'
import { SHARE_TOAST_TIMEOUT_MILLIS } from 'utils/constants'

import styles from './ShareDrawer.module.css'

export const ShareDrawer = () => {
  const [isOpen, setIsOpen] = useModalState('Share')
  const { toast } = useContext(ToastContext)
  const dispatch = useDispatch()
  const track = useSelector(getTrack)
  const source = useSelector(getSource)

  return (
    <ActionDrawer
      title='Share Track'
      actions={[
        {
          text: 'Copy Link to Track',
          icon: <IconLink height={26} width={26} />,
          className: styles.copyLinkAction,
          onClick: () => {
            if (track && source) {
              dispatch(shareTrack(track.track_id, source))
              toast('Copied Link to Track', SHARE_TOAST_TIMEOUT_MILLIS)
            }
          }
        }
      ]}
      didSelectRow={() => {}}
      onClose={() => setIsOpen(false)}
      isOpen={isOpen}
      classes={{ actionItem: styles.actionItem }}
    />
  )
}
