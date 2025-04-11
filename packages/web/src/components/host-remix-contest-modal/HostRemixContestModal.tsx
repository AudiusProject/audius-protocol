import { ChangeEvent, useCallback, useState } from 'react'

import {
  useCreateEvent,
  useCurrentUserId,
  useRemixContest,
  useUpdateEvent
} from '@audius/common/api'
import { useHostRemixContestModal } from '@audius/common/store'
import {
  Button,
  Flex,
  Hint,
  IconTrophy,
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  Select,
  Text,
  TextInput
} from '@audius/harmony'
import { EventEntityTypeEnum, EventEventTypeEnum } from '@audius/sdk'
import { css } from '@emotion/css'

import { DatePicker } from 'components/edit/fields/DatePickerField'
import { mergeReleaseDateValues } from 'components/edit/fields/visibility/mergeReleaseDateValues'
import dayjs from 'utils/dayjs'

const messages = {
  hostTitle: 'Host Remix Contest',
  description:
    'Turn your track into a remix challenge and co-sign your favorite submissions.',
  deadlineTitle: 'Submission Deadline',
  hint: 'You can host one contest per song and adjust the submission deadline anytime within 90 days of the contest start.',
  startContest: 'Start Contest',
  save: 'Save',
  contestEndDateLabel: 'Last day to submit to contest',
  endDateError: 'Contest end date must be in the future',
  timeLabel: 'Time',
  timePlaceholder: '12:00',
  timeError: 'Invalid time',
  meridianLabel: 'Meridian',
  meridianPlaceholder: 'AM'
}

/**
 * Parses the user-provided time string and returns the formatted time
 * Returns null if the time is invalid
 */
const parseTime = (time: string) => {
  if (time.length < 3 || time.length > 5) return null

  const formattedTime = time.includes(':')
    ? time
    : `${time.slice(0, -2)}:${time.slice(-2)}`
  const parsed = dayjs(formattedTime, 'h:mm')

  if (parsed.isValid()) {
    return parsed.format('hh:mm')
  }
  return null
}

export const HostRemixContestModal = () => {
  const { data, isOpen, onClose, onClosed } = useHostRemixContestModal()
  const { trackId } = data
  const { mutate: createEvent } = useCreateEvent()
  const { mutate: updateEvent } = useUpdateEvent()
  const { data: userId } = useCurrentUserId()
  const { data: remixContest } = useRemixContest(trackId)
  const isEdit = !!remixContest

  const [contestEndDate, setContestEndDate] = useState(
    remixContest ? dayjs(remixContest.endDate) : null
  )
  const [endDateTouched, setEndDateTouched] = useState(false)
  const [endDateError, setEndDateError] = useState(false)
  const [timeValue, setTimeValue] = useState(
    contestEndDate ? dayjs(contestEndDate).format('hh:mm') : ''
  )
  const [timeError, setTimeError] = useState(false)
  const [meridianValue, setMeridianValue] = useState(
    contestEndDate ? dayjs(contestEndDate).format('A') : ''
  )

  const handleEndDateChange = useCallback((value: string) => {
    setContestEndDate(dayjs(value))
    setEndDateError(false)
  }, [])

  const handleTimeChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setTimeValue(e.target.value)
    const parsedTime = parseTime(e.target.value)
    setTimeError(!parsedTime)
    setEndDateError(false)
  }, [])

  const handleMeridianChange = useCallback((value: string) => {
    setMeridianValue(value)
    setEndDateError(false)
  }, [])

  const handleSubmit = useCallback(() => {
    const parsedTime = parseTime(timeValue)
    if (!parsedTime) return

    const parsedDate = mergeReleaseDateValues(
      contestEndDate?.toISOString() ?? '',
      parsedTime,
      meridianValue
    )
    const hasError =
      !parsedDate || dayjs(parsedDate.toISOString()).isBefore(dayjs())

    setEndDateTouched(true)
    setEndDateError(hasError)
    if (hasError || !trackId || !userId) return

    const endDate = parsedDate.toISOString()

    if (isEdit) {
      updateEvent({
        eventId: remixContest.eventId,
        endDate,
        userId
      })
    } else {
      createEvent({
        eventType: EventEventTypeEnum.RemixContest,
        entityType: EventEntityTypeEnum.Track,
        entityId: trackId,
        endDate,
        userId
      })
    }

    onClose()
  }, [
    contestEndDate,
    timeValue,
    meridianValue,
    trackId,
    userId,
    isEdit,
    onClose,
    updateEvent,
    remixContest?.eventId,
    createEvent
  ])

  return (
    <Modal isOpen={isOpen} onClose={onClose} onClosed={onClosed} size='medium'>
      <ModalHeader onClose={onClose}>
        <ModalTitle Icon={IconTrophy} title={messages.hostTitle} />
      </ModalHeader>
      <ModalContent>
        <Flex direction='column' gap='xl'>
          <Text variant='body'>{messages.description}</Text>
          <Flex direction='column' gap='l'>
            <Text variant='title' size='l'>
              {messages.deadlineTitle}
            </Text>
            <DatePicker
              name='contestEndDate'
              label={messages.contestEndDateLabel}
              onChange={handleEndDateChange}
              value={contestEndDate?.toISOString()}
              futureDatesOnly
              error={endDateError ? messages.endDateError : undefined}
              touched={endDateTouched}
            />
            <Flex gap='l'>
              <TextInput
                css={{ flex: 1 }}
                label={messages.timeLabel}
                placeholder={messages.timePlaceholder}
                disabled={!contestEndDate}
                value={timeValue}
                helperText={timeError ? messages.timeError : undefined}
                onChange={handleTimeChange}
              />
              <Select
                css={{ flex: 1 }}
                label={messages.meridianLabel}
                placeholder={messages.meridianPlaceholder}
                hideLabel
                disabled={!contestEndDate}
                value={meridianValue}
                onChange={handleMeridianChange}
                options={[
                  { value: 'AM', label: 'AM' },
                  { value: 'PM', label: 'PM' }
                ]}
              />
            </Flex>
            <Hint>
              <Text variant='body' color='subdued'>
                {messages.hint}
              </Text>
            </Hint>
          </Flex>
          <Button
            variant='secondary'
            onClick={handleSubmit}
            disabled={!contestEndDate || endDateError || timeError}
            className={css({ alignSelf: 'center' })}
          >
            {isEdit ? messages.save : messages.startContest}
          </Button>
        </Flex>
      </ModalContent>
    </Modal>
  )
}
