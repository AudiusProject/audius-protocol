import { useCallback, useState } from 'react'

import {
  useCurrentUserId,
  useCreateEvent,
  useRemixContest,
  useUpdateEvent,
  useDeleteEvent,
  useRemixes
} from '@audius/common/api'
import { useHostRemixContestModal } from '@audius/common/store'
import { EventEntityTypeEnum, EventEventTypeEnum } from '@audius/sdk'
import dayjs from 'dayjs'
import { Platform, ScrollView } from 'react-native'

import {
  Flex,
  Text,
  IconTrophy,
  IconCalendarMonth,
  Button,
  TextLink
} from '@audius/harmony-native'
import { makeStyles } from 'app/styles'

import { DateTimeInput, TextInput } from '../core'
import { AppDrawer } from '../drawer'

const MODAL_NAME = 'HostRemixContest'

const maxDescriptionLength = 1000
const maxPrizeInfoLength = 1000
const hostContestUrl = 'https://help.audius.co/artists/hosting-a-remix-contest'

type RemixContestData = {
  description: string
  prizeInfo: string
}

const messages = {
  modalTitle: 'Host Remix Contest',
  description:
    'Turn your track into a remix challenge and co-sign your favorite submissions.',
  descriptionTitle: 'Contest Description*',
  descriptionPlaceholder:
    'Write your contest description here. Include clear rules, guidelines, and any other important details you want your fans to know about your contest.',
  descriptionError: 'Contest description is required.',
  prizeInfoTitle: 'Prize',
  prizeInfoPlaceholder:
    'Describe what winners will receive. Be clear about how many winners there will be, and what each prize includes (e.g. cash, reposts, feedback, collaborations, etc.)',
  endDateTitle: 'Submission Deadline*',
  dateLabel: 'Last day to submit to contest',
  timeLabel: 'Time',
  startContestError: 'Contest end date must be in the future within 90 days',
  startContest: 'Start Contest',
  save: 'Save',
  turnOff: 'Turn Off Contest',
  hostContestLink: 'Learn how to host a successful remix contest'
}

const mergeDateTime = (day: string, time: string) => {
  const truncatedReleaseDate = dayjs(day).startOf('day')
  const parsedTime = dayjs(time)
  const hour = parsedTime.get('hour')
  const minute = parsedTime.get('minute')

  const combinedDateTime = truncatedReleaseDate
    .add(hour, 'hours')
    .add(minute, 'minutes')

  return combinedDateTime
}

const useStyles = makeStyles(({ typography }) => ({
  input: {
    height: 144,
    textAlignVertical: 'top',
    fontSize: typography.fontSize.large,
    lineHeight:
      Platform.OS === 'ios' ? typography.fontSize.xl : typography.fontSize.large
  },
  labelText: {
    fontSize: typography.fontSize.large,
    fontFamily: typography.fontByWeight.demiBold,
    top: 4
  }
}))

export const HostRemixContestDrawer = () => {
  const { data, onClose } = useHostRemixContestModal()
  const { mutate: createEvent } = useCreateEvent()
  const { mutate: deleteEvent } = useDeleteEvent()
  const { mutate: updateEvent } = useUpdateEvent()
  const styles = useStyles()
  const { data: userId } = useCurrentUserId()
  const { trackId } = data
  const { data: remixContest } = useRemixContest(trackId)
  const { data: remixes, isLoading: remixesLoading } = useRemixes({
    trackId,
    isContestEntry: true
  })
  const isEdit = !!remixContest
  const hasContestEntries = remixesLoading || remixes?.length
  const displayTurnOffButton = !hasContestEntries && isEdit

  const remixContestData = remixContest?.eventData as RemixContestData

  // Form State
  const [description, setDescription] = useState(
    remixContestData ? remixContestData.description : ''
  )
  const [descriptionError, setDescriptionError] = useState<boolean>(false)
  const [prizeInfo, setPrizeInfo] = useState(
    remixContestData ? remixContestData.prizeInfo : ''
  )
  const [endDate, setEndDate] = useState(
    remixContest ? dayjs(remixContest.endDate) : null
  )
  const [endDateError, setEndDateError] = useState<boolean>(false)

  const handleChange = useCallback((date: string, time: string) => {
    if (!date && !time) {
      setEndDate(null)
      return
    }

    const newDate = mergeDateTime(date || time, time || date)
    if (newDate.isBefore(dayjs())) {
      setEndDateError(true)
    } else {
      setEndDateError(false)
    }
    setEndDate(newDate)
  }, [])

  const handleDateChange = useCallback(
    (date: string) => {
      handleChange(date, endDate?.toString() ?? '')
    },
    [endDate, handleChange]
  )

  const handleTimeChange = useCallback(
    (time: string) => {
      handleChange(endDate?.toString() ?? '', time)
    },
    [endDate, handleChange]
  )

  const handleSubmit = useCallback(() => {
    setDescriptionError(description.length === 0)

    if (endDateError || descriptionError || !trackId || !userId || !endDate) {
      return
    }

    if (isEdit) {
      updateEvent({
        eventId: remixContest.eventId,
        endDate: endDate.toISOString(),
        eventData: {
          description,
          prizeInfo
        },
        userId
      })
    } else {
      createEvent({
        eventType: EventEventTypeEnum.RemixContest,
        entityType: EventEntityTypeEnum.Track,
        entityId: trackId,
        endDate: endDate.toISOString(),
        userId,
        eventData: {
          description,
          prizeInfo
        }
      })
    }

    onClose()
  }, [
    description,
    endDateError,
    descriptionError,
    trackId,
    userId,
    endDate,
    isEdit,
    onClose,
    updateEvent,
    remixContest?.eventId,
    prizeInfo,
    createEvent
  ])

  const handleDeleteEvent = useCallback(() => {
    if (!remixContest || !userId) return
    deleteEvent({ eventId: remixContest.eventId, userId })
    onClose()
  }, [remixContest, userId, deleteEvent, onClose])

  return (
    <AppDrawer
      modalName={MODAL_NAME}
      isFullscreen
      onClose={onClose}
      isGestureSupported={false}
      title={messages.modalTitle}
      titleIcon={IconTrophy}
    >
      <ScrollView>
        <Flex h='100%' justifyContent='space-between'>
          <Flex pv='xl' ph='l' gap='xl'>
            <Text variant='body'>{messages.description}</Text>
            <Flex column gap='l'>
              <Text variant='title' size='l'>
                {messages.descriptionTitle}
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder={messages.descriptionPlaceholder}
                multiline
                numberOfLines={5}
                error={descriptionError}
                styles={{
                  input: styles.input,
                  labelText: styles.labelText
                }}
                maxLength={maxDescriptionLength}
              />
              <TextLink url={hostContestUrl} variant='visible'>
                {messages.hostContestLink}
              </TextLink>
            </Flex>
            <Flex column gap='l'>
              <Text variant='title' size='l'>
                {messages.prizeInfoTitle}
              </Text>
              <TextInput
                value={prizeInfo}
                onChangeText={setPrizeInfo}
                placeholder={messages.prizeInfoPlaceholder}
                multiline
                numberOfLines={5}
                styles={{
                  input: styles.input,
                  labelText: styles.labelText
                }}
                maxLength={maxPrizeInfoLength}
              />
            </Flex>
            <Flex column gap='l'>
              <Text variant='title' size='l'>
                {messages.endDateTitle}
              </Text>
              <DateTimeInput
                mode='date'
                date={endDate?.toString() ?? ''}
                onChange={handleDateChange}
                dateTimeProps={{
                  minimumDate: new Date(),
                  maximumDate: dayjs().add(90, 'days').toDate()
                }}
                inputProps={{
                  label: messages.dateLabel,
                  startIcon: IconCalendarMonth,
                  error: !!endDateError,
                  helperText: endDateError ? messages.startContestError : ''
                }}
              />
              <DateTimeInput
                mode='time'
                date={endDate?.toString() ?? ''}
                onChange={handleTimeChange}
                inputProps={{ label: messages.timeLabel }}
              />
            </Flex>
          </Flex>
        </Flex>
      </ScrollView>
      <Flex direction='column' gap='l' p='l' pb='3xl' borderTop='strong'>
        <Button
          disabled={!endDate || !description || endDateError}
          variant='primary'
          fullWidth
          onPress={handleSubmit}
        >
          {isEdit ? messages.save : messages.startContest}
        </Button>
        {displayTurnOffButton ? (
          <Button variant='secondary' fullWidth onPress={handleDeleteEvent}>
            {messages.turnOff}
          </Button>
        ) : null}
      </Flex>
    </AppDrawer>
  )
}
