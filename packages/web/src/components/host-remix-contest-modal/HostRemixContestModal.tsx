import { useCallback, useState } from 'react'

import { useCreateEvent, useCurrentUserId } from '@audius/common/api'
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
import moment from 'moment'

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
  endDateError: 'Please select a date in the future',
  timeLabel: 'Time',
  timePlaceholder: '12:00',
  meridianLabel: 'Meridian',
  meridianPlaceholder: 'AM'
}

export const HostRemixContestModal = () => {
  // TODO: Need to update this to check the track events when the backend returns it
  // Should update the submit button copy, the submit function call, and prepopulate the datepicker value
  // Can get the track id from the data from the modal hook
  const { data, isOpen, onClose } = useHostRemixContestModal()
  const [contestEndDate, setContestEndDate] = useState(
    moment().add(1, 'day').endOf('day').toISOString()
  )
  const [endDateTouched, setEndDateTouched] = useState(false)
  const [endDateError, setEndDateError] = useState(false)
  const { mutate: createEvent } = useCreateEvent()
  const { data: currentUserId } = useCurrentUserId()

  const meridianValue = moment(contestEndDate).format('A')
  const timeValue = moment(contestEndDate).format('hh:mm')
  const [timeInputValue, setTimeInputValue] = useState(timeValue)

  const { trackId } = data

  const handleChange = useCallback(
    (date: string, time: string, meridian: string) => {
      const newDate = mergeReleaseDateValues(date, time, meridian)
      setContestEndDate(newDate.toISOString())
    },
    []
  )

  const handleSubmit = useCallback(() => {
    const hasError = !contestEndDate

    setEndDateTouched(true)
    setEndDateError(hasError)
    if (hasError) return

    const endDate = moment(contestEndDate).toISOString()

    // Create event
    createEvent({
      eventType: EventEventTypeEnum.RemixContest,
      entityType: EventEntityTypeEnum.Track,
      entityId: trackId ?? undefined,
      endDate,
      userId: currentUserId!
    })

    // Reset form and close modal
    setContestEndDate(moment().add(1, 'day').endOf('day').toISOString())
    onClose()
  }, [contestEndDate, createEvent, trackId, currentUserId, onClose])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size='small'
      bodyClassName={css({
        width: '100%',
        maxWidth: 720
      })}
    >
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
              value={contestEndDate}
              futureDatesOnly
              error={endDateError ? messages.endDateError : undefined}
              touched={endDateTouched}
            />
            <Flex>
              <TextInput
                label={messages.timeLabel}
                placeholder={messages.timePlaceholder}
                value={timeInputValue}
                onChange={(e) => {
                  setTimeInputValue(e.target.value)
                  handleChange(contestEndDate, e.target.value, meridianValue)
                }}
              />
              <Select
                label={messages.meridianLabel}
                placeholder={messages.meridianPlaceholder}
                hideLabel
                value={meridianValue}
                onChange={(value) =>
                  handleChange(contestEndDate, timeValue, value)
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
            className={css({ alignSelf: 'center' })}
          >
            {messages.startContest}
          </Button>
        </Flex>
      </ModalContent>
    </Modal>
  )
}
