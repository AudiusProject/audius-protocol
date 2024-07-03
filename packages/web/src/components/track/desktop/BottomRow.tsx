import { MouseEvent, ReactNode, useCallback } from 'react'

import { ID, FieldVisibility, AccessConditions } from '@audius/common/models'
import { gatedContentSelectors } from '@audius/common/store'
import { Nullable } from '@audius/common/utils'
import { Flex, Text } from '@audius/harmony'
import { useSelector } from 'react-redux'

import { GatedConditionsPill } from '../GatedConditionsPill'

import styles from './TrackTile.module.css'
import { ViewerActionButtons } from '../ViewerActionButtons'
import { OwnerActionButtons } from '../OwnerActionButtons'

const { getGatedContentStatusMap } = gatedContentSelectors

type BottomRowProps = {
  hasStreamAccess?: boolean
  isDisabled?: boolean
  isLoading?: boolean
  isFavorited?: boolean
  isReposted?: boolean
  rightActions?: ReactNode
  bottomBar?: ReactNode
  isUnlisted?: boolean
  fieldVisibility?: FieldVisibility
  isOwner: boolean
  isDarkMode?: boolean
  isMatrixMode: boolean
  showIconButtons?: boolean
  trackId?: ID
  streamConditions?: Nullable<AccessConditions>
  onClickRepost: (e?: any) => void
  onClickFavorite: (e?: any) => void
  onClickShare: (e?: any) => void
  onClickGatedUnlockPill?: (e: MouseEvent) => void
}

export const BottomRow = ({
  hasStreamAccess,
  isDisabled,
  isLoading,
  rightActions,
  bottomBar,
  isUnlisted,
  isOwner,
  isDarkMode,
  isMatrixMode,
  showIconButtons,
  trackId,
  streamConditions,
  onClickRepost,
  onClickFavorite,
  onClickShare,
  onClickGatedUnlockPill
}: BottomRowProps) => {
  const gatedTrackStatusMap = useSelector(getGatedContentStatusMap)
  const gatedTrackStatus = trackId && gatedTrackStatusMap[trackId]

  if (streamConditions && !isLoading && !hasStreamAccess) {
    return (
      <Text variant='title' size='s'>
        <GatedConditionsPill
          streamConditions={streamConditions}
          unlocking={gatedTrackStatus === 'UNLOCKING'}
          onClick={onClickGatedUnlockPill}
        />
        <div>{rightActions}</div>
      </Text>
    )
  }

  return (
    <Flex justifyContent='space-between'>
      {bottomBar}
      {!isLoading && showIconButtons && !isUnlisted && (
        <Flex>
          {isOwner ? (
            <OwnerActionButtons
              trackId={trackId}
              onClickFavorite={onClickFavorite}
              onClickRepost={onClickRepost}
              onClickShare={onClickShare}
              isDisabled={isDisabled}
              isMatrixMode={isMatrixMode}
              isDarkMode={isDarkMode}
            />
          ) : (
            <ViewerActionButtons
              trackId={trackId}
              onClickFavorite={onClickFavorite}
              onClickRepost={onClickRepost}
              onClickShare={onClickShare}
              isDisabled={isDisabled}
              isMatrixMode={isMatrixMode}
              isDarkMode={isDarkMode}
            />
          )}
        </Flex>
      )}
      {!isLoading ? rightActions : null}
    </Flex>
  )
}
