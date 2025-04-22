import { useCallback, useState } from 'react'

import {
  useCreateEvent,
  useCurrentUserId,
  useDeleteEvent,
  useRemixContest,
  useRemixes,
  useUpdateEvent
} from '@audius/common/api'
import { useHostRemixContestModal } from '@audius/common/store'
import { dayjs } from '@audius/common/utils'
import {
  Button,
  Divider,
  Flex,
  Hint,
  IconTrophy,
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  Select,
  Text,
  TextLink
} from '@audius/harmony'
import { EventEntityTypeEnum, EventEventTypeEnum } from '@audius/sdk'

import { TextAreaV2 } from 'components/data-entry/TextAreaV2'
import { DatePicker } from 'components/edit/fields/DatePickerField'
import { mergeReleaseDateValues } from 'components/edit/fields/visibility/mergeReleaseDateValues'

import { TimeInput, parseTime } from './TimeInput'

const messages = {
  hostTitle: 'Host Remix Contest',
  description:
    'Turn your track into a remix challenge and co-sign your favorite submissions.',
  hint: 'You can host one contest per song and adjust the submission deadline anytime within 90 days of the contest start.',
  startContest: 'Start Contest',
  save: 'Save',
  contestEndDateLabel: 'Last day to submit to contest',
  endDateError: 'Contest end date must be in the future within 90 days',
  descriptionLabel: 'Contest Description',
  descriptionPlaceholder:
    'Write your contest description here. Include clear rules, guidelines, and any other important details you want your fans to know about your contest.',
  descriptionError: 'Contest description is required',
  prizeInfoLabel: 'Prizes',
  prizeInfoPlaceholder:
    'Describe what winners will receive. Be clear about how many winners there will be, and what each prize includes (e.g. cash, reposts, feedback, collaborations, etc.)',
  deadlineLabel: 'Submission Deadline',
  timeLabel: 'Time',
  timePlaceholder: '12:00',
  timeError: 'Invalid time',
  meridianLabel: 'Meridian',
  meridianPlaceholder: 'AM',
  turnOff: 'Turn Off Contest',
  contestHostingLabel: 'Learn how to host a remix contest'
}

const contestHostingLink =
  'https://help.audius.co/artists/hosting-a-remix-contest'

type RemixContestData = {
  description: string
  prizeInfo: string
}

export const HostRemixContestModal = () => {
  const { data, isOpen, onClose, onClosed } = useHostRemixContestModal()
  const { trackId } = data
  const { mutate: createEvent } = useCreateEvent()
  const { mutate: updateEvent } = useUpdateEvent()
  const { mutate: deleteEvent } = useDeleteEvent()
  const { data: userId } = useCurrentUserId()
  const { data: remixes, isLoading: remixesLoading } = useRemixes({
    trackId,
    isContestEntry: true
  })
  const { data: remixContest } = useRemixContest(trackId)
  const isEdit = !!remixContest
  const hasContestEntries = remixesLoading || remixes?.length
  const displayTurnOffButton = !hasContestEntries && isEdit

  const remixContestData = remixContest?.eventData as RemixContestData

  // Form state
  const [contestDescription, setContestDescription] = useState(
    remixContestData ? remixContestData.description : ''
  )
  const [contestPrizeInfo, setContestPrizeInfo] = useState(
    remixContestData ? remixContestData.prizeInfo : ''
  )
  const [contestEndDate, setContestEndDate] = useState(
    remixContest ? dayjs(remixContest.endDate) : null
  )
  const [endDateTouched, setEndDateTouched] = useState(false)
  const [endDateError, setEndDateError] = useState(false)
  const [descriptionError, setDescriptionError] = useState(false)
  const [timeValue, setTimeValue] = useState(
    contestEndDate ? dayjs(contestEndDate).format('hh:mm') : ''
  )
  const [timeError, setTimeError] = useState(false)
  const [meridianValue, setMeridianValue] = useState(
    contestEndDate ? dayjs(contestEndDate).format('A') : ''
  )

  const handleEndDateChange = useCallback(
    (value: string) => {
      setContestEndDate(dayjs(value))
      if (value && !timeValue) {
        setTimeValue('11:59')
        setMeridianValue('PM')
      }
      setEndDateError(false)
    },
    [timeValue]
  )

  const handleTimeChange = useCallback((value: string) => {
    setTimeValue(value)
    setEndDateError(false)
  }, [])

  const handleTimeError = useCallback((hasError: boolean) => {
    setTimeError(hasError)
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

    const hasDescriptionError = !contestDescription
    const hasDateError =
      !parsedDate ||
      dayjs(parsedDate.toISOString()).isBefore(dayjs()) ||
      dayjs(parsedDate.toISOString()).isAfter(dayjs().add(90, 'days'))
    const hasError = hasDateError || hasDescriptionError

    setEndDateTouched(true)
    setEndDateError(hasDateError)
    setDescriptionError(hasDescriptionError)
    if (hasError || !trackId || !userId) return

    const endDate = parsedDate.toISOString()

    const eventData: RemixContestData = {
      description: contestDescription,
      prizeInfo: contestPrizeInfo
    }

    if (isEdit) {
      updateEvent({
        eventId: remixContest.eventId,
        eventData,
        endDate,
        userId
      })
    } else {
      createEvent({
        eventType: EventEventTypeEnum.RemixContest,
        entityType: EventEntityTypeEnum.Track,
        entityId: trackId,
        eventData,
        endDate,
        userId
      })
    }

    onClose()
  }, [
    timeValue,
    contestEndDate,
    meridianValue,
    trackId,
    userId,
    isEdit,
    onClose,
    updateEvent,
    remixContest?.eventId,
    contestDescription,
    contestPrizeInfo,
    createEvent
  ])

  const handleDeleteEvent = useCallback(() => {
    if (!remixContest || !userId) return
    deleteEvent({ eventId: remixContest.eventId, userId })
    onClose()
  }, [remixContest, userId, deleteEvent, onClose])

  return (
    <Modal isOpen={isOpen} onClose={onClose} onClosed={onClosed} size='medium'>
      <ModalHeader onClose={onClose}>
        <ModalTitle Icon={IconTrophy} title={messages.hostTitle} />
      </ModalHeader>
      <ModalContent>
        <Flex direction='column' gap='xl'>
          <Text variant='body'>{messages.description}</Text>
          <Flex direction='column' gap='l'>
            <Text
              variant='title'
              size='l'
              tag='label'
              htmlFor='contestDescription'
            >
              {messages.descriptionLabel}
            </Text>
            <TextAreaV2
              id='contestDescription'
              aria-label='contestDescription'
              placeholder={messages.descriptionPlaceholder}
              maxLength={1000}
              value={contestDescription}
              error={descriptionError}
              helperText={
                descriptionError ? messages.descriptionError : undefined
              }
              onChange={(e) => setContestDescription(e.target.value)}
              css={{ minHeight: 144, maxHeight: 300 }}
              showMaxLength
            />
            <TextLink variant='visible' href={contestHostingLink} isExternal>
              {messages.contestHostingLabel}
            </TextLink>
          </Flex>
          <Divider color='default' />
          <Flex direction='column' gap='l'>
            <Text
              variant='title'
              size='l'
              tag='label'
              htmlFor='contestPrizeInfo'
            >
              {messages.prizeInfoLabel}
            </Text>
            <TextAreaV2
              id='contestPrizeInfo'
              aria-label='contestPrizeInfo'
              placeholder={messages.prizeInfoPlaceholder}
              maxLength={1000}
              css={{ minHeight: 144, maxHeight: 300 }}
              showMaxLength
              value={contestPrizeInfo}
              onChange={(e) => setContestPrizeInfo(e.target.value)}
            />
          </Flex>
          <Divider color='default' />
          <Flex direction='column' gap='l'>
            <Text variant='title' size='l'>
              {messages.deadlineLabel}
            </Text>
            <DatePicker
              name='contestEndDate'
              label={messages.contestEndDateLabel}
              onChange={handleEndDateChange}
              value={contestEndDate?.toISOString()}
              futureDatesOnly
              error={endDateError ? messages.endDateError : undefined}
              touched={endDateTouched}
              maxDate={dayjs().add(90, 'days').toDate()}
            />
            <Flex gap='l'>
              <TimeInput
                css={{ flex: 1 }}
                label={messages.timeLabel}
                placeholder={messages.timePlaceholder}
                disabled={!contestEndDate}
                value={timeValue}
                helperText={timeError ? messages.timeError : undefined}
                onChange={handleTimeChange}
                onError={handleTimeError}
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
          <Flex gap='l' justifyContent='center'>
            {displayTurnOffButton ? (
              <Button
                variant='secondary'
                onClick={handleDeleteEvent}
                fullWidth={displayTurnOffButton}
              >
                {messages.turnOff}
              </Button>
            ) : null}
            <Button
              variant='primary'
              onClick={handleSubmit}
              disabled={!contestEndDate || endDateError || timeError}
              fullWidth={displayTurnOffButton}
            >
              {isEdit ? messages.save : messages.startContest}
            </Button>
          </Flex>
        </Flex>
      </ModalContent>
    </Modal>
  )
}
