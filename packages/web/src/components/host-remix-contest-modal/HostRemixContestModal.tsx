import { useCallback, useState } from 'react'

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
import dayjs from 'dayjs'

import { DatePicker } from 'components/edit/fields/DatePickerField'
import { mergeReleaseDateValues } from 'components/edit/fields/visibility/mergeReleaseDateValues'

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
  meridianLabel: 'Meridian',
  meridianPlaceholder: 'AM'
}

export const HostRemixContestModal = () => {
  const { data, isOpen, onClose, onClosed } = useHostRemixContestModal()
  const { trackId } = data
  const { mutate: createEvent } = useCreateEvent()
  const { mutate: updateEvent } = useUpdateEvent()
  const { data: userId } = useCurrentUserId()
  const { data: event } = useRemixContest(trackId, {
    entityType: EventEntityTypeEnum.Track
  })
  const isEdit = !!event

  const [contestEndDate, setContestEndDate] = useState(
    event ? dayjs(event.endDate) : null
  )
  const [endDateTouched, setEndDateTouched] = useState(false)
  const [endDateError, setEndDateError] = useState(false)

  const meridianValue = contestEndDate ? dayjs(contestEndDate).format('A') : ''
  const timeValue = contestEndDate ? dayjs(contestEndDate).format('hh:mm') : ''
  const [timeInputValue, setTimeInputValue] = useState(timeValue)

  const handleChange = useCallback(
    (date: string, time: string, meridian: string) => {
      const newDate = mergeReleaseDateValues(date, time, meridian)
      setContestEndDate(dayjs(newDate.toISOString()))
    },
    []
  )

  const handleSubmit = useCallback(() => {
    const hasError = !contestEndDate

    setEndDateTouched(true)
    setEndDateError(hasError)
    if (hasError || !trackId || !userId) return

    const endDate = contestEndDate.toISOString()

    if (isEdit) {
      updateEvent({
        eventId: event.eventId,
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
    trackId,
    userId,
    isEdit,
    onClose,
    updateEvent,
    event?.eventId,
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
              onChange={(value) =>
                handleChange(value, timeValue, meridianValue)
              }
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
                value={timeInputValue}
                disabled={!contestEndDate}
                onChange={(e) => {
                  setTimeInputValue(e.target.value)
                  handleChange(
                    contestEndDate?.toISOString() ?? '',
                    e.target.value,
                    meridianValue
                  )
                }}
              />
              <Select
                css={{ flex: 1 }}
                label={messages.meridianLabel}
                placeholder={messages.meridianPlaceholder}
                hideLabel
                value={meridianValue}
                disabled={!contestEndDate}
                onChange={(value) =>
                  handleChange(
                    contestEndDate?.toISOString() ?? '',
                    timeValue,
                    value
                  )
                }
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
            disabled={!contestEndDate || endDateError}
            className={css({ alignSelf: 'center' })}
          >
            {isEdit ? messages.save : messages.startContest}
          </Button>
        </Flex>
      </ModalContent>
    </Modal>
  )
}
