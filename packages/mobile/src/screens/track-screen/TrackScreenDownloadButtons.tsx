import { useCallback } from 'react'

import { tracksSocialActions } from '@audius/common'
import type { ButtonType as DownloadButtonType } from '@audius/common/hooks'
import { ButtonState, useDownloadTrackButtons } from '@audius/common/hooks'
import { Name } from '@audius/common/models'
import type { ID } from '@audius/common/models'
import { View } from 'react-native'
import { useDispatch } from 'react-redux'

import IconDownload from 'app/assets/images/iconDownload.svg'
import { Button } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { useToast } from 'app/hooks/useToast'
import { make, track } from 'app/services/analytics'
import { makeStyles } from 'app/styles'
const { downloadTrack } = tracksSocialActions

export type DownloadButtonProps = {
  state: ButtonState
  type: DownloadButtonType
  label: string
  hasDownloadAccess: boolean
  onClick?: () => void
}

export const messages = {
  followToDownload: 'Must follow artist to download',
  addDownloadPrefix: (label: string) => `Download ${label}`,
  mustHaveAccess: 'Must have access to download'
}

const useStyles = makeStyles(() => ({
  buttonContainer: {
    alignSelf: 'center',
    marginBottom: 6
  }
}))

const DownloadButton = ({
  label,
  state,
  hasDownloadAccess,
  onClick = () => {}
}: DownloadButtonProps) => {
  const { toast } = useToast()

  const styles = useStyles()
  const requiresFollow = state === ButtonState.REQUIRES_FOLLOW
  const isProcessing = state === ButtonState.PROCESSING
  const isDisabled =
    !hasDownloadAccess || state === ButtonState.PROCESSING || requiresFollow

  const handlePress = useCallback(() => {
    if (requiresFollow) {
      toast({ content: messages.followToDownload })
    }

    if (!hasDownloadAccess) {
      toast({ content: messages.mustHaveAccess })
    }

    if (isDisabled) {
      return
    }

    onClick()
  }, [isDisabled, onClick, requiresFollow, hasDownloadAccess, toast])

  // Manually handling disabled state in order to show a toast
  // when a follow is required
  return (
    <Button
      variant='common'
      icon={isProcessing ? LoadingSpinner : IconDownload}
      iconPosition='left'
      title={messages.addDownloadPrefix(label)}
      styles={{
        root: styles.buttonContainer,
        button: isDisabled && { opacity: 0.5 }
      }}
      onPress={handlePress}
      size='small'
    />
  )
}

type TrackScreenDownloadButtonsProps = {
  following: boolean
  hasDownloadAccess: boolean
  isHidden?: boolean
  isOwner: boolean
  trackId: ID
}

export const TrackScreenDownloadButtons = ({
  following,
  hasDownloadAccess,
  isOwner,
  trackId
}: TrackScreenDownloadButtonsProps) => {
  const dispatch = useDispatch()

  const handleDownload = useCallback(
    ({
      trackId,
      category,
      parentTrackId
    }: {
      trackId: ID
      category?: string
      parentTrackId?: ID
      original?: boolean
    }) => {
      dispatch(downloadTrack(trackId, category))
      track(
        make({
          eventName: Name.TRACK_PAGE_DOWNLOAD,
          id: trackId,
          category,
          parent_track_id: parentTrackId
        })
      )
    },
    [dispatch]
  )

  const buttons = useDownloadTrackButtons({
    trackId,
    onDownload: handleDownload,
    isOwner,
    following
  })

  const shouldHide = buttons.length === 0
  if (shouldHide) {
    return null
  }

  return (
    <View style={{ marginBottom: 12 }}>
      {buttons.map((props) => (
        <DownloadButton
          {...props}
          hasDownloadAccess={hasDownloadAccess}
          key={props.label}
        />
      ))}
    </View>
  )
}
