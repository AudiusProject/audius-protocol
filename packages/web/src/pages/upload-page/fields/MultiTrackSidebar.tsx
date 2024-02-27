import { MouseEvent, useCallback, useContext } from 'react'

import { imageBlank as placeholderArt } from '@audius/common/assets'
import { Button, IconTrash, IconError, IconCloudUpload } from '@audius/harmony'
import cn from 'classnames'
import { useField, useFormikContext } from 'formik'
import { isEmpty } from 'lodash'

import { Icon } from 'components/Icon'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import layoutStyles from 'components/layout/layout.module.css'
import { Text } from 'components/typography'

import { UploadFormScrollContext } from '../UploadPage'
import { useIndexedField } from '../hooks'
import { SingleTrackEditValues, TrackEditFormValues } from '../types'
import { UploadPreviewContext } from '../utils/uploadPreviewContext'

import styles from './MultiTrackSidebar.module.css'

const messages = {
  title: 'UPLOADED TRACKS',
  complete: 'Complete Upload',
  fixErrors: 'Fix errors to complete your upload.',
  titleRequired: 'Track name required'
}

export const MultiTrackSidebar = () => {
  const scrollToTop = useContext(UploadFormScrollContext)
  const { errors, submitCount } = useFormikContext<TrackEditFormValues>()
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
            <Button
              onClick={scrollToTop}
              variant='primary'
              iconRight={IconCloudUpload}
              type='submit'
              fullWidth
            >
              {messages.complete}
            </Button>
          </div>
          {!isEmpty(errors) && submitCount > 0 ? (
            <div className={cn(layoutStyles.row, layoutStyles.gap1)}>
              <Icon
                className={styles.iconError}
                icon={IconError}
                size='xSmall'
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
  const scrollToTop = useContext(UploadFormScrollContext)
  const { values, setValues, errors, submitCount } =
    useFormikContext<TrackEditFormValues>()
  const { playingPreviewIndex, stopPreview } = useContext(UploadPreviewContext)
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

  const handleClickTrack = useCallback(
    (index: number) => {
      setIndex(index)
      scrollToTop()
    },
    [scrollToTop, setIndex]
  )

  const handleRemoveTrack = useCallback(
    (e: MouseEvent<HTMLDivElement>, index: number) => {
      if (index === playingPreviewIndex) stopPreview()

      e.stopPropagation()
      const newTrackMetadatas = [...values.trackMetadatas]
      const newTracks = [...values.tracks]
      newTrackMetadatas.splice(index, 1)
      newTracks.splice(index, 1)
      const newIndex =
        selectedIndex === index ? Math.max(index - 1, 0) : selectedIndex
      setValues({
        ...values,
        tracks: newTracks,
        trackMetadatas: newTrackMetadatas,
        trackMetadatasIndex: newIndex
      })
      scrollToTop()
    },
    [
      playingPreviewIndex,
      scrollToTop,
      selectedIndex,
      setValues,
      stopPreview,
      values
    ]
  )

  const isTitleMissing = isEmpty(title)
  const hasError = !isEmpty(errors.trackMetadatas?.[index]) && submitCount > 0

  return (
    <div className={styles.trackRoot} onClick={() => handleClickTrack(index)}>
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
            <div
              className={styles.iconRemove}
              onClick={(e) => handleRemoveTrack(e, index)}
            >
              <IconTrash color='default' />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
