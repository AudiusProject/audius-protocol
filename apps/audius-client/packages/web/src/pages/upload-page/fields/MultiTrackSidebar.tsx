import { useCallback } from 'react'

import { imageBlank as placeholderArt } from '@audius/common'
import {
  HarmonyButton,
  HarmonyButtonType,
  IconError,
  IconUpload
} from '@audius/stems'
import cn from 'classnames'
import { useField, useFormikContext } from 'formik'
import { isEmpty } from 'lodash'

import { ReactComponent as IconTrash } from 'assets/img/iconTrash.svg'
import { Icon } from 'components/Icon'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import layoutStyles from 'components/layout/layout.module.css'
import { Text } from 'components/typography'

import { useIndexedField } from '../hooks'
import { SingleTrackEditValues, TrackEditFormValues } from '../types'

import styles from './MultiTrackSidebar.module.css'

const messages = {
  title: 'UPLOADED TRACKS',
  complete: 'Complete Upload',
  fixErrors: 'Fix errors to complete your upload.',
  titleRequired: 'Track name required'
}

export const MultiTrackSidebar = () => {
  const { errors } = useFormikContext<TrackEditFormValues>()
  return (
    <div className={styles.root}>
      <div className={cn(layoutStyles.col)}>
        <div className={styles.title}>
          <Text variant='label' size='small'>
            {messages.title}
          </Text>
        </div>
        <div className={cn(styles.body, layoutStyles.col, layoutStyles.gap2)}>
          <TrackNavigator />
          <div className={styles.completeButton}>
            <HarmonyButton
              text={messages.complete}
              variant={HarmonyButtonType.PRIMARY}
              iconRight={IconUpload}
              fullWidth
            />
          </div>
          {!isEmpty(errors) ? (
            <div className={cn(layoutStyles.row, layoutStyles.gap1)}>
              <Icon
                className={styles.iconError}
                icon={IconError}
                size='xSmall'
                fill='accentRed'
              />
              <Text size='xSmall' color='accentRed'>
                {messages.fixErrors}
              </Text>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

const TrackNavigator = () => {
  const [{ value: tracks }] =
    useField<TrackEditFormValues['trackMetadatas']>('trackMetadatas')
  return (
    <div className={cn(styles.tracks, layoutStyles.col)}>
      {tracks.map((track, i) => (
        <TrackRow key={i} index={i} />
      ))}
    </div>
  )
}

type TrackRowProps = {
  index: number
}

const TrackRow = (props: TrackRowProps) => {
  const { index } = props
  const { values, setValues, errors } = useFormikContext<TrackEditFormValues>()
  const [{ value: title }] = useIndexedField<SingleTrackEditValues['title']>(
    'trackMetadatas',
    index,
    'title'
  )
  const [{ value: artworkUrl }] = useIndexedField<string>(
    `trackMetadatas`,
    index,
    'artwork.url'
  )
  const [{ value: selectedIndex }, , { setValue: setIndex }] = useField(
    'trackMetadatasIndex'
  )
  const isSelected = index === selectedIndex

  const handleRemoveTrack = useCallback(
    (index: number) => {
      const newTrackMetadatas = [...values.trackMetadatas]
      newTrackMetadatas.splice(index, 1)
      const newIndex = selectedIndex === index ? Math.max(index - 1, 0) : index
      setValues({
        ...values,
        trackMetadatas: newTrackMetadatas,
        trackMetadatasIndex: newIndex
      })
    },
    [selectedIndex, setValues, values]
  )

  const isTitleMissing = isEmpty(title)
  const hasError = !isEmpty(errors.trackMetadatas?.[index])

  return (
    <div className={styles.trackRoot} onClick={() => setIndex(index)}>
      {isSelected ? <div className={styles.selectedIndicator} /> : null}
      <div className={cn(styles.track, layoutStyles.row)}>
        <div
          className={cn(styles.trackInfo, layoutStyles.row, layoutStyles.gap3, {
            [styles.selected]: isSelected,
            [styles.error]: hasError
          })}
        >
          <div className={layoutStyles.row}>
            {hasError ? (
              <Icon
                className={styles.iconError}
                icon={IconError}
                size='xSmall'
                color='accentRed'
              />
            ) : (
              <Text
                className={styles.trackIndex}
                color={isSelected ? 'secondary' : 'neutral'}
              >
                {index + 1}
              </Text>
            )}
            <DynamicImage
              wrapperClassName={styles.artwork}
              image={artworkUrl || placeholderArt}
              isUrl
            />
          </div>
          <div className={styles.trackTitleContainer}>
            <Text
              size='small'
              // @ts-ignore TODO: support for accent-red in other themes
              color={
                hasError
                  ? '--accent-red'
                  : isSelected
                  ? '--secondary'
                  : '--neutral'
              }
            >
              {isTitleMissing ? messages.titleRequired : title}
            </Text>
          </div>
          {values.trackMetadatas.length > 1 ? (
            <div className={styles.iconRemove}>
              <IconTrash
                fill='--default'
                onClick={() => handleRemoveTrack(index)}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
