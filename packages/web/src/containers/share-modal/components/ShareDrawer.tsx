import React, { useCallback } from 'react'

import { IconLink, IconShare, IconTwitterBird } from '@audius/stems'
import cn from 'classnames'

import ActionDrawer from 'components/action-drawer/ActionDrawer'
import { isDarkMode } from 'utils/theme/theme'

import { messages } from '../messages'
import { ShareProps } from '../types'

import { IconTikTok } from './IconTikTok'
import styles from './ShareDrawer.module.css'

const iconSize = { height: 26, width: 26 }

type ShareDrawerProps = ShareProps

export const ShareDrawer = ({
  onShareToTwitter,
  onShareToTikTok,
  onCopyLink,
  isOpen,
  onClose,
  showTikTokShareAction
}: ShareDrawerProps) => {
  const getActions = useCallback(() => {
    const shareToTwitterAction = {
      text: messages.twitter,
      icon: <IconTwitterBird {...iconSize} />,
      className: styles.shareToTwitterAction,
      onClick: onShareToTwitter
    }

    const shareToTikTokAction = {
      text: messages.tikTok,
      icon: <IconTikTok {...iconSize} />,
      className: cn(styles.shareToTikTokAction, {
        [styles.shareToTikTokActionDark]: isDarkMode()
      }),
      onClick: onShareToTikTok
    }

    const copyLinkAction = {
      text: messages.copyLink,
      icon: <IconLink {...iconSize} />,
      className: styles.copyLinkAction,
      onClick: onCopyLink
    }

    return showTikTokShareAction
      ? [shareToTwitterAction, shareToTikTokAction, copyLinkAction]
      : [shareToTwitterAction, copyLinkAction]
  }, [showTikTokShareAction, onShareToTwitter, onShareToTikTok, onCopyLink])

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
