import { useCallback, useMemo } from 'react'

import type { Nullable } from '@audius/common'
import type { AccessConditions } from '@audius/common/models'
import { useField } from 'formik'

// This hook allows us to set track availability fields during upload.
// It has to be used with a Formik context because it uses formik's useField hook.
export const useSetTrackAvailabilityFields = () => {
  const [, , { setValue: setIsStreamGated }] =
    useField<boolean>('is_stream_gated')
  const [, , { setValue: setStreamConditions }] =
    useField<Nullable<AccessConditions>>('stream_conditions')
  const [{ value: isUnlisted }, , { setValue: setIsUnlisted }] =
    useField<boolean>('is_unlisted')
  const [{ value: isScheduledRelease }, ,] = useField<boolean>(
    'is_scheduled_release'
  )
  const [, , { setValue: setPreviewStartSeconds }] = useField<number>(
    'preview_start_seconds'
  )
  const [, , { setValue: setGenre }] = useField<boolean>(
    'field_visibility.genre'
  )
  const [, , { setValue: setMood }] = useField<boolean>('field_visibility.mood')
  const [, , { setValue: setTags }] = useField<boolean>('field_visibility.tags')
  const [, , { setValue: setShare }] = useField<boolean>(
    'field_visibility.share'
  )
  const [, , { setValue: setPlayCount }] = useField<boolean>(
    'field_visibility.play_count'
  )
  const [, , { setValue: setRemixes }] = useField<boolean>(
    'field_visibility.remixes'
  )

  const defaultTrackAvailabilityFields = useMemo(
    () => ({
      is_stream_gated: false,
      stream_conditions: null as Nullable<AccessConditions>,
      is_unlisted: !!(isScheduledRelease && isUnlisted), // scheduled releases cannot be made public via access & sale
      preview_start_seconds: null as Nullable<Number>,
      'field_visibility.genre': true,
      'field_visibility.mood': true,
      'field_visibility.tags': true,
      'field_visibility.share': true,
      'field_visibility.play_count': true,
      'field_visibility.remixes': true
    }),
    [isScheduledRelease, isUnlisted]
  )
  type TrackAvailabilityField = typeof defaultTrackAvailabilityFields

  const fieldSetters = useMemo(() => {
    return {
      is_stream_gated: setIsStreamGated,
      stream_conditions: setStreamConditions,
      is_unlisted: setIsUnlisted,
      preview_start_seconds: setPreviewStartSeconds,
      'field_visibility.genre': setGenre,
      'field_visibility.mood': setMood,
      'field_visibility.tags': setTags,
      'field_visibility.share': setShare,
      'field_visibility.play_count': setPlayCount,
      'field_visibility.remixes': setRemixes
    }
    // adding the useField setters cause infinite rendering
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const set = useCallback(
    (
      fieldValues: Partial<TrackAvailabilityField>,
      resetOtherFields = false
    ) => {
      const givenKeys = Object.keys(fieldValues)
      givenKeys.forEach((key) => {
        const value = fieldValues[key]
        const setter = fieldSetters[key]
        setter(value)
      })

      if (resetOtherFields) {
        const givenKeySet = new Set(givenKeys)
        const otherKeys = Object.keys(defaultTrackAvailabilityFields).filter(
          (key) => !givenKeySet.has(key)
        )
        otherKeys.forEach((key) => {
          const value = defaultTrackAvailabilityFields[key]
          const setter = fieldSetters[key]
          setter(value)
        })
      }
    },
    [defaultTrackAvailabilityFields, fieldSetters]
  )

  const reset = useCallback(() => {
    Object.keys(defaultTrackAvailabilityFields).forEach((key) => {
      const value = defaultTrackAvailabilityFields[key]
      const setter = fieldSetters[key]
      setter(value)
    })
  }, [defaultTrackAvailabilityFields, fieldSetters])

  return { set, reset }
}
