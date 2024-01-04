import { useCallback, useEffect, useState } from 'react'

import type { Nullable } from '@audius/common'
import {
  Theme,
  dayjs,
  remixSettingsActions,
  removeNullable
} from '@audius/common'
import { useField } from 'formik'
import moment from 'moment'
import { Dimensions, View } from 'react-native'
import DateTimePickerModal from 'react-native-modal-datetime-picker'
import { useDispatch } from 'react-redux'

import { IconCalendarMonth, Text } from '@audius/harmony-native'
import { Button } from 'app/components/core'
import { TextField } from 'app/components/fields'
import { HelpCallout } from 'app/components/help-callout/HelpCallout'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'
import { useThemeColors, useThemeVariant } from 'app/utils/theme'

import type { ListSelectionData } from './ListSelectionScreen'
import { ListSelectionScreen } from './ListSelectionScreen'

export enum ReleaseDateType {
  RELEASE_NOW = 'RELEASE_NOW',
  SCHEDULED_RELEASE = 'SCHEDULED_RELEASE'
}

const { reset } = remixSettingsActions

const screenWidth = Dimensions.get('screen').width

const messages = {
  screenTitle: 'Release Date',
  description:
    'Specify a release date for your music or schedule it to be released in the future.',
  done: 'Done',
  releaseNowRadio: 'Release Immediately',
  scheduleReleaseDateRadio: 'Select a Release Date',
  futureReleaseHint: (timezone: string) =>
    `Your scheduled track will become live on Audius on the date and time you’ve chosen above in your time zone (${timezone}).`,
  pastReleaseHint:
    'Setting a release date in the past will impact the order tracks appear on your profile.'
}

const useStyles = makeStyles(({ palette, spacing, typography }) => ({
  todayPill: {
    flexDirection: 'row',
    borderRadius: 99,
    backgroundColor: palette.secondary,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: spacing(1)
  },
  releaseNowContainer: {
    flexDirection: 'row',
    gap: spacing(4)
  },
  description: {
    marginHorizontal: spacing(6),
    marginTop: spacing(8),
    marginBottom: spacing(1)
  },
  releaseDateInputContainer: {
    paddingTop: spacing(4),
    marginLeft: spacing(-10),
    width: screenWidth - spacing(12)
  },
  releaseDateInput: {
    marginTop: spacing(4)
  }
}))

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
  const { primary } = useThemeColors()
  const styles = useStyles()
  const theme = useThemeVariant()

  const [{ value: releaseDateValue }, , { setValue: setReleaseDateValue }] =
    useField<Nullable<string>>('release_date')

  let initIsDateOpen = false
  if (!releaseDateValue && selected) {
    initIsDateOpen = true
  }

  const [isDateOpen, setIsDateOpen] = useState(initIsDateOpen)
  const [isTimeOpen, setIsTimeOpen] = useState(false)

  const handleDateChange = useCallback(
    (selectedDate: Date) => {
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
    [releaseDateValue, setReleaseDateValue]
  )
  const currentDate = new Date()

  // Add one year to the current date
  const oneYearFromNow = new Date(
    currentDate.setFullYear(currentDate.getFullYear() + 1)
  )

  return (
    <>
      <View>
        <Text size='l' strength='strong' variant='body'>
          {messages.scheduleReleaseDateRadio}
        </Text>
        <View style={styles.releaseDateInputContainer}>
          {selected ? (
            <TextField
              name={'release_date_day'}
              label={messages.screenTitle}
              onFocus={() => setIsDateOpen(true)}
              noGutter
              hideKeyboard={true}
              style={styles.releaseDateInput}
              value={moment(
                releaseDateValue === null ? undefined : releaseDateValue
              ).calendar(undefined, {
                sameDay: '[Today]',
                nextDay: '[Tomorrow]',
                nextWeek: 'dddd',
                lastDay: '[Yesterday]',
                lastWeek: '[Last] dddd',
                sameElse: 'M/D/YY' // This is where you format dates that don't fit in the above categories
              })}
            />
          ) : null}
          {selected &&
            releaseDateValue &&
            moment(releaseDateValue).isSameOrAfter(moment().startOf('day')) ? (
            <TextField
              name={'release_date_time'}
              label={'Time'}
              onFocus={() => setIsTimeOpen(true)}
              noGutter
              style={styles.releaseDateInput}
              hideKeyboard={true}
              value={
                releaseDateValue
                  ? moment(releaseDateValue).format('h:mm A')
                  : undefined
              }
            />
          ) : null}
          <DateTimePickerModal
            isVisible={isDateOpen}
            date={releaseDateValue ? new Date(releaseDateValue) : new Date()}
            mode='date'
            onConfirm={handleDateChange}
            onCancel={() => setIsDateOpen(false)}
            maximumDate={oneYearFromNow}
            display='inline'
            accentColor={primary}
            themeVariant={theme === Theme.DEFAULT ? 'light' : 'dark'}
            isDarkModeEnabled={theme !== Theme.DEFAULT}
          />
          <DateTimePickerModal
            isVisible={isTimeOpen}
            date={releaseDateValue ? new Date(releaseDateValue) : new Date()}
            mode='time'
            onConfirm={handleTimeChange}
            onCancel={() => setIsTimeOpen(false)}
            accentColor={primary}
            themeVariant={theme === Theme.DEFAULT ? 'light' : 'dark'}
            isDarkModeEnabled={theme !== Theme.DEFAULT}
          />
          {selected && releaseDateValue ? (
            <HelpCallout
              style={styles.releaseDateInput}
              content={
                moment(releaseDateValue).isAfter(moment())
                  ? messages.futureReleaseHint(dayjs().format('z'))
                  : messages.pastReleaseHint
              }
            />
          ) : null}
        </View>
      </View>
    </>
  )
}

export const ReleaseNowRadioField = (props) => {
  const { selected } = props
  const [{ value: releaseDateValue }, , { setValue: setReleaseDateValue }] =
    useField<Nullable<string>>('release_date')
  const styles = useStyles()

  useEffect(() => {
    if (selected) {
      setReleaseDateValue(null)
    }
  }, [selected, releaseDateValue, setReleaseDateValue])

  return (
    <View style={styles.releaseNowContainer}>
      <Text size='l' strength='strong' variant='body'>
        {messages.releaseNowRadio}
      </Text>
      {selected ? (
        <View style={styles.todayPill}>
          <IconCalendarMonth color='staticWhite' size='s' />
          <Text color='staticWhite' size='s'>
            Today
          </Text>
        </View>
      ) : null}
    </View>
  )
}

export const ReleaseDateScreen = () => {
  const [{ value }] = useField<Nullable<string>>('release_date')

  const [releaseDateType, setReleaseDateType] = useState<ReleaseDateType>(
    value ? ReleaseDateType.SCHEDULED_RELEASE : ReleaseDateType.RELEASE_NOW
  )

  const styles = useStyles()

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
  const navigation = useNavigation()
  const dispatch = useDispatch()

  const handleSubmit = useCallback(() => {
    navigation.goBack()
    dispatch(reset())
  }, [navigation, dispatch])

  return (
    <ListSelectionScreen
      data={data}
      renderItem={({ item }) => items[item.label]}
      screenTitle={'Release Date'}
      icon={IconCalendarMonth}
      header={
        <View style={styles.description}>
          <Text size='l'>{messages.description}</Text>
        </View>
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
  )
}
