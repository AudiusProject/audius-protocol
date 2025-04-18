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

import {
  Flex,
  Text,
  IconTrophy,
  Hint,
  IconCalendarMonth,
  Button
} from '@audius/harmony-native'

import { DateTimeInput } from '../core'
import { AppDrawer } from '../drawer'

const MODAL_NAME = 'HostRemixContest'

const messages = {
  modalTitle: 'Host Remix Contest',
  description:
    'Turn your track into a remix challenge and co-sign your favorite submissions.',
  endDateTitle: 'Submission Deadline',
  hint: 'You can host one contest per song and adjust the submission deadline anytime within 90 days of the contest start.',
  dateLabel: 'Last day to submit to contest',
  timeLabel: 'Time',
  startContestError: 'Contest end date must be in the future',
  startContest: 'Start Contest',
  save: 'Save',
  turnOff: 'Turn Off Contest'
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

export const HostRemixContestDrawer = () => {
  const { data, onClose } = useHostRemixContestModal()
  const { mutate: createEvent } = useCreateEvent()
  const { mutate: deleteEvent } = useDeleteEvent()
  const { mutate: updateEvent } = useUpdateEvent()
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
    if (endDateError || !trackId || !userId || !endDate) return

    if (isEdit) {
      updateEvent({
        eventId: remixContest.eventId,
        endDate: endDate.toISOString(),
        userId
      })
    } else {
      createEvent({
        eventType: EventEventTypeEnum.RemixContest,
        entityType: EventEntityTypeEnum.Track,
        entityId: trackId,
        endDate: endDate.toISOString(),
        userId
      })
    }

    onClose()
  }, [
    endDateError,
    trackId,
    userId,
    isEdit,
    onClose,
    updateEvent,
    remixContest?.eventId,
    endDate,
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
      title={messages.modalTitle}
      titleIcon={IconTrophy}
    >
      <Flex h='100%' justifyContent='space-between'>
        <Flex pv='xl' ph='l' gap='xl'>
          <Text variant='body'>{messages.description}</Text>
          <Flex gap='l'>
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
            <Hint>
              <Text variant='body' color='subdued'>
                {messages.hint}
              </Text>
            </Hint>
          </Flex>
        </Flex>
        <Flex direction='column' gap='l' p='l' pb='3xl' borderTop='strong'>
          <Button
            disabled={!endDate || endDateError}
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
      </Flex>
    </AppDrawer>
  )
}
