import { useMemo } from 'react'

import {
  shareSoundToTiktokModalActions,
  shareSoundToTiktokModalSelectors,
  ShareSoundToTiktokModalStatus
} from '@audius/common/store'
import type { Nullable } from '@audius/common/utils'
import { View } from 'react-native'
import { useSelector, useDispatch } from 'react-redux'

import IconTikTok from 'app/assets/images/iconTikTok.svg'
import IconTikTokInverted from 'app/assets/images/iconTikTokInverted.svg'
import Button from 'app/components/button'
import { AppDrawer, useDrawerState } from 'app/components/drawer'
import LoadingSpinner from 'app/components/loading-spinner'
import Text from 'app/components/text'
import { useTikTokAuth } from 'app/hooks/useTikTokAuth'
import { makeStyles } from 'app/styles'
const { getStatus, getTrack } = shareSoundToTiktokModalSelectors
const { authenticated, setStatus, share } = shareSoundToTiktokModalActions

enum FileRequirementError {
  MIN_LENGTH,
  MAX_LENGTH
}

const MODAL_NAME = 'ShareSoundToTikTok'

const messages = {
  completeButton: 'Done',
  confirmation: 'Are you sure you want to share "[Track Name]" to TikTok?',
  error: 'Something went wrong, please try again',
  errorMaxLength: 'Maximum Length for TikTok Sounds is 5 Minutes',
  errorMinLength: 'Minimum Length for TikTok Sounds is 10 Seconds',
  inProgress: 'Sharing "[Track Name]" to TikTok',
  shareButton: 'Share Sound to TikTok',
  success: '"[Track Name]" has been shared to TikTok!',
  title: 'Share to TikTok'
}

const fileRequirementErrorMessages = {
  [FileRequirementError.MAX_LENGTH]: messages.errorMaxLength,
  [FileRequirementError.MIN_LENGTH]: messages.errorMinLength
}

const useStyles = makeStyles(({ palette }) => ({
  content: {
    display: 'flex',
    paddingHorizontal: 32,
    paddingTop: 16,
    paddingBottom: 24,
    alignItems: 'center',
    textAlign: 'center',
    justifyContent: 'space-around'
  },
  header: {
    margin: 16
  },
  titleContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-end'
  },
  title: {
    color: palette.secondaryLight1,
    marginLeft: 8,
    fontSize: 18
  },
  message: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 16
  },
  errorMessage: {
    color: palette.accentRed
  },
  button: {
    width: '100%'
  }
}))

export const ShareToTikTokDrawer = () => {
  const styles = useStyles()

  const { onClose } = useDrawerState(MODAL_NAME)

  const dispatchWeb = useDispatch()

  const track = useSelector(getTrack)
  const status = useSelector(getStatus)

  const withTikTokAuth = useTikTokAuth({
    onError: () =>
      dispatchWeb(
        setStatus({ status: ShareSoundToTiktokModalStatus.SHARE_ERROR })
      )
  })

  const fileRequirementError: Nullable<FileRequirementError> = useMemo(() => {
    if (track) {
      if (track.duration > 300) {
        return FileRequirementError.MAX_LENGTH
      }
      if (track.duration < 10) {
        return FileRequirementError.MIN_LENGTH
      }
    }
    return null
  }, [track])

  const handleShareButtonClick = () => {
    if (track) {
      // Trigger the share process, which initially downloads the track to the client
      dispatchWeb(share())

      // Trigger the authentication process
      withTikTokAuth((accessToken, openId) =>
        dispatchWeb(authenticated({ accessToken, openId }))
      )
    }
  }

  const renderMessage = () => {
    const hasError =
      fileRequirementError !== null ||
      status === ShareSoundToTiktokModalStatus.SHARE_ERROR

    const rawMessage =
      {
        [ShareSoundToTiktokModalStatus.SHARE_STARTED]: messages.inProgress,
        [ShareSoundToTiktokModalStatus.SHARE_SUCCESS]: messages.success,
        [ShareSoundToTiktokModalStatus.SHARE_ERROR]: messages.error,
        [ShareSoundToTiktokModalStatus.SHARE_UNINITIALIZED]:
          messages.confirmation
      }[status as ShareSoundToTiktokModalStatus] ?? messages.confirmation

    if (hasError) {
      const errorMessage =
        status === ShareSoundToTiktokModalStatus.SHARE_ERROR
          ? messages.error
          : fileRequirementErrorMessages[fileRequirementError!]

      return (
        <Text style={[styles.message, styles.errorMessage]}>
          {errorMessage}
        </Text>
      )
    } else {
      return (
        <Text style={styles.message}>
          {rawMessage.replace('[Track Name]', track?.title ?? '')}
        </Text>
      )
    }
  }

  const renderButton = () => {
    if (status === ShareSoundToTiktokModalStatus.SHARE_SUCCESS) {
      return (
        <View style={styles.button}>
          <Button onPress={onClose} title={messages.completeButton} />
        </View>
      )
    } else {
      const isButtonDisabled = fileRequirementError !== null
      return (
        <View style={styles.button}>
          <Button
            style={styles.button}
            disabled={isButtonDisabled}
            onPress={handleShareButtonClick}
            icon={<IconTikTokInverted />}
            title={messages.shareButton}
          />
        </View>
      )
    }
  }

  return (
    <AppDrawer modalName={MODAL_NAME}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <IconTikTok height={24} width={24} />
            <Text style={styles.title} weight='demiBold'>
              {messages.title}
            </Text>
          </View>
        </View>
        {renderMessage()}
        {status === ShareSoundToTiktokModalStatus.SHARE_STARTED ? (
          <LoadingSpinner />
        ) : (
          renderButton()
        )}
      </View>
    </AppDrawer>
  )
}
