import { useCallback, useEffect, useMemo, useState } from 'react'

import type { Nullable } from '@audius/common'
import {
  remixSettingsActions,
  remixSettingsSelectors,
  Status
} from '@audius/common'
import { useFocusEffect, useRoute } from '@react-navigation/native'
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

import type { UploadRouteProp } from '../ParamList'
import { UploadStackScreen } from '../UploadStackScreen'
import { RemixTrackPill } from '../components'

const { getTrack, getUser, getStatus } = remixSettingsSelectors
const { fetchTrack, reset } = remixSettingsActions

const remixLinkInputDebounceMs = 1000

const messages = {
  screenTitle: 'Remix Settings',
  isRemixLabel: 'This Track is a Remix',
  isRemixLinkDescription: 'Paste the link to the Audius track you’ve remixed',
  hideRemixLabel: 'Hide Remixes on Track Page',
  hideRemixDescription:
    'Hide remixes of this track to prevent them showing on your track page.',
  done: 'Done',
  invalidRemixLink: 'Please paste a valid Audius track URL'
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
    fontSize: typography.fontSize.large,
    color: palette.neutralLight4
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
  const { params } = useRoute<UploadRouteProp<'RemixSettings'>>()
  const { value, onChange } = params
  const [isTrackRemix, setIsTrackRemix] = useState(Boolean(value.remixOf))
  const [remixOf, setRemixOf] = useState(value.remixOf)
  const [remixOfInput, setRemixOfInput] = useState(value.remixOf ?? '')
  const [hideRemixes, setHideRemixes] = useState(!value.remixesVisible)
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

  const handleLinkInput = useCallback(
    (value: string) => {
      setRemixOfInput(value)
      handleFetchParentTrack(value)
    },
    [handleFetchParentTrack]
  )

  const handleSubmit = useCallback(() => {
    onChange({
      remixOf: isTrackRemix ? remixOf : null,
      remixesVisible: !hideRemixes
    })
    navigation.goBack()
    dispatch(reset())
  }, [onChange, remixOf, hideRemixes, navigation, isTrackRemix, dispatch])

  useEffect(() => {
    setRemixOf(parentTrack ? getTrackRoute(parentTrack, true) : null)
  }, [parentTrack])

  return (
    <UploadStackScreen
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
          disabled={isInvalidParentTrack}
        />
      }
    >
      <View>
        <View style={styles.setting}>
          <View style={styles.option}>
            <Text {...labelProps}>{messages.isRemixLabel}</Text>
            <Switch value={isTrackRemix} onValueChange={setIsTrackRemix} />
          </View>
          {isTrackRemix ? (
            <View>
              <Text {...descriptionProps}>
                {messages.isRemixLinkDescription}
              </Text>
              <TextInput
                styles={{ root: styles.inputRoot, input: styles.input }}
                value={remixOfInput}
                onChangeText={handleLinkInput}
                returnKeyType='default'
              />
              {parentTrack && parentTrackArtist && !isInvalidParentTrack ? (
                <RemixTrackPill track={parentTrack} user={parentTrackArtist} />
              ) : null}
              {isInvalidParentTrack ? (
                <InputErrorMessage message={messages.invalidRemixLink} />
              ) : null}
            </View>
          ) : null}
        </View>
        <Divider />
        <View style={styles.setting}>
          <View style={styles.option}>
            <Text {...labelProps}>{messages.hideRemixLabel}</Text>
            <Switch value={hideRemixes} onValueChange={setHideRemixes} />
          </View>
          <Text {...descriptionProps}>{messages.hideRemixDescription}</Text>
        </View>
        <Divider />
      </View>
    </UploadStackScreen>
  )
}
