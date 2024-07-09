import { MouseEvent, ReactNode, useCallback } from 'react'

import { useGetPlaylistById, useGetTrackById } from '@audius/common/api'
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

type ViewerActionButtonProps = {
  contentId: ID // Collection or Track ID
  contentType: 'track' | 'collection'
  hasStreamAccess?: boolean
  isDisabled?: boolean
  isLoading?: boolean
  rightActions?: ReactNode
  bottomBar?: ReactNode
  isDarkMode?: boolean
  isMatrixMode: boolean
  showIconButtons?: boolean
  onClickRepost: (e: MouseEvent) => void
  onClickFavorite: (e?: MouseEvent) => void
  onClickShare: (e?: MouseEvent) => void
  onClickGatedUnlockPill?: (e: MouseEvent) => void
}

const useEntityDetails = (contentId: ID, type: 'track' | 'collection') => {
  const { data: track } = useGetTrackById({ id: contentId })
  const { data: collection } = useGetPlaylistById({ playlistId: contentId })

  const {
    stream_conditions: streamConditions,
    has_current_user_saved: isFavorited,
    has_current_user_reposted: isReposted
  } = (type === 'track' ? track : collection) ?? {}

  const isUnlisted =
    type === 'track' ? track?.is_unlisted : collection?.is_private
  return {
    streamConditions,
    isUnlisted,
    isFavorited,
    isReposted
  }
}

export const ViewerActionButtons = ({
  contentId,
  contentType,
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
}: ViewerActionButtonProps) => {
  const { streamConditions, isUnlisted, isFavorited, isReposted } =
    useEntityDetails(contentId, contentType)

  const gatedStatusMap = useSelector(getGatedContentStatusMap)
  const gatedStatus = contentId && gatedStatusMap[contentId]

  const repostLabel = isReposted ? messages.unrepost : messages.repost

  const onStopPropagation = useCallback((e: any) => e.stopPropagation(), [])

  if (streamConditions && !isLoading && !hasStreamAccess) {
    return (
      <Flex justifyContent='space-between' w='100%' alignItems='center'>
        <Text variant='title' size='s'>
          <GatedConditionsPill
            streamConditions={streamConditions}
            unlocking={gatedStatus === 'UNLOCKING'}
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
