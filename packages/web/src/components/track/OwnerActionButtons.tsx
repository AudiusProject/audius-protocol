import { ReactNode, useCallback } from 'react'

import { useGetPlaylistById, useGetTrackById } from '@audius/common/api'
import { ID } from '@audius/common/models'
import {
  publishTrackConfirmationModalUIActions,
  trackPageActions,
  useEditTrackModal
} from '@audius/common/store'
import {
  Flex,
  IconButton,
  IconPencil,
  IconRocket,
  IconShare
} from '@audius/harmony'
import { useDispatch } from 'react-redux'

import Tooltip from 'components/tooltip/Tooltip'

const { requestOpen: openPublishTrackConfirmationModal } =
  publishTrackConfirmationModalUIActions
const { makeTrackPublic } = trackPageActions

const messages = {
  share: 'Share',
  edit: 'Edit Track',
  publish: 'Make Public'
}

type OwnerActionButtonProps = {
  contentId: ID
  contentType: 'track' | 'collection'
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
  contentId,
  contentType,
  isDisabled,
  isLoading,
  rightActions,
  bottomBar,
  showIconButtons,
  onClickShare
}: OwnerActionButtonProps) => {
  const dispatch = useDispatch()
  const { data: track } = useGetTrackById({ id: contentId })
  const { data: collection } = useGetPlaylistById({ playlistId: contentId })
  const isUnlisted =
    contentType === 'track' ? track?.is_unlisted : collection?.is_private
  const { onOpen: onEditTrackOpen } = useEditTrackModal()

  const onStopPropagation = useCallback((e: any) => e.stopPropagation(), [])

  // TODO: move this up a level
  const handleEdit = useCallback(() => {
    onEditTrackOpen({ trackId: contentId })
  }, [onEditTrackOpen, contentId])

  // TODO: move this up a level
  const handlePublishClick = useCallback(() => {
    dispatch(
      openPublishTrackConfirmationModal({
        confirmCallback: () => {
          dispatch(makeTrackPublic(contentId))
        }
      })
    )
  }, [dispatch, contentId])

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
              <IconButton
                size='m'
                icon={IconShare}
                onClick={onClickShare}
                aria-label={messages.share}
                color='subdued'
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
