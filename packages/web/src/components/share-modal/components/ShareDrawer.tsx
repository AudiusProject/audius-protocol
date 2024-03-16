import { useCallback } from 'react'

import { IconLink, IconShare, IconTwitter } from '@audius/harmony'

import ActionDrawer from 'components/action-drawer/ActionDrawer'

import { messages } from '../messages'
import { ShareProps } from '../types'

import styles from './ShareDrawer.module.css'

const iconSize = { height: 26, width: 26 }

type ShareDrawerProps = ShareProps

export const ShareDrawer = ({
  onShareToTwitter,
  onCopyLink,
  isOpen,
  onClose,
  shareType
}: ShareDrawerProps) => {
  const getActions = useCallback(() => {
    const shareToTwitterAction = {
      text: messages.twitter,
      icon: <IconTwitter {...iconSize} />,
      className: styles.shareToTwitterAction,
      onClick: onShareToTwitter
    }

    const copyLinkAction = {
      text: messages.copyLink,
      icon: <IconLink {...iconSize} />,
      className: styles.copyLinkAction,
      onClick: onCopyLink
    }

    return [shareToTwitterAction, copyLinkAction]
  }, [onShareToTwitter, onCopyLink])

  return (
    <ActionDrawer
      renderTitle={() => (
        <div className={styles.titleContainer}>
          <IconShare className={styles.titleIcon} />
          <h2 className={styles.title}>{messages.modalTitle(shareType)}</h2>
        </div>
      )}
      actions={getActions()}
      onClose={onClose}
      isOpen={isOpen}
      classes={{ actionItem: styles.actionItem }}
    />
  )
}
