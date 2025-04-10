import { useCallback, useState } from 'react'

import {
  useCurrentUserId,
  useCreateEvent,
  useRemixContest,
  useUpdateEvent
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
  save: 'Save'
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
  const { mutate: updateEvent } = useUpdateEvent()
  const { data: userId } = useCurrentUserId()
  const { trackId } = data
  const { data: event } = useRemixContest(trackId, {
    entityType: EventEntityTypeEnum.Track
  })
  const isEdit = !!event

  const [endDate, setEndDate] = useState(event ? dayjs(event.endDate) : null)
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
        eventId: event.eventId,
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
    event?.eventId,
    endDate,
    createEvent
  ])

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
        <Flex direction='row' p='l' pb='3xl' borderTop='strong'>
          <Button
            disabled={!endDate || endDateError}
            variant='primary'
            fullWidth
            onPress={handleSubmit}
          >
            {isEdit ? messages.save : messages.startContest}
          </Button>
        </Flex>
      </Flex>
    </AppDrawer>
  )
}
