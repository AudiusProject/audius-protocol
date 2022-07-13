import {
  Button,
  ButtonProps,
  ButtonType,
  IconLink,
  IconShare,
  IconTwitterBird,
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle
} from '@audius/stems'
import cn from 'classnames'

import { isDarkMode, isMatrix } from 'utils/theme/theme'

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
  onShareToTwitter,
  onShareToTikTok,
  onCopyLink,
  isOpen,
  onClose,
  onClosed,
  showTikTokShareAction,
  shareType
}: ShareDialogProps) => {
  const isLightMode = !(isDarkMode() || isMatrix())
  return (
    <Modal
      allowScroll={false}
      bodyClassName={styles.modalBody}
      headerContainerClassName={styles.headerContainer}
      isOpen={isOpen}
      onClose={onClose}
      onClosed={onClosed}>
      <ModalHeader onClose={onClose}>
        <ModalTitle
          icon={<IconShare className={styles.titleIcon} />}
          title={messages.modalTitle(shareType)}
        />
      </ModalHeader>
      <ModalContent>
        <div className={styles.modalContent}>
          <p className={styles.description}>
            Spread the word! Share with your friends and fans!
          </p>
          <ul className={styles.actionList}>
            <ShareActionListItem
              leftIcon={<IconTwitterBird {...iconProps} />}
              text={messages.twitter}
              onClick={onShareToTwitter}
              iconClassName={styles.twitterIcon}
              textClassName={styles.twitterActionLabel}
            />
            {showTikTokShareAction ? (
              <ShareActionListItem
                leftIcon={<IconTikTok {...iconProps} />}
                text={messages.tikTok}
                iconClassName={
                  isLightMode ? styles.tikTokIcon : styles.tikTokIconDark
                }
                textClassName={
                  isLightMode
                    ? styles.tikTokActionLabel
                    : styles.tikTokActionLabelDark
                }
                onClick={onShareToTikTok}
              />
            ) : null}
            <ShareActionListItem
              leftIcon={<IconLink {...iconProps} />}
              iconClassName={styles.shareIcon}
              text={messages.copyLink(shareType)}
              textClassName={styles.shareActionLabel}
              onClick={onCopyLink}
            />
          </ul>
        </div>
      </ModalContent>
    </Modal>
  )
}
