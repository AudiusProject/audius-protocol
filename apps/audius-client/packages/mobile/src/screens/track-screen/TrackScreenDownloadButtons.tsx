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
import Button, { ButtonType } from 'app/components/button'
import LoadingSpinner from 'app/components/loading-spinner'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { useToast } from 'app/hooks/useToast'
import { font } from 'app/styles'
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
  },
  button: {
    paddingVertical: 4,
    paddingHorizontal: 8
  },
  icon: {
    marginRight: 4
  },
  label: {
    fontSize: 14,
    padding: 0,
    textTransform: 'uppercase',
    ...font('bold'),
    color: palette.neutralLight4
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
      type={ButtonType.COMMON}
      renderIcon={fill =>
        isProcessing ? (
          <LoadingSpinner
            color={fill as string}
            style={{ height: 18, width: 18 }}
          />
        ) : (
          <IconDownload fill={fill} height={18} width={18} />
        )
      }
      iconPosition='left'
      title={messages.addDownloadPrefix(label)}
      style={styles.button}
      containerStyle={[styles.buttonContainer, isDisabled && { opacity: 0.5 }]}
      textStyle={styles.label}
      iconStyle={styles.icon}
      onPress={handlePress}
    />
  )
}

type TrackScreenDownloadButtonsProps = {
  following: boolean
  isHidden?: boolean
  isOwner: boolean
  trackId: ID
  user: User
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
      {buttons.map(props => (
        <DownloadButton {...props} key={props.label} />
      ))}
    </View>
  )
}
