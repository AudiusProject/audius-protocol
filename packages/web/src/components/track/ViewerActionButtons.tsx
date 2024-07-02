import { MouseEvent, ReactNode, useCallback } from 'react'

import { useGetTrackById } from '@audius/common/api'
import { ID } from '@audius/common/models'
import { gatedContentSelectors } from '@audius/common/store'
import { Flex, Text } from '@audius/harmony'
import { useSelector } from 'react-redux'

import FavoriteButton from 'components/alt-button/FavoriteButton'
import RepostButton from 'components/alt-button/RepostButton'
import ShareButton from 'components/alt-button/ShareButton'
import Tooltip from 'components/tooltip/Tooltip'

import { GatedConditionsPill } from './GatedConditionsPill'
import styles from './desktop/TrackTile.module.css'

const { getGatedContentStatusMap } = gatedContentSelectors

const messages = {
  share: 'Share',
  repost: 'Repost',
  unrepost: 'Unrepost',
  favorite: 'Favorite',
  unfavorite: 'Unfavorite'
}

type BottomRowProps = {
  trackId: ID
  hasStreamAccess?: boolean
  isDisabled?: boolean
  isLoading?: boolean
  rightActions?: ReactNode
  bottomBar?: ReactNode
  isDarkMode?: boolean
  isMatrixMode: boolean
  showIconButtons?: boolean
  onClickRepost: (e?: any) => void
  onClickFavorite: (e?: any) => void
  onClickShare: (e?: any) => void
  onClickGatedUnlockPill?: (e: MouseEvent) => void
}

export const ViewerActionButtons = ({
  trackId,
  hasStreamAccess,
  isDisabled,
  isLoading,
  rightActions,
  bottomBar,
  isDarkMode,
  isMatrixMode,
  showIconButtons,
  onClickRepost,
  onClickFavorite,
  onClickShare,
  onClickGatedUnlockPill
}: BottomRowProps) => {
  const { data: track } = useGetTrackById({ id: trackId })
  const {
    stream_conditions: streamConditions,
    is_unlisted: isUnlisted,
    has_current_user_saved: isFavorited,
    has_current_user_reposted: isReposted
  } = track ?? {}

  const gatedTrackStatusMap = useSelector(getGatedContentStatusMap)
  const gatedTrackStatus = trackId && gatedTrackStatusMap[trackId]

  const repostLabel = isReposted ? messages.unrepost : messages.repost

  const onStopPropagation = useCallback((e: any) => e.stopPropagation(), [])

  if (streamConditions && !isLoading && !hasStreamAccess) {
    return (
      <Flex justifyContent='space-between' w='100%' alignItems='center'>
        <Text variant='title' size='s'>
          <GatedConditionsPill
            streamConditions={streamConditions}
            unlocking={gatedTrackStatus === 'UNLOCKING'}
            onClick={onClickGatedUnlockPill}
          />
        </Text>
        <Flex>{rightActions}</Flex>
      </Flex>
    )
  }

  return (
    <Flex justifyContent='space-between' w='100%' alignItems='center'>
      {bottomBar}
      {!isLoading && showIconButtons && !isUnlisted ? (
        <Flex gap='2xl'>
          <Tooltip
            text={repostLabel}
            disabled={isDisabled}
            placement='top'
            mount='page'
          >
            <Flex css={{ position: 'relative' }}>
              <RepostButton
                aria-label={repostLabel}
                onClick={onClickRepost}
                isDisabled={isDisabled}
                isActive={isReposted}
                isDarkMode={!!isDarkMode}
                isMatrixMode={isMatrixMode}
              />
            </Flex>
          </Tooltip>
          <Tooltip
            text={isFavorited ? messages.unfavorite : messages.favorite}
            disabled={isDisabled}
            placement='top'
            mount='page'
          >
            <Flex css={{ position: 'relative' }}>
              <FavoriteButton
                onClick={onClickFavorite}
                isActive={isFavorited}
                isDisabled={isDisabled}
                isDarkMode={!!isDarkMode}
                isMatrixMode={isMatrixMode}
              />
            </Flex>
          </Tooltip>
          <Tooltip
            text={messages.share}
            disabled={isDisabled}
            placement='top'
            mount='page'
          >
            <Flex css={{ position: 'relative' }} onClick={onStopPropagation}>
              <ShareButton
                onClick={onClickShare}
                isDarkMode={!!isDarkMode}
                className={styles.iconButton}
                stopPropagation={false}
                isMatrixMode={isMatrixMode}
              />
            </Flex>
          </Tooltip>
        </Flex>
      ) : null}
      {!isLoading ? <Flex>{rightActions}</Flex> : null}
    </Flex>
  )
}
