import { useCallback, useMemo } from 'react'

import {
  Genre,
  HashId,
  Mood,
  PremiumConditionsFollowUserId,
  PremiumConditionsNFTCollection,
  PremiumConditionsTipUserId
} from '@audius/sdk'
import {
  HarmonyButton,
  HarmonyButtonType,
  IconArrow,
  IconCaretRight
} from '@audius/stems'
import cn from 'classnames'
import { Form, Formik, FormikProps, useField } from 'formik'
import moment from 'moment'
import { z } from 'zod'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { ReactComponent as IconCaretLeft } from 'assets/img/iconCaretLeft.svg'
import layoutStyles from 'components/layout/layout.module.css'
import { Text } from 'components/typography'
import PreviewButton from 'components/upload/PreviewButton'

import { MultiTrackSidebar } from '../fields/MultiTrackSidebar'
import { TrackMetadataFields } from '../fields/TrackMetadataFields'
import { defaultHiddenFields } from '../fields/availability/HiddenAvailabilityFields'
import { TrackEditFormValues } from '../forms/types'

import styles from './EditPageNew.module.css'
import { TrackModalArray } from './TrackModalArray'
import { TrackForUpload } from './types'

const messages = {
  titleError: 'Your track must have a name',
  artworkError: 'Artwork is required',
  genreError: 'Genre is required',
  multiTrackCount: (index: number, total: number) =>
    `TRACK ${index} of ${total}`,
  prev: 'Prev',
  next: 'Next Track',
  titleRequiredError: 'Your track must have a name',
  artworkRequiredError: 'Artwork is required',
  genreRequiredError: 'Genre is required',
  invalidReleaseDateError: 'Release date should no be in the future'
}

type EditPageProps = {
  tracks: TrackForUpload[]
  setTracks: (tracks: TrackForUpload[]) => void
  onContinue: () => void
}

// TODO: KJ - Need to update the schema in sdk and then import here
const createUploadTrackMetadataSchema = () =>
  z.object({
    aiAttributionUserId: z.optional(HashId),
    description: z.optional(z.string().max(1000)),
    download: z.optional(
      z
        .object({
          cid: z.string(),
          isDownloadable: z.boolean(),
          requiresFollow: z.boolean()
        })
        .strict()
        .nullable()
    ),
    fieldVisibility: z.optional(
      z.object({
        mood: z.optional(z.boolean()),
        tags: z.optional(z.boolean()),
        genre: z.optional(z.boolean()),
        share: z.optional(z.boolean()),
        playCount: z.optional(z.boolean()),
        remixes: z.optional(z.boolean())
      })
    ),
    genre: z
      .enum(Object.values(Genre) as [Genre, ...Genre[]])
      .nullable()
      .refine((val) => val !== null, {
        message: messages.genreRequiredError
      }),
    isPremium: z.optional(z.boolean()),
    isrc: z.optional(z.string().nullable()),
    isUnlisted: z.optional(z.boolean()),
    iswc: z.optional(z.string().nullable()),
    license: z.optional(z.string().nullable()),
    mood: z
      .optional(z.enum(Object.values(Mood) as [Mood, ...Mood[]]))
      .nullable(),
    premiumConditions: z.optional(
      z.union([
        PremiumConditionsNFTCollection,
        PremiumConditionsFollowUserId,
        PremiumConditionsTipUserId
      ])
    ),
    releaseDate: z.optional(
      z.date().max(new Date(), { message: messages.invalidReleaseDateError })
    ),
    remixOf: z.optional(
      z
        .object({
          tracks: z
            .array(
              z.object({
                parentTrackId: HashId
              })
            )
            .min(1)
        })
        .strict()
    ),
    tags: z.optional(z.string()),
    title: z.string({
      required_error: messages.titleRequiredError
    }),
    previewStartSeconds: z.optional(z.number()),
    audioUploadId: z.optional(z.string()),
    previewCid: z.optional(z.string())
  })

const createTrackMetadataSchema = () => {
  return createUploadTrackMetadataSchema()
    .merge(
      z.object({
        artwork: z
          .object({
            url: z.string()
          })
          .nullable()
      })
    )
    .refine((form) => form.artwork !== null, {
      message: messages.artworkRequiredError,
      path: ['artwork']
    })
}

export type TrackMetadataValues = z.input<
  ReturnType<typeof createTrackMetadataSchema>
>

const EditFormValidationSchema = () =>
  z.object({
    trackMetadatas: z.array(createTrackMetadataSchema())
  })

export const EditPageNew = (props: EditPageProps) => {
  const { tracks, setTracks, onContinue } = props

  // @ts-ignore - Slight differences in the sdk vs common track metadata types
  const initialValues: TrackEditFormValues = useMemo(
    () => ({
      trackMetadatasIndex: 0,
      trackMetadatas: tracks.map((track) => ({
        ...track.metadata,
        artwork: null,
        description: '',
        releaseDate: new Date(moment().startOf('day').toString()),
        tags: '',
        field_visibility: {
          ...defaultHiddenFields,
          remixes: true
        },
        licenseType: {
          allowAttribution: null,
          commercialUse: null,
          derivativeWorks: null
        }
      }))
    }),
    [tracks]
  )

  const onSubmit = useCallback(
    (values: TrackEditFormValues) => {
      const tracksForUpload: TrackForUpload[] = tracks.map((track, i) => ({
        ...track,
        metadata: values.trackMetadatas[i]
      }))
      setTracks(tracksForUpload)
      onContinue()
    },
    [onContinue, setTracks, tracks]
  )

  return (
    <Formik<TrackEditFormValues>
      initialValues={initialValues}
      onSubmit={onSubmit}
      // @ts-ignore - There are slight mismatches between the sdk and common track metadata types
      validationSchema={toFormikValidationSchema(EditFormValidationSchema())}
    >
      {TrackEditForm}
    </Formik>
  )
}

const TrackEditForm = (props: FormikProps<TrackEditFormValues>) => {
  const { values } = props
  const isMultiTrack = values.trackMetadatas.length > 1

  return (
    <Form>
      <div className={cn(layoutStyles.row, layoutStyles.gap2)}>
        <div className={styles.formContainer}>
          {isMultiTrack ? <MultiTrackHeader /> : null}
          <div className={styles.trackEditForm}>
            <TrackMetadataFields playing={false} />
            <TrackModalArray />
            <PreviewButton playing={false} onClick={() => {}} />
          </div>
          {isMultiTrack ? <MultiTrackFooter /> : null}
        </div>
        {isMultiTrack ? <MultiTrackSidebar /> : null}
      </div>
      {!isMultiTrack ? (
        <div className={styles.continue}>
          <HarmonyButton
            variant={HarmonyButtonType.PRIMARY}
            text='Continue'
            name='continue'
            iconRight={IconArrow}
            className={styles.continueButton}
          />
        </div>
      ) : null}
    </Form>
  )
}

const MultiTrackHeader = () => {
  const [{ value: index }] = useField('trackMetadatasIndex')
  const [{ value: trackMetadatas }] = useField('trackMetadatas')

  return (
    <div className={styles.multiTrackHeader}>
      <Text variant='title' size='xSmall'>
        {messages.multiTrackCount(index + 1, trackMetadatas.length)}
      </Text>
    </div>
  )
}

const MultiTrackFooter = () => {
  const [{ value: index }, , { setValue: setIndex }] = useField(
    'trackMetadatasIndex'
  )
  const [{ value: trackMetadatas }] = useField('trackMetadatas')

  const goPrev = useCallback(() => {
    setIndex(Math.max(index - 1, 0))
  }, [index, setIndex])
  const goNext = useCallback(() => {
    setIndex(Math.min(index + 1, trackMetadatas.length - 1))
  }, [index, setIndex, trackMetadatas.length])

  const prevDisabled = index === 0
  const nextDisabled = index === trackMetadatas.length - 1
  return (
    <div className={cn(styles.multiTrackFooter, layoutStyles.row)}>
      <HarmonyButton
        className={cn({ [styles.disabled]: prevDisabled })}
        variant={HarmonyButtonType.PLAIN}
        text={messages.prev}
        iconLeft={IconCaretLeft}
        onClick={goPrev}
        disabled={prevDisabled}
      />
      <HarmonyButton
        className={cn({ [styles.disabled]: nextDisabled })}
        variant={HarmonyButtonType.PLAIN}
        text={messages.next}
        iconRight={IconCaretRight}
        onClick={goNext}
        disabled={nextDisabled}
      />
    </div>
  )
}
