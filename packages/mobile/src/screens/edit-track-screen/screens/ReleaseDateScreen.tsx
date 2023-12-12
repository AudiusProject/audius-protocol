import { useCallback, useState } from 'react'

import type { Nullable } from '@audius/common'
import {
  remixSettingsActions,
  remixSettingsSelectors,
  removeNullable
} from '@audius/common'
import { useField, useFormikContext } from 'formik'
import moment from 'moment'
import { View } from 'react-native'
import DateTimePickerModal from 'react-native-modal-datetime-picker'
import { useDispatch } from 'react-redux'

import { IconCalendarMonth } from '@audius/harmony-native'
// import { IconCalendarMonth } from '@audius/harmony'

import type { TextProps } from 'app/components/core'
import { Button, Text } from 'app/components/core'
import { TextField } from 'app/components/fields'
import { HelpCallout } from 'app/components/help-callout/HelpCallout'
import { useNavigation } from 'app/hooks/useNavigation'
import { staleTrackWorker } from 'app/store/offline-downloads/sagas/offlineQueueSagas/workers/staleTrackWorker'
import { makeStyles } from 'app/styles'
import { useThemeColors, useThemeVariant } from 'app/utils/theme'

import type { FormValues } from '../types'

import type { ListSelectionData } from './ListSelectionScreen'
import { ListSelectionScreen } from './ListSelectionScreen'

export enum ReleaseDateType {
  RELEASE_NOW = 'RELEASE_NOW',
  SCHEDULED_RELEASE = 'SCHEDULED_RELEASE'
}

const { getTrack, getUser, getStatus } = remixSettingsSelectors
const { fetchTrack, fetchTrackSucceeded, reset } = remixSettingsActions

const remixLinkInputDebounceMs = 1000

const messages = {
  screenTitle: 'Release Date',
  markRemix: 'Mark This Track as a Remix',
  isRemixLinkDescription: 'Paste the link to the Audius track you’ve remixed.',
  hideRemixesDescription:
    'Enabling this option will prevent other user’s remixes from appearing on your track page.',
  hideRemixes: 'Hide Remixes of this Track',
  done: 'Done',
  invalidRemixUrl: 'Please paste a valid Audius track URL',
  missingRemixUrl: 'Must include a link to the original track',
  remixAccessError: 'Must have access to the original track',
  enterLink: 'Enter an Audius Link',
  changeAvailbilityPrefix: 'Availablity is set to',
  changeAvailbilitySuffix:
    'To enable these options, change availability to Public.',
  premium: 'Premium (Pay-To-Unlock). ',
  collectibleGated: 'Collectible Gated. ',
  specialAccess: 'Special Access. ',
  futureReleaseHint:
    'Your scheduled track will become live on Audius on the date and time you’ve chosen above in your time zone (CST).',
  pastReleaseHint:
    'Setting a release date in the past will impact the order tracks appear on your profile.'
}

const useStyles = makeStyles(({ palette, spacing, typography }) => ({
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
  changeAvailability: {
    marginBottom: spacing(16)
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

const data: ListSelectionData[] = [
  {
    label: ReleaseDateType.RELEASE_NOW,
    value: ReleaseDateType.RELEASE_NOW,
    disabled: false
  },
  {
    label: ReleaseDateType.SCHEDULED_RELEASE,
    value: ReleaseDateType.SCHEDULED_RELEASE,
    disabled: false
  }
].filter(removeNullable)

export const ScheduledReleaseRadioField = (props) => {
  const { selected } = props
  console.log('asdf selected: ', selected)
  const [{ value: releaseDateValue }, , { setValue: setReleaseDateValue }] =
    useField<Nullable<string>>('release_date')
  const releaseDateMoment = moment(releaseDateValue)
  const { initialValues } = useFormikContext<FormValues>()
  const [{ value: releaseDayDayValue }, ,] = useField('release_date_day')
  console.log('asdf releaseDayDayValue: ', releaseDayDayValue)

  const theme = useThemeVariant()
  const { primary } = useThemeColors()

  let initIsDateOpen = false
  if (!releaseDateValue && selected) {
    initIsDateOpen = true
  }

  const [isDateOpen, setIsDateOpen] = useState(initIsDateOpen)
  const [isTimeOpen, setIsTimeOpen] = useState(false)

  const handleDateChange = useCallback(
    (selectedDate: Date) => {
      // This must be called first to prevent android date-picker
      // from showing up twice
      // handleClose()
      const newReleaseDate = moment(selectedDate).hour(0).minute(0).second(0)
      setReleaseDateValue(newReleaseDate.toString())
      setIsDateOpen(false)
    },
    [setReleaseDateValue, setIsDateOpen]
  )
  const handleTimeChange = useCallback(
    (selectedTime) => {
      const newReleaseDate = moment(selectedTime)
      if (releaseDateValue) {
        const releaseDateMoment = moment(releaseDateValue)
        newReleaseDate
          .year(releaseDateMoment.year())
          .month(releaseDateMoment.month())
          .day(releaseDateMoment.day())
      }

      setReleaseDateValue(newReleaseDate.toString())
      setIsTimeOpen(false)
    },
    [setReleaseDateValue, setIsTimeOpen]
  )
  console.log(
    'asdf sameday or after: ',
    moment(releaseDateValue),
    moment().startOf('day'),
    moment(releaseDateValue).isAfter(moment().startOf('day'))
  )

  return (
    <>
      <View>
        <Text weight='bold'>Schedule a release date</Text>
        {selected ? (
          <TextField
            name={'release_date_day'}
            label={'Release Date'}
            onFocus={() => setIsDateOpen(true)}
            Icon={IconCalendarMonth}
            value={
              releaseDateValue
                ? moment(releaseDateValue).calendar(null, {
                    sameDay: '[Today]',
                    nextDay: '[Tomorrow]',
                    nextWeek: 'dddd',
                    lastDay: '[Yesterday]',
                    lastWeek: '[Last] dddd',
                    sameElse: 'M/D/YY' // This is where you format dates that don't fit in the above categories
                  })
                : undefined
            }
          />
        ) : null}
        {releaseDateValue &&
        moment(releaseDateValue).isSameOrAfter(moment().startOf('day')) ? (
          <TextField
            name={'release_date_time'}
            label={'Time'}
            onFocus={() => setIsTimeOpen(true)}
            value={
              releaseDateValue
                ? moment(releaseDateValue).format('h:mm A')
                : undefined
            }
          />
        ) : null}
        <Text>{releaseDateValue}</Text>
        <DateTimePickerModal
          isVisible={isDateOpen}
          date={releaseDateValue ? new Date(releaseDateValue) : new Date()}
          mode='date'
          onConfirm={handleDateChange}
          onCancel={() => setIsDateOpen(false)}
          display='inline'
          themeVariant={'light'}
          isDarkModeEnabled={false}
          accentColor={primary}
        />
        <DateTimePickerModal
          isVisible={isTimeOpen}
          date={releaseDateValue ? new Date(releaseDateValue) : new Date()}
          mode='time'
          onConfirm={handleTimeChange}
          onCancel={() => setIsTimeOpen(false)}
          accentColor={primary}
        />
        {releaseDateValue ? (
          <HelpCallout
            content={
              moment(releaseDateValue).isAfter(moment())
                ? messages.futureReleaseHint
                : messages.pastReleaseHint
            }
          />
        ) : null}
      </View>
    </>
  )
}

export const ReleaseDateScreen = (selected) => {
  const [releaseDateType, setReleaseDateType] = useState<ReleaseDateType>(
    ReleaseDateType.RELEASE_NOW
  )

  const useStyles = makeStyles(({ palette, spacing, typography }) => ({
    newPill: {
      borderRadius: 10,
      backgroundColor: palette.secondary,
      paddingHorizontal: 6,
      paddingVertical: 2
    }
  }))
  const styles = useStyles()

  const ReleaseNowRadioField = (selected) => {
    return (
      <View>
        <Text weight='bold'>Release immediately</Text>
        {selected ? (
          <View style={styles.newPill}>
            <IconCalendarMonth />
            <Text>Today</Text>
          </View>
        ) : null}
      </View>
    )
  }

  const items = {
    [ReleaseDateType.RELEASE_NOW]: (
      <ReleaseNowRadioField
        selected={releaseDateType === ReleaseDateType.RELEASE_NOW}
      />
    ),
    [ReleaseDateType.SCHEDULED_RELEASE]: (
      <ScheduledReleaseRadioField
        selected={releaseDateType === ReleaseDateType.SCHEDULED_RELEASE}
      />
    )
  }
  const [{ value, onChange }] = useField<Nullable<string>>('release_date')
  console.log('asdf value: ', value)
  const navigation = useNavigation()
  const dispatch = useDispatch()

  const handleSubmit = useCallback(() => {
    navigation.goBack()
    dispatch(reset())
  }, [navigation, dispatch])

  return (
    <>
      <ListSelectionScreen
        data={data}
        renderItem={({ item }) => items[item.label]}
        screenTitle={'Release Date'}
        icon={IconCalendarMonth}
        header={
          <Text>
            Specify a release date for your music or schedule it to be released
            in the future.
          </Text>
        }
        value={releaseDateType}
        onChange={setReleaseDateType}
        disableSearch
        allowDeselect={false}
        hideSelectionLabel
        bottomSection={
          <Button
            variant='primary'
            size='large'
            fullWidth
            title={messages.done}
            onPress={handleSubmit}
            disabled={false}
          />
        }
      />
    </>
  )
}
