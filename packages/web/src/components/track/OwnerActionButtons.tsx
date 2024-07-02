import { ReactNode, useCallback } from 'react'

import { useGetTrackById } from '@audius/common/api'
import { ID } from '@audius/common/models'
import {
  publishTrackConfirmationModalUIActions,
  trackPageActions,
  useEditTrackModal
} from '@audius/common/store'
import { Flex, IconButton, IconPencil, IconRocket } from '@audius/harmony'
import { useDispatch } from 'react-redux'

import ShareButton from 'components/alt-button/ShareButton'
import Tooltip from 'components/tooltip/Tooltip'

import styles from './desktop/TrackTile.module.css'
const { requestOpen: openPublishTrackConfirmationModal } =
  publishTrackConfirmationModalUIActions
const { makeTrackPublic } = trackPageActions

const messages = {
  share: 'Share',
  edit: 'Edit Track',
  publish: 'Make Public'
}

type BottomRowProps = {
  trackId: ID
  isDisabled?: boolean
  isLoading?: boolean
  rightActions?: ReactNode
  bottomBar?: ReactNode
  isDarkMode?: boolean
  isMatrixMode: boolean
  showIconButtons?: boolean
  onClickShare: (e?: any) => void
}

export const OwnerActionButtons = ({
  trackId,
  isDisabled,
  isLoading,
  rightActions,
  bottomBar,
  isDarkMode,
  isMatrixMode,
  showIconButtons,
  onClickShare
}: BottomRowProps) => {
  const dispatch = useDispatch()
  const { data: track } = useGetTrackById({ id: trackId })
  const { is_unlisted: isUnlisted } = track ?? {}
  const { onOpen: onEditTrackOpen } = useEditTrackModal()

  const onStopPropagation = useCallback((e: any) => e.stopPropagation(), [])

  const handleEdit = useCallback(() => {
    onEditTrackOpen({ trackId })
  }, [onEditTrackOpen, trackId])

  const handlePublishClick = useCallback(() => {
    dispatch(
      openPublishTrackConfirmationModal({
        confirmCallback: () => {
          dispatch(makeTrackPublic(trackId))
        }
      })
    )
  }, [dispatch, trackId])

  return (
    <Flex justifyContent='space-between' w='100%' alignItems='center'>
      {bottomBar}
      {!isLoading && showIconButtons ? (
        <Flex gap='2xl'>
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
          <Tooltip
            text={messages.edit}
            disabled={isDisabled}
            placement='top'
            mount='page'
          >
            <Flex css={{ position: 'relative' }} onClick={onStopPropagation}>
              <IconButton
                size='m'
                icon={IconPencil}
                onClick={handleEdit}
                aria-label={messages.edit}
                color='subdued'
              />
            </Flex>
          </Tooltip>
          {isUnlisted ? (
            <Tooltip
              text={messages.publish}
              disabled={isDisabled}
              placement='top'
              mount='page'
            >
              <Flex css={{ position: 'relative' }} onClick={onStopPropagation}>
                <IconButton
                  size='m'
                  icon={IconRocket}
                  aria-label='Publish Collection'
                  color='subdued'
                  disabled={isDisabled}
                  onClick={handlePublishClick}
                />
              </Flex>
            </Tooltip>
          ) : null}
        </Flex>
      ) : null}
      {!isLoading ? <Flex>{rightActions}</Flex> : null}
    </Flex>
  )
}
