import { useCallback, useEffect, useState } from 'react'

import { useTrackByPermalink } from '@audius/common/api'
import { useGatedContentAccess } from '@audius/common/hooks'
import { isContentUSDCPurchaseGated } from '@audius/common/models'
import type { AccessConditions } from '@audius/common/models'
import { createRemixOfMetadata } from '@audius/common/schemas'
import type { Nullable } from '@audius/common/utils'
import { getPathFromTrackUrl } from '@audius/common/utils'
import { useFocusEffect } from '@react-navigation/native'
import { useField } from 'formik'
import { View } from 'react-native'
import { useThrottle } from 'react-use'

import {
  IconCaretLeft,
  IconRemix,
  Button,
  Divider
} from '@audius/harmony-native'
import type { TextProps } from 'app/components/core'
import { TextInput, Switch, Text } from 'app/components/core'
import { InputErrorMessage } from 'app/components/core/InputErrorMessage'
import { useNavigation } from 'app/hooks/useNavigation'
import { TopBarIconButton } from 'app/screens/app-screen'
import { FormScreen } from 'app/screens/form-screen'
import { makeStyles } from 'app/styles'
import { getTrackRoute } from 'app/utils/routes'

import { RemixTrackPill } from '../components'
import type { RemixOfField } from '../types'

const messages = {
  screenTitle: 'Remix Settings',
  markRemix: 'Mark This Track as a Remix',
  isRemixLinkDescription: 'Paste the link to the Audius track you’ve remixed.',
  hideRemixesDescription:
    'Enabling this option will prevent other user’s remixes from appearing on your track page.',
  hideRemixes: 'Hide Remixes of this Track',
  done: 'Done',
  invalidRemixUrl: 'Please paste a valid Audius track URL',
  missingRemixUrl: 'Must include a link to the original track',
  remixAccessError: 'Must have access to the original track',
  enterLink: 'Enter an Audius Link'
}

const useStyles = makeStyles(({ spacing, typography }) => ({
  backButton: {
    marginLeft: -6
  },
  setting: {
    paddingHorizontal: spacing(6),
    paddingVertical: spacing(8)
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing(5)
  },
  inputRoot: {
    marginTop: spacing(4),
    paddingVertical: spacing(4),
    paddingLeft: spacing(4)
  },
  input: {
    fontSize: typography.fontSize.large
  },
  changeAvailabilityText: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  }
}))

const labelProps: TextProps = {
  fontSize: 'large',
  weight: 'demiBold'
}

const descriptionProps: TextProps = {
  fontSize: 'large',
  weight: 'medium'
}

export const RemixSettingsScreen = () => {
  const styles = useStyles()
  const [{ value: remixOf }, , { setValue: setRemixOf }] =
    useField<RemixOfField>('remix_of')
  const [{ value: remixesVisible }, , { setValue: setRemixesVisible }] =
    useField<boolean>('field_visibility.remixes')
  const [{ value: isStreamGated }] = useField<boolean>('is_stream_gated')
  const [{ value: streamConditions }] =
    useField<Nullable<AccessConditions>>('stream_conditions')
  const isUsdcGated = isContentUSDCPurchaseGated(streamConditions)

  const parentTrackId = remixOf?.tracks[0].parent_track_id
  const [isTrackRemix, setIsTrackRemix] = useState(Boolean(parentTrackId))
  const [remixOfInput, setRemixOfInput] = useState('')
  const [isRemixUrlMissing, setIsRemixUrlMissing] = useState(false)
  const [isTouched, setIsTouched] = useState(false)
  const navigation = useNavigation()

  const permalink = useThrottle(getPathFromTrackUrl(remixOfInput), 1000)
  const { data: parentTrack } = useTrackByPermalink(permalink)
  const { hasStreamAccess } = useGatedContentAccess(parentTrack ?? null)

  useEffect(() => {
    if (isStreamGated) {
      setRemixOf(null)
    }
    if (isStreamGated && !isUsdcGated) {
      setRemixesVisible(false)
    } else {
      setRemixesVisible(true)
    }
  }, [isStreamGated, isUsdcGated, setRemixOf, setRemixesVisible])

  const handleFocusScreen = useCallback(() => {
    const initialParentTrackId = parentTrackId
    if (initialParentTrackId && parentTrack) {
      setRemixOfInput(getTrackRoute(parentTrack, true))
    }
  }, [parentTrackId, parentTrack])

  useFocusEffect(handleFocusScreen)

  const handleChangeLink = useCallback((value: string) => {
    setRemixOfInput(value)
    setIsRemixUrlMissing(false)
  }, [])

  const handleChangeIsRemix = useCallback((isRemix: boolean) => {
    setIsTrackRemix(isRemix)
    if (!isRemix) {
      setIsRemixUrlMissing(false)
    }
  }, [])

  const handleSubmit = useCallback(() => {
    if (isTrackRemix && !remixOf) {
      setIsRemixUrlMissing(true)
    } else {
      navigation.goBack()
    }
  }, [navigation, isTrackRemix, remixOf])

  useEffect(() => {
    if (isTrackRemix && parentTrack && parentTrack.track_id !== parentTrackId) {
      setRemixOf(createRemixOfMetadata({ parentTrackId: parentTrack.track_id }))
    } else if (!isTrackRemix) {
      setRemixOf(null)
    }
  }, [parentTrack, isTrackRemix, parentTrackId, setRemixOf])

  const handleFocus = useCallback(() => {
    setIsTouched(true)
  }, [])

  useEffect(() => {
    if (!remixOfInput && !isTouched && parentTrack) {
      setRemixOfInput(getTrackRoute(parentTrack, true))
    }
  }, [remixOfInput, isTouched, parentTrack])

  const isInvalidParentTrack = !parentTrack && remixOfInput !== ''
  const hasErrors = Boolean(
    isTrackRemix &&
      (isInvalidParentTrack || isRemixUrlMissing || !hasStreamAccess)
  )

  return (
    <FormScreen
      title={messages.screenTitle}
      icon={IconRemix}
      variant='white'
      topbarLeft={
        <TopBarIconButton
          icon={IconCaretLeft}
          style={styles.backButton}
          onPress={hasErrors ? undefined : handleSubmit}
        />
      }
      bottomSection={
        <Button
          variant='primary'
          fullWidth
          onPress={handleSubmit}
          disabled={hasErrors}
        >
          {messages.done}
        </Button>
      }
    >
      <View>
        <View style={styles.setting}>
          <View style={styles.option}>
            <Text {...labelProps}>{messages.markRemix}</Text>
            <Switch value={isTrackRemix} onValueChange={handleChangeIsRemix} />
          </View>
          {isTrackRemix ? (
            <View>
              <Text {...descriptionProps}>
                {messages.isRemixLinkDescription}
              </Text>
              <TextInput
                styles={{ root: styles.inputRoot, input: styles.input }}
                value={remixOfInput}
                onChangeText={handleChangeLink}
                placeholder={messages.enterLink}
                onFocus={handleFocus}
                returnKeyType='done'
              />
              {parentTrack && !isInvalidParentTrack ? (
                <RemixTrackPill trackId={parentTrackId} />
              ) : null}
              {hasErrors ? (
                <InputErrorMessage
                  message={
                    !hasStreamAccess
                      ? messages.remixAccessError
                      : isInvalidParentTrack
                        ? messages.invalidRemixUrl
                        : messages.missingRemixUrl
                  }
                />
              ) : null}
            </View>
          ) : null}
        </View>
        <Divider />
        <View style={styles.setting}>
          <View style={styles.option}>
            <Text {...labelProps}>{messages.hideRemixes}</Text>
            <Switch
              value={!remixesVisible}
              onValueChange={(value) => {
                setRemixesVisible(!value)
              }}
            />
          </View>
          <Text {...descriptionProps}>{messages.hideRemixesDescription}</Text>
        </View>
        <Divider />
      </View>
    </FormScreen>
  )
}
