import { useMemo, useState } from 'react'

import { Track } from '@audius/common/models'
import { dayjs } from '@audius/common/utils'
import { Button, Flex, IconCalendarMonth, Text } from '@audius/harmony'
import moment from 'moment'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import {
  RELEASE_DATE,
  RELEASE_DATE_HOUR,
  RELEASE_DATE_MERIDIAN,
  RELEASE_DATE_TYPE,
  ReleaseDateRadioItems,
  ReleaseDateType,
  mergeDateTimeValues,
  ReleaseDateFormValues,
  timeValidationSchema
} from 'pages/upload-page/fields/ReleaseDateField'
import { formatCalendarTime } from 'utils/dateUtils'

import { ContextualMenu } from './ContextualMenu'
import styles from './ReleaseDateTriggerLegacy.module.css'

const messages = {
  title: 'Release Date',
  description:
    "Customize your music's availability for different audiences, and create personalized gated experiences for your fans."
}

type TrackMetadataState = {
  is_scheduled_release: boolean
  is_unlisted: boolean
  release_date: string
}

type ReleaseDateTriggerLegacyProps = {
  isRemix: boolean
  isUpload: boolean
  initialForm: Track
  metadataState: TrackMetadataState
  trackLength: number
  didUpdateState: (newState: TrackMetadataState) => void
}

export const ReleaseDateTriggerLegacy = (
  props: ReleaseDateTriggerLegacyProps
) => {
  const { didUpdateState, metadataState } = props
  const trackReleaseDate = props.metadataState.release_date
  const [trackReleaseDateState, setTrackReleaseDateState] = useState(
    moment(trackReleaseDate).toString()
  )
  const initialValues = useMemo(() => {
    return {
      [RELEASE_DATE]:
        trackReleaseDateState ?? moment(trackReleaseDateState).toString(),
      [RELEASE_DATE_HOUR]: trackReleaseDateState
        ? moment(trackReleaseDateState).format('h:mm')
        : moment().format('h:mm'),
      [RELEASE_DATE_MERIDIAN]: trackReleaseDateState
        ? moment(trackReleaseDateState).format('A')
        : moment().format('A'),
      [RELEASE_DATE_TYPE]: ReleaseDateType.SCHEDULED_RELEASE
    }
  }, [trackReleaseDateState])
  const onSubmit = (values: ReleaseDateFormValues) => {
    const mergedReleaseDate = mergeDateTimeValues(
      values[RELEASE_DATE],
      values[RELEASE_DATE_HOUR],
      values[RELEASE_DATE_MERIDIAN]
    )

    const dayjsTime = dayjs(mergedReleaseDate.toString())
      // @ts-ignore
      .utc()
      .format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ')

    const newState = {
      ...metadataState,
      release_date: dayjsTime
    }
    if (values[RELEASE_DATE_TYPE] === ReleaseDateType.RELEASE_NOW) {
      // publish if release now or release date has passed
      newState.is_unlisted = false

      newState.release_date = dayjs()
        // @ts-ignore
        .utc()
        .format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ')
    } else if (mergedReleaseDate.isBefore(moment())) {
      newState.is_unlisted = false
    } else {
      newState.is_unlisted = true
      newState.is_scheduled_release = true
    }
    props.initialForm.release_date = newState.release_date

    setTrackReleaseDateState(newState.release_date)
    setTrackReleaseDateState(newState.release_date)
    didUpdateState(newState)
  }

  return (
    <ContextualMenu
      label={messages.title}
      description={messages.description}
      icon={<IconCalendarMonth />}
      initialValues={initialValues}
      validationSchema={toFormikValidationSchema(timeValidationSchema)}
      onSubmit={onSubmit}
      menuFields={
        <>
          <Flex direction='column' gap='l'>
            <Text variant='body'>{messages.description}</Text>
            <ReleaseDateRadioItems
              isInitiallyUnlisted={props.initialForm.is_unlisted}
              initialReleaseDate={trackReleaseDateState}
            />
          </Flex>
        </>
      }
      renderValue={() => null}
      previewOverride={(toggleMenu) => (
        <Button
          className={styles.releaseDateButton}
          variant='secondary'
          name='releaseDateModal'
          size='small'
          onClick={toggleMenu}
          iconLeft={IconCalendarMonth}
        >
          {formatCalendarTime(trackReleaseDate, 'Scheduled for')}
        </Button>
      )}
    />
  )
}
