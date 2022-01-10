import React, { useCallback } from 'react'

import { IconLink, IconShare, IconTwitterBird } from '@audius/stems'
import cs from 'classnames'

import ActionDrawer from 'components/action-drawer/ActionDrawer'
import { isDarkMode } from 'utils/theme/theme'

import { messages } from '../messages'
import { ShareProps } from '../types'

import { IconTikTok } from './IconTikTok'
import styles from './ShareDrawer.module.css'

type ShareDrawerProps = ShareProps

export const ShareDrawer = ({
  onShareToTwitter,
  onShareToTikTok,
  onCopyLink,
  isOpen,
  onClose,
  isOwner
}: ShareDrawerProps) => {
  const getActions = useCallback(() => {
    const shareToTwitterAction = {
      icon: <IconTwitterBird height={20} width={26} />,
      text: messages.twitter,
      className: styles.shareToTwitterAction,
      onClick: onShareToTwitter
    }

    const shareToTikTokAction = {
      text: messages.tikTok,
      icon: <IconTikTok height={32} width={32} />,
      className: cs(styles.shareToTikTokAction, {
        [styles.shareToTikTokActionDark]: isDarkMode()
      }),
      onClick: onShareToTikTok
    }

    const copyLinkAction = {
      text: messages.copyLink,
      icon: <IconLink height={32} width={32} />,
      className: styles.copyLinkAction,
      onClick: onCopyLink
    }

    return isOwner
      ? [shareToTwitterAction, shareToTikTokAction, copyLinkAction]
      : [shareToTwitterAction, copyLinkAction]
  }, [isOwner, onShareToTwitter, onShareToTikTok, onCopyLink])

  return (
    <ActionDrawer
      renderTitle={() => (
        <div className={styles.titleContainer}>
          <IconShare className={styles.titleIcon} />
          <h2 className={styles.title}>{messages.modalTitle}</h2>
        </div>
      )}
      actions={getActions()}
      onClose={onClose}
      isOpen={isOpen}
      classes={{ actionItem: styles.actionItem }}
    />
  )
}
