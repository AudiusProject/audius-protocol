import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  Track,
  UserMetadata,
  Nullable,
  ID,
  useGetTrackById,
  getPathFromTrackUrl,
  useGetTrackByPermalink,
  SquareSizes,
  accountSelectors,
  FieldVisibility,
  encodeHashId
} from '@audius/common'
import { Formik, useField } from 'formik'
import { get, set } from 'lodash'
import { useSelector } from 'react-redux'
import { z } from 'zod'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { ReactComponent as IconRemix } from 'assets/img/iconRemixGray.svg'
import { InputV2Size, InputV2Variant } from 'components/data-entry/InputV2'
import { Divider } from 'components/divider'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import { TextField } from 'components/form-fields'
import { Text } from 'components/typography'
import UserBadges from 'components/user-badges/UserBadges'
import { useTrackCoverArt } from 'hooks/useTrackCoverArt'
import { fullTrackPage, stripBaseUrl } from 'utils/route'

import { ModalField } from '../fields/ModalField'
import { SwitchRowField } from '../fields/SwitchRowField'

import styles from './RemixModalForm.module.css'
import { SingleTrackEditValues } from './types'
import { useTrackField } from './utils'

const { getUserId } = accountSelectors

const messages = {
  title: 'Remix Settings',
  description:
    'Mark your music as a remix, tag the original track, and customize remix settings.',
  by: 'by',
  hideRemix: {
    header: 'Hide Remixes of This Track',
    description:
      'Enable this option if you want to prevent remixes of your track by other artists from appearing on your track page.'
  },
  remixOf: {
    header: 'Identify as Remix',
    description:
      "Paste the original Audius track link if yours is a remix. Your remix will typically appear on the original track's page.",
    linkLabel: 'Link to Remix'
  },
  remixLinkError: 'Must provide valid remix link'
}

export type RemixOfField = Nullable<{ tracks: { parent_track_id: ID }[] }>

export const REMIX_OF = 'remix_of'
export const SHOW_REMIXES_BASE = `remixes`
export const SHOW_REMIXES = `field_visibility.remixes`

const IS_REMIX = 'is_remix'
const REMIX_LINK = 'remix_of_link'
const IS_VALID_REMIX_LINK = 'is_valid_remix_link'

const RemixFormSchema = z
  .object({
    [SHOW_REMIXES]: z.optional(z.boolean()),
    [IS_REMIX]: z.boolean(),
    [REMIX_LINK]: z.optional(z.string()),
    [IS_VALID_REMIX_LINK]: z.boolean()
  })
  .refine((form) => !form[IS_REMIX] || form[IS_VALID_REMIX_LINK], {
    message: messages.remixLinkError,
    path: [REMIX_LINK]
  })

export type RemixFormValues = z.input<typeof RemixFormSchema>

/**
 * This is a subform that expects to exist within a parent TrackEdit form.
 * The useField calls reference the outer form's fields which much match the name constants.
 */
export const RemixModalForm = () => {
  // These refer to the field in the outer EditForm
  const [{ value: showRemixesValue }, , { setValue: setShowRemixesValue }] =
    useTrackField<FieldVisibility[typeof SHOW_REMIXES_BASE]>(SHOW_REMIXES)
  const [{ value: remixOfValue }, , { setValue: setRemixOfValue }] =
    useTrackField<SingleTrackEditValues[typeof REMIX_OF]>(REMIX_OF)

  const trackId = remixOfValue?.tracks[0].parent_track_id
  const { data: initialRemixedTrack } = useGetTrackById(
    { id: trackId! },
    { disabled: !trackId }
  )

  const remixLink = initialRemixedTrack?.permalink
    ? fullTrackPage(initialRemixedTrack?.permalink)
    : ''

  const initialValues = useMemo(() => {
    const initialValues = {}
    set(initialValues, SHOW_REMIXES, showRemixesValue)
    set(
      initialValues,
      IS_REMIX,
      !!remixOfValue?.tracks.some((track) => !!track)
    )
    set(initialValues, REMIX_LINK, remixLink)
    set(initialValues, IS_VALID_REMIX_LINK, false)
    return initialValues as RemixFormValues
  }, [showRemixesValue, remixOfValue?.tracks, remixLink])

  const [url, setUrl] = useState<string>()

  const currentUserId = useSelector(getUserId)
  const { data: linkedTrack } = useGetTrackByPermalink(
    { permalink: url!, currentUserId },
    { disabled: !url }
  )

  const onSubmit = useCallback(
    (values: RemixFormValues) => {
      setShowRemixesValue(get(values, SHOW_REMIXES) ?? showRemixesValue)
      if (get(values, IS_REMIX) && get(values, REMIX_LINK)) {
        // TODO: handle undefined linkedTrack with form validation
        setRemixOfValue({
          tracks: [
            {
              // @ts-ignore only the track_id is required for the form
              parent_track_id: linkedTrack
                ? encodeHashId(linkedTrack?.track_id)
                : undefined
            }
          ]
        })
      }
    },
    [setShowRemixesValue, showRemixesValue, setRemixOfValue, linkedTrack]
  )

  const preview = (
    <div className={styles.preview}>
      <div className={styles.header}>
        <Text className={styles.title} variant='title' size='large'>
          {messages.title}
        </Text>
      </div>
      <Text>{messages.description}</Text>
    </div>
  )

  return (
    <Formik<RemixFormValues>
      initialValues={initialValues}
      onSubmit={onSubmit}
      validationSchema={toFormikValidationSchema(RemixFormSchema)}
      enableReinitialize
    >
      {() => {
        return (
          <ModalField
            title={messages.title}
            icon={<IconRemix className={styles.titleIcon} />}
            preview={preview}
          >
            <RemixModalFields setUrl={setUrl} />
          </ModalField>
        )
      }}
    </Formik>
  )
}

type RemixModalFieldsProps = {
  setUrl: (url: string) => void
}

const RemixModalFields = (props: RemixModalFieldsProps) => {
  const { setUrl } = props
  const [{ onChange: onLinkFieldChange, ...linkField }] = useField(REMIX_LINK)
  const [, , { setValue: setIsValidRemixLink }] = useField(IS_VALID_REMIX_LINK)
  const permalink = getPathFromTrackUrl(linkField.value)
  const currentUserId = useSelector(getUserId)
  const { data: track } = useGetTrackByPermalink(
    {
      permalink,
      currentUserId
    },
    { disabled: !permalink }
  )

  useEffect(() => {
    setIsValidRemixLink(!!track)
  }, [setIsValidRemixLink, track])

  return (
    <div className={styles.fields}>
      <SwitchRowField
        name={SHOW_REMIXES}
        header={messages.hideRemix.header}
        description={messages.hideRemix.description}
        inverted
      />
      <Divider />
      <SwitchRowField
        name={IS_REMIX}
        header={messages.remixOf.header}
        description={messages.remixOf.description}
      >
        <TextField
          id='remix_of_input'
          variant={InputV2Variant.ELEVATED_PLACEHOLDER}
          label={messages.remixOf.linkLabel}
          size={InputV2Size.LARGE}
          onChange={(e) => {
            // setUrl(e.target.value)
            setUrl(stripBaseUrl(e.target.value))
            onLinkFieldChange(e)
          }}
          {...linkField}
        />
        {/* @ts-ignore TDOO: need to populate track with cover art sizes */}
        {track ? <TrackInfo user={track.user} track={track} /> : null}
      </SwitchRowField>
    </div>
  )
}

type TrackInfoProps = {
  track: Track | null
  user: UserMetadata | null
}

const TrackInfo = ({ track, user }: TrackInfoProps) => {
  const image = useTrackCoverArt(
    track?.track_id || null,
    track?._cover_art_sizes || null,
    SquareSizes.SIZE_150_BY_150
  )

  if (!track || !user) return null
  return (
    <div className={styles.track}>
      <DynamicImage wrapperClassName={styles.artwork} image={image} />
      {track.title}
      <div className={styles.by}>{messages.by}</div>
      <div className={styles.artistName}>
        {user.name}
        <UserBadges
          className={styles.iconVerified}
          userId={user.user_id}
          badgeSize={14}
        />
      </div>
    </div>
  )
}
