import { useCallback } from 'react'

import {
  ButtonState,
  ButtonType as DownloadButtonType,
  useDownloadTrackButtons
} from 'audius-client/src/common/hooks/useDownloadTrackButtons'
import { Name } from 'audius-client/src/common/models/Analytics'
import { CID, ID } from 'audius-client/src/common/models/Identifiers'
import { User } from 'audius-client/src/common/models/User'
import { downloadTrack } from 'audius-client/src/common/store/social/tracks/actions'
import { View } from 'react-native'
import { useSelector } from 'react-redux'

import IconDownload from 'app/assets/images/iconDownload.svg'
import { Button } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { useToast } from 'app/hooks/useToast'
import { SearchUser } from 'app/store/search/types'
import { makeStyles } from 'app/styles/makeStyles'
import { make, track } from 'app/utils/analytics'

export type DownloadButtonProps = {
  state: ButtonState
  type: DownloadButtonType
  label: string
  onClick?: () => void
}

export const messages = {
  followToDownload: 'Must follow artist to download',
  addDownloadPrefix: (label: string) => `Download ${label}`
}

const useStyles = makeStyles(({ palette }) => ({
  buttonContainer: {
    alignSelf: 'center',
    marginBottom: 6
  }
}))

const DownloadButton = ({
  label,
  state,
  onClick = () => {}
}: DownloadButtonProps) => {
  const { toast } = useToast()

  const styles = useStyles()
  const requiresFollow = state === ButtonState.REQUIRES_FOLLOW
  const isProcessing = state === ButtonState.PROCESSING
  const isDisabled = state === ButtonState.PROCESSING || requiresFollow

  const handlePress = useCallback(() => {
    if (requiresFollow) {
      toast({ content: messages.followToDownload })
    }

    if (isDisabled) {
      return
    }

    onClick()
  }, [isDisabled, onClick, requiresFollow, toast])

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
  isHidden?: boolean
  isOwner: boolean
  trackId: ID
  user: User | SearchUser
}

export const TrackScreenDownloadButtons = ({
  following,
  isOwner,
  trackId,
  user
}: TrackScreenDownloadButtonsProps) => {
  const dispatchWeb = useDispatchWeb()

  const onDownload = useCallback(
    (id: ID, cid: CID, category?: string, parentTrackId?: ID) => {
      const { creator_node_endpoint } = user
      if (!creator_node_endpoint) {
        return
      }
      dispatchWeb(downloadTrack(id, cid, creator_node_endpoint, category))
      track(
        make({
          eventName: Name.TRACK_PAGE_DOWNLOAD,
          id,
          category,
          parent_track_id: parentTrackId
        })
      )
    },
    [dispatchWeb, user]
  )

  const buttons = useDownloadTrackButtons({
    trackId,
    onDownload,
    isOwner,
    following,
    useSelector: useSelectorWeb as typeof useSelector
  })

  const shouldHide = buttons.length === 0
  if (shouldHide) {
    return null
  }

  return (
    <View style={{ marginBottom: 12 }}>
      {buttons.map((props) => (
        <DownloadButton {...props} key={props.label} />
      ))}
    </View>
  )
}
