import React from 'react'

import {
  Button,
  ButtonProps,
  ButtonType,
  IconLink,
  IconShare,
  IconTikTok,
  IconTwitterBird,
  Modal
} from '@audius/stems'

import { messages } from '../messages'

import styles from './DesktopShareModal.module.css'

type ShareActionListItemProps = ButtonProps

const ShareActionListItem = (props: ShareActionListItemProps) => {
  return (
    <li className={styles.actionListItem}>
      <Button
        className={styles.actionButton}
        type={ButtonType.COMMON_ALT}
        {...props}
      />
    </li>
  )
}

type DesktopShareModalProps = {
  onShareToTwitter: () => void
  onShareToTikTok: () => void
  onCopyLink: () => void
  isOpen: boolean
  onClose: () => void
  isOwner: boolean
}

export const DesktopShareModal = ({
  onShareToTwitter,
  onShareToTikTok,
  onCopyLink,
  isOpen,
  onClose,
  isOwner
}: DesktopShareModalProps) => {
  return (
    <Modal
      allowScroll={false}
      bodyClassName={styles.modalBody}
      headerContainerClassName={styles.headerContainer}
      isOpen={isOpen}
      onClose={onClose}
      showTitleHeader
      showDismissButton
      title={
        <h2 className={styles.titleContainer}>
          <IconShare />
          Share Track
        </h2>
      }
    >
      <div className={styles.modalContent}>
        <p className={styles.description}>
          Spread the word! Share with your friends and fans!
        </p>
        <ul className={styles.actionList}>
          <ShareActionListItem
            leftIcon={<IconTwitterBird height={24} width={24} />}
            text={messages.twitter}
            onClick={onShareToTwitter}
            iconClassName={styles.twitterIcon}
            textClassName={styles.twitterActionItemText}
          />
          {isOwner ? (
            <ShareActionListItem
              leftIcon={<IconTikTok />}
              text={messages.tikTok}
              textClassName={styles.tikTokActionItemText}
              onClick={onShareToTikTok}
            />
          ) : null}
          <ShareActionListItem
            leftIcon={<IconLink height={24} width={24} />}
            iconClassName={styles.shareIcon}
            text={messages.copyLink}
            textClassName={styles.shareActionItemText}
            onClick={onCopyLink}
          />
        </ul>
      </div>
    </Modal>
  )
}
