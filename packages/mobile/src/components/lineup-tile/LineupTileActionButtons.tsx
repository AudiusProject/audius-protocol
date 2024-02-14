import type { ReactElement } from 'react'

import type { ID, AccessConditions } from '@audius/common/models'
import { isContentUSDCPurchaseGated } from '@audius/common/models'
import type { Nullable } from '@audius/common/utils'
import { View } from 'react-native'

import {
  IconButton,
  IconKebabHorizontal,
  IconShare
} from '@audius/harmony-native'
import { FavoriteButton } from 'app/components/favorite-button'
import { RepostButton } from 'app/components/repost-button'
import { useIsUSDCEnabled } from 'app/hooks/useIsUSDCEnabled'
import { flexRowCentered, makeStyles } from 'app/styles'
import type { GestureResponderHandler } from 'app/types/gesture'

import { LineupTileAccessStatus } from './LineupTileAccessStatus'

const messages = {
  shareButtonLabel: 'Share Content',
  overflowButtonLabel: 'More Options',
  editButtonLabel: 'Edit Content',
  publishButtonLabel: 'Publish Content'
}

type Props = {
  disabled?: boolean
  readonly?: boolean
  hasReposted?: boolean
  hasSaved?: boolean
  isOwner?: boolean
  isShareHidden?: boolean
  isUnlisted?: boolean
  trackId?: ID
  streamConditions?: Nullable<AccessConditions>
  hasStreamAccess?: boolean
  onPressOverflow?: GestureResponderHandler
  onPressRepost?: GestureResponderHandler
  onPressSave?: GestureResponderHandler
  onPressShare?: GestureResponderHandler
}

const useStyles = makeStyles(({ spacing, palette }) => ({
  bottomButtons: {
    ...flexRowCentered(),
    justifyContent: 'space-between',
    marginHorizontal: spacing(3),
    borderTopWidth: 1,
    borderTopColor: palette.neutralLight8,
    minHeight: spacing(8)
  },
  button: {
    height: spacing(6),
    width: spacing(6),
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonMargin: {
    marginRight: spacing(6)
  },
  leftButtons: {
    ...flexRowCentered(),
    marginVertical: spacing(1)
  }
}))

export const LineupTileActionButtons = ({
  disabled,
  hasReposted,
  hasSaved,
  isOwner,
  isShareHidden,
  isUnlisted,
  trackId,
  hasStreamAccess = false,
  readonly = false,
  streamConditions,
  onPressOverflow,
  onPressRepost,
  onPressSave,
  onPressShare
}: Props) => {
  const styles = useStyles()
  const isUSDCEnabled = useIsUSDCEnabled()
  const isUSDCPurchase =
    isUSDCEnabled && isContentUSDCPurchaseGated(streamConditions)

  const repostButton = (
    <View style={[styles.button, styles.buttonMargin]}>
      <RepostButton
        onPress={onPressRepost}
        isActive={hasReposted}
        isDisabled={disabled || isOwner}
      />
    </View>
  )

  const favoriteButton = (
    <View style={[styles.button, styles.buttonMargin]}>
      <FavoriteButton
        onPress={onPressSave}
        isActive={hasSaved}
        isDisabled={disabled || isOwner}
      />
    </View>
  )

  const shareButton = (
    <IconButton
      color='subdued'
      icon={IconShare}
      disabled={disabled}
      onPress={onPressShare}
      aria-label={messages.shareButtonLabel}
      size='l'
    />
  )

  const moreButton = (
    <IconButton
      color='subdued'
      icon={IconKebabHorizontal}
      disabled={disabled}
      onPress={onPressOverflow}
      aria-label={messages.overflowButtonLabel}
      size='l'
    />
  )

  const showGatedAccessStatus = trackId && !hasStreamAccess
  const showLeftButtons = !showGatedAccessStatus && !isUnlisted

  let content: ReactElement | null = null
  if (readonly) {
    if (isUSDCPurchase && showGatedAccessStatus) {
      content = (
        <View style={styles.leftButtons}>
          <LineupTileAccessStatus
            trackId={trackId}
            streamConditions={streamConditions}
          />
        </View>
      )
    }
  } else {
    content = (
      <>
        <View style={styles.leftButtons}>
          {showGatedAccessStatus && streamConditions != null ? (
            <LineupTileAccessStatus
              trackId={trackId}
              streamConditions={streamConditions}
            />
          ) : null}
          {showLeftButtons && (
            <>
              {repostButton}
              {favoriteButton}
              {!isShareHidden && shareButton}
            </>
          )}
        </View>
        {moreButton}
      </>
    )
  }

  return content ? <View style={styles.bottomButtons}>{content}</View> : null
}
