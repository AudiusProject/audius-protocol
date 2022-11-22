import { useCallback, useEffect, useMemo, useState } from 'react'

import type { Nullable } from '@audius/common'
import {
  remixSettingsActions,
  remixSettingsSelectors,
  Status
} from '@audius/common'
import { useFocusEffect } from '@react-navigation/native'
import { useField } from 'formik'
import { debounce } from 'lodash'
import { View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import IconRemix from 'app/assets/images/iconRemix.svg'
import type { TextProps } from 'app/components/core'
import { TextInput, Divider, Button, Switch, Text } from 'app/components/core'
import { InputErrorMessage } from 'app/components/core/InputErrorMessage'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'
import { getTrackRoute } from 'app/utils/routes'

import { FormScreen, RemixTrackPill } from '../components'

const { getTrack, getUser, getStatus } = remixSettingsSelectors
const { fetchTrack, reset } = remixSettingsActions

const remixLinkInputDebounceMs = 1000

const messages = {
  screenTitle: 'Remix Settings',
  isRemixLabel: 'This Track is a Remix',
  isRemixLinkDescription: 'Paste the link to the Audius track you’ve remixed.',
  hideRemixLabel: 'Hide Remixes on Track Page',
  hideRemixDescription:
    'Hide remixes of this track to prevent them from showing on your track page.',
  done: 'Done',
  invalidRemixUrl: 'Please paste a valid Audius track URL',
  missingRemixUrl: 'Must include a link to the original track',
  remixUrlPlaceholder: 'Track URL'
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
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

export type RemixSettingsValue = {
  remixOf: Nullable<string>
  remixesVisible: boolean
}

export type RemixSettingsParams = {
  value: RemixSettingsValue
  onChange: (value: Partial<RemixSettingsValue>) => void
}

export const RemixSettingsScreen = () => {
  const styles = useStyles()
  const [{ value: remixOf }, , { setValue: setRemixOf }] =
    useField<Nullable<string>>('remix_of')
  const [{ value: remixesVisible }, , { setValue: setRemixesVisible }] =
    useField<boolean>('field_visibility.remixes')
  const [isTrackRemix, setIsTrackRemix] = useState(Boolean(remixOf))
  const [remixOfInput, setRemixOfInput] = useState(remixOf ?? '')
  const [isRemixUrlMissing, setIsRemixUrlMissing] = useState(false)
  const navigation = useNavigation()
  const dispatch = useDispatch()
  const parentTrack = useSelector(getTrack)
  const parentTrackArtist = useSelector(getUser)
  const parentTrackStatus = useSelector(getStatus)
  const isInvalidParentTrack = parentTrackStatus === Status.ERROR

  const handleFetchParentTrack = useMemo(
    () =>
      debounce(
        (url: string) => {
          dispatch(fetchTrack({ url: decodeURI(url) }))
        },
        remixLinkInputDebounceMs,
        { leading: true, trailing: false }
      ),
    [dispatch]
  )

  const handleFocus = useCallback(() => {
    if (remixOfInput) {
      handleFetchParentTrack(remixOfInput)
    }
    return () => {
      dispatch(reset())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleFetchParentTrack, dispatch])

  useFocusEffect(handleFocus)

  const handleChangeLink = useCallback(
    (value: string) => {
      setRemixOfInput(value)
      handleFetchParentTrack(value)
      setIsRemixUrlMissing(false)
    },
    [handleFetchParentTrack]
  )

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
      dispatch(reset())
    }
  }, [navigation, dispatch, isTrackRemix, remixOf])

  useEffect(() => {
    setRemixOf(
      parentTrack && isTrackRemix ? getTrackRoute(parentTrack, true) : null
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentTrack, isTrackRemix])

  const hasErrors = isTrackRemix && (isInvalidParentTrack || isRemixUrlMissing)

  return (
    <FormScreen
      title={messages.screenTitle}
      icon={IconRemix}
      variant='white'
      bottomSection={
        <Button
          variant='primary'
          size='large'
          fullWidth
          title={messages.done}
          onPress={handleSubmit}
          disabled={hasErrors}
        />
      }
    >
      <View>
        <View style={styles.setting}>
          <View style={styles.option}>
            <Text {...labelProps}>{messages.isRemixLabel}</Text>
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
                placeholder={messages.remixUrlPlaceholder}
                returnKeyType='done'
              />
              {parentTrack && parentTrackArtist && !isInvalidParentTrack ? (
                <RemixTrackPill track={parentTrack} user={parentTrackArtist} />
              ) : null}
              {hasErrors ? (
                <InputErrorMessage
                  message={
                    isInvalidParentTrack
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
            <Text {...labelProps}>{messages.hideRemixLabel}</Text>
            <Switch
              value={!remixesVisible}
              onValueChange={(value) => setRemixesVisible(!value)}
            />
          </View>
          <Text {...descriptionProps}>{messages.hideRemixDescription}</Text>
        </View>
        <Divider />
      </View>
    </FormScreen>
  )
}
