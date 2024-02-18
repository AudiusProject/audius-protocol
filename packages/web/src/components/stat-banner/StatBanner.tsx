import { useRef } from 'react'

import { ID } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import {
  IconMessageBlock,
  IconMessageUnblock,
  IconMessageLocked,
  IconShare,
  IconPencil,
  IconKebabHorizontal,
  IconMessage,
  PopupMenu
} from '@audius/harmony'
import { Button, ButtonSize, ButtonType } from '@audius/stems'
import cn from 'classnames'

import { ArtistRecommendationsPopup } from 'components/artist-recommendations/ArtistRecommendationsPopup'
import { FollowButton } from 'components/follow-button/FollowButton'
import Stats, { StatProps } from 'components/stats/Stats'
import SubscribeButton from 'components/subscribe-button/SubscribeButton'
import { useFlag } from 'hooks/useRemoteConfig'

import styles from './StatBanner.module.css'

const BUTTON_COLLAPSE_WIDTHS = {
  first: 1066,
  second: 1140
}

const messages = {
  more: 'More Options',
  share: 'Share',
  shareProfile: 'Share Profile',
  edit: 'Edit Page',
  cancel: 'Cancel',
  save: 'Save Changes',
  message: 'Send Message',
  unblockMessages: 'Unblock Messages',
  blockMessages: 'Block Messages'
}

export type ProfileMode = 'visitor' | 'owner' | 'editing'

type StatsBannerProps = {
  stats?: StatProps[]
  mode?: ProfileMode
  isEmpty?: boolean
  profileId?: number
  areArtistRecommendationsVisible?: boolean
  onCloseArtistRecommendations?: () => void
  onEdit?: () => void
  onShare?: () => void
  onSave?: () => void
  onCancel?: () => void
  onFollow?: () => void
  onUnfollow?: () => void
  following?: boolean
  isSubscribed?: boolean
  onToggleSubscribe?: () => void
  canCreateChat?: boolean
  onMessage?: () => void
  onBlock?: () => void
  onUnblock?: () => void
  isBlocked?: boolean
  accountUserId?: number | null
}

type StatsMenuPopupProps = {
  onShare: () => void
  accountUserId?: ID | null
  isBlocked?: boolean
  onBlock: () => void
  onUnblock: () => void
}

const StatsPopupMenu = ({
  onShare,
  accountUserId,
  isBlocked,
  onBlock,
  onUnblock
}: StatsMenuPopupProps) => {
  const menuItems = [
    {
      text: messages.shareProfile,
      onClick: onShare,
      icon: <IconShare />
    }
  ]

  if (accountUserId) {
    menuItems.push(
      isBlocked
        ? {
            text: messages.unblockMessages,
            onClick: onUnblock,
            icon: <IconMessageUnblock />
          }
        : {
            text: messages.blockMessages,
            onClick: onBlock,
            icon: <IconMessageBlock />
          }
    )
  }
  return (
    <PopupMenu
      items={menuItems}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      renderTrigger={(anchorRef, triggerPopup) => (
        <Button
          ref={anchorRef}
          type={ButtonType.COMMON}
          size={ButtonSize.SMALL}
          className={cn(styles.iconButton, styles.statButton)}
          aria-label={messages.more}
          text={<IconKebabHorizontal />}
          onClick={() => triggerPopup()}
        />
      )}
    />
  )
}

export const StatBanner = (props: StatsBannerProps) => {
  const {
    stats = [
      { number: 0, title: 'tracks' },
      { number: 0, title: 'followers' },
      { number: 0, title: 'reposts' }
    ] as StatProps[],
    mode = 'visitor',
    isEmpty = false,
    profileId,
    areArtistRecommendationsVisible = false,
    onCloseArtistRecommendations,
    onEdit,
    onShare,
    onSave,
    onCancel,
    onFollow,
    onUnfollow,
    following,
    canCreateChat,
    onMessage,
    onBlock,
    onUnblock,
    isBlocked,
    accountUserId,
    isSubscribed,
    onToggleSubscribe
  } = props
  let buttons = null
  const followButtonRef = useRef<HTMLButtonElement>(null)

  const { isEnabled: isChatEnabled } = useFlag(FeatureFlags.CHAT_ENABLED)

  const shareButton = (
    <Button
      type={ButtonType.COMMON}
      size={ButtonSize.SMALL}
      className={cn(styles.statButton)}
      text={messages.share}
      leftIcon={<IconShare />}
      onClick={onShare}
      widthToHideText={BUTTON_COLLAPSE_WIDTHS.first}
    />
  )

  switch (mode) {
    case 'owner':
      buttons = (
        <>
          {shareButton}
          <Button
            className={cn(styles.buttonTwo, styles.statButton)}
            size={ButtonSize.SMALL}
            type={ButtonType.SECONDARY}
            text={messages.edit}
            leftIcon={<IconPencil />}
            onClick={onEdit}
            widthToHideText={BUTTON_COLLAPSE_WIDTHS.second}
          />
        </>
      )
      break
    case 'editing':
      buttons = (
        <>
          <Button
            className={styles.statButton}
            size={ButtonSize.SMALL}
            type={ButtonType.COMMON}
            text={messages.cancel}
            onClick={onCancel}
          />
          <Button
            className={cn(styles.buttonTwo, styles.statButton)}
            size={ButtonSize.SMALL}
            type={ButtonType.PRIMARY_ALT}
            text={messages.save}
            onClick={onSave}
          />
        </>
      )
      break
    default:
      buttons = (
        <>
          {isChatEnabled && onShare && onUnblock && onBlock ? (
            <>
              <StatsPopupMenu
                onShare={onShare}
                accountUserId={accountUserId}
                isBlocked={isBlocked}
                onBlock={onBlock}
                onUnblock={onUnblock}
              />
              {onMessage ? (
                <Button
                  type={ButtonType.COMMON}
                  size={ButtonSize.SMALL}
                  className={cn(styles.iconButton, styles.statButton, {
                    [styles.disabled]: !canCreateChat
                  })}
                  aria-label={messages.message}
                  text={canCreateChat ? <IconMessage /> : <IconMessageLocked />}
                  onClick={onMessage}
                />
              ) : null}
            </>
          ) : (
            shareButton
          )}

          <div className={styles.followContainer}>
            {onToggleSubscribe ? (
              <SubscribeButton
                className={styles.subscribeButton}
                isSubscribed={isSubscribed!}
                isFollowing={following!}
                onToggleSubscribe={onToggleSubscribe}
              />
            ) : null}
            <FollowButton
              ref={followButtonRef}
              following={following}
              onFollow={onFollow}
              onUnfollow={onUnfollow}
              widthToHideText={BUTTON_COLLAPSE_WIDTHS.second}
              className={styles.statButton}
            />
            <ArtistRecommendationsPopup
              anchorRef={followButtonRef}
              artistId={profileId!}
              isVisible={areArtistRecommendationsVisible}
              onClose={onCloseArtistRecommendations!}
            />
          </div>
        </>
      )
      break
  }

  return (
    <div className={styles.wrapper}>
      {!isEmpty ? (
        <div className={styles.statBanner}>
          <div className={styles.stats}>
            <Stats clickable userId={profileId!} stats={stats} size='large' />
          </div>
          <div className={styles.buttons}>{buttons}</div>
        </div>
      ) : null}
    </div>
  )
}
