import { useCallback, useContext, useEffect, useState } from 'react'

import {
  HarmonyPlainButton,
  HarmonyPlainButtonType,
  IconPause,
  IconPlay
} from '@audius/stems'
import { useField } from 'formik'

import { CollectionTrackForUpload } from '../types'
import { UploadPreviewContext } from '../utils/uploadPreviewContext'

const messages = {
  overrideLabel: 'Override details for this track',
  preview: 'Preview',
  delete: 'Delete'
}

type PreviewButtonProps = {
  index: number
  className?: string
}

export const PreviewButton = (props: PreviewButtonProps) => {
  const { index, className } = props
  const { playingPreviewIndex, togglePreview } =
    useContext(UploadPreviewContext)
  const [{ value: track }] = useField<CollectionTrackForUpload>(
    `tracks.${index}`
  )
  const isPreviewPlaying = playingPreviewIndex === index

  const [canPlayPreview, setCanPlayPreview] = useState(false)

  const canPlay = useCallback(() => {
    setCanPlayPreview(true)
  }, [setCanPlayPreview])

  useEffect(() => {
    // 2 or more signifies playable
    // https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/readyState
    if (track.preview.readyState >= 2) {
      canPlay()
    } else {
      track.preview.addEventListener('canplay', canPlay)
      return () => {
        track.preview.removeEventListener('canplay', canPlay)
      }
    }
  }, [track.preview, canPlay])

  return canPlayPreview ? (
    <HarmonyPlainButton
      className={className}
      variant={HarmonyPlainButtonType.SUBDUED}
      type='button'
      text={messages.preview}
      iconLeft={isPreviewPlaying ? IconPause : IconPlay}
      onClick={() => {
        togglePreview(track.preview, index)
      }}
    />
  ) : null
}
