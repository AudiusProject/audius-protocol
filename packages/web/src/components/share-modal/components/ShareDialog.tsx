import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  IconEmbed,
  IconLink,
  IconMessage,
  IconShare,
  IconTwitter as IconTwitterBird,
  IconWarpcast
} from '@audius/harmony'
import { Button, ButtonProps, ButtonType } from '@audius/stems'
import cn from 'classnames'

import { messages } from '../messages'
import { ShareProps } from '../types'

import { IconTikTok } from './IconTikTok'
import styles from './ShareDialog.module.css'

const iconProps = { height: 24, width: 24 }

type ShareActionListItemProps = ButtonProps

const ShareActionListItem = ({
  textClassName,
  ...props
}: ShareActionListItemProps) => {
  return (
    <li className={styles.actionListItem}>
      <Button
        className={styles.actionButton}
        type={ButtonType.COMMON_ALT}
        textClassName={cn(styles.actionButtonLabel, textClassName)}
        {...props}
      />
    </li>
  )
}

type ShareDialogProps = ShareProps

export const ShareDialog = ({
  onShareToDirectMessage,
  onShareToTwitter,
  onShareToTikTok,
  onShareToWarpcast,
  onCopyLink,
  onEmbed,
  isOpen,
  onClose,
  onClosed,
  showTikTokShareAction,
  shareType,
  isPrivate
}: ShareDialogProps) => {
  return (
    <Modal
      allowScroll={false}
      bodyClassName={styles.modalBody}
      headerContainerClassName={styles.headerContainer}
      isOpen={isOpen}
      onClose={onClose}
      onClosed={onClosed}
    >
      <ModalHeader onClose={onClose}>
        <ModalTitle
          icon={<IconShare className={styles.titleIcon} />}
          title={messages.modalTitle(shareType)}
        />
      </ModalHeader>
      <ModalContent>
        <div className={styles.modalContent}>
          <p className={styles.description}>
            {shareType === 'playlist' && isPrivate
              ? messages.hiddenPlaylistShareDescription
              : messages.shareDescription}
          </p>
          <ul className={styles.actionList}>
            <ShareActionListItem
              leftIcon={<IconMessage {...iconProps} />}
              text={messages.directMessage}
              onClick={onShareToDirectMessage}
              iconClassName={styles.shareIcon}
              textClassName={styles.shareActionLabel}
            />
            <ShareActionListItem
              leftIcon={<IconTwitterBird {...iconProps} />}
              text={messages.twitter}
              onClick={onShareToTwitter}
              iconClassName={styles.shareIcon}
              textClassName={styles.shareActionLabel}
            />
            {showTikTokShareAction ? (
              <ShareActionListItem
                leftIcon={<IconTikTok {...iconProps} />}
                text={messages.tikTok}
                iconClassName={styles.shareIcon}
                textClassName={styles.shareActionLabel}
                onClick={onShareToTikTok}
              />
            ) : null}
            <ShareActionListItem
              leftIcon={<IconWarpcast {...iconProps} />}
              text={messages.warpcast}
              onClick={onShareToWarpcast}
              iconClassName={styles.shareIcon}
              textClassName={styles.shareActionLabel}
            />
            <ShareActionListItem
              leftIcon={<IconLink {...iconProps} />}
              iconClassName={styles.shareIcon}
              text={messages.copyLink}
              textClassName={styles.shareActionLabel}
              onClick={onCopyLink}
            />
            {onEmbed ? (
              <ShareActionListItem
                leftIcon={<IconEmbed {...iconProps} />}
                iconClassName={styles.shareIcon}
                text={messages.embed}
                textClassName={styles.shareActionLabel}
                onClick={onEmbed}
              />
            ) : null}
          </ul>
        </div>
      </ModalContent>
    </Modal>
  )
}
