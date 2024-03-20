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
  ButtonProps,
  Button,
  ModalContentText
} from '@audius/harmony'

import { messages } from '../messages'
import { ShareProps } from '../types'

import styles from './ShareDialog.module.css'

type ShareActionListItemProps = ButtonProps

const ShareActionListItem = (props: ShareActionListItemProps) => {
  return (
    <li className={styles.actionListItem}>
      <Button
        variant='common'
        fullWidth
        css={(theme) => ({ color: theme.color.secondary.secondary })}
        className={styles.actionButton}
        {...props}
      />
    </li>
  )
}

type ShareDialogProps = ShareProps

export const ShareDialog = ({
  onShareToDirectMessage,
  onShareToTwitter,
  onCopyLink,
  onEmbed,
  isOpen,
  onClose,
  onClosed,
  shareType,
  isPrivate
}: ShareDialogProps) => {
  return (
    <Modal size='small' isOpen={isOpen} onClose={onClose} onClosed={onClosed}>
      <ModalHeader onClose={onClose}>
        <ModalTitle
          icon={<IconShare />}
          title={messages.modalTitle(shareType)}
        />
      </ModalHeader>
      <ModalContent>
        <div className={styles.modalContent}>
          <ModalContentText>
            {shareType === 'playlist' && isPrivate
              ? messages.hiddenPlaylistShareDescription
              : messages.shareDescription}
          </ModalContentText>
          <ul className={styles.actionList}>
            <ShareActionListItem
              iconLeft={IconMessage}
              onClick={onShareToDirectMessage}
            >
              {messages.directMessage}
            </ShareActionListItem>
            <ShareActionListItem
              iconLeft={IconTwitterBird}
              onClick={onShareToTwitter}
            >
              {messages.twitter}
            </ShareActionListItem>
            <ShareActionListItem iconLeft={IconLink} onClick={onCopyLink}>
              {messages.copyLink}
            </ShareActionListItem>
            {onEmbed ? (
              <ShareActionListItem iconLeft={IconEmbed} onClick={onEmbed}>
                {messages.embed}
              </ShareActionListItem>
            ) : null}
          </ul>
        </div>
      </ModalContent>
    </Modal>
  )
}
