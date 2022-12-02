import { useCallback, useContext, useRef, useState } from 'react'

import EventEmitter from 'events'
import path from 'path'

import type { Color, Nullable, ShareModalContent } from '@audius/common'
import { encodeHashId, ErrorLevel, uuid } from '@audius/common'
import {
  activateKeepAwake,
  deactivateKeepAwake
} from '@sayem314/react-native-keep-awake'
import type { FFmpegSession } from 'ffmpeg-kit-react-native'
import { FFmpegKit, ReturnCode } from 'ffmpeg-kit-react-native'
import Config from 'react-native-config'
import RNFS from 'react-native-fs'
import Share from 'react-native-share'
import type ViewShot from 'react-native-view-shot'

import { apiClient } from 'app/services/audius-api-client'
import { getDominantColors } from 'app/services/threads/getDominantColors'
import { convertRGBToHex } from 'app/utils/convertRGBtoHex'
import { reportToSentry } from 'app/utils/reportToSentry'

import { useTrackImage } from '../image/TrackImage'
import { ToastContext } from '../toast/ToastContext'

import { messages } from './messages'

const DEFAULT_DOMINANT_COLORS = ['000000', '434343']
const stickerLoadedEventEmitter = new EventEmitter()
const STICKER_LOADED_EVENT = 'loaded' as const

export const useShareToStory = ({
  content,
  viewShotRef
}: {
  content: Nullable<ShareModalContent>
  viewShotRef: React.RefObject<ViewShot>
}) => {
  const { toast } = useContext(ToastContext)

  const [shouldRenderShareToStorySticker, setShouldRenderShareToStorySticker] =
    useState(false)

  const { source: trackImageSource } = useTrackImage(
    content?.type === 'track' ? content.track : null
  )
  const isStickerImageLoadedRef = useRef(false)
  const handleShareToStoryStickerLoad = () => {
    isStickerImageLoadedRef.current = true
    stickerLoadedEventEmitter.emit(STICKER_LOADED_EVENT)
  }
  const trackImageUri = trackImageSource[2]?.uri
  const captureStickerImage = useCallback(async () => {
    if (!isStickerImageLoadedRef.current) {
      // Wait for the sticker component and image inside it to load. If this hasn't happened in 5 seconds, assume that it failed.
      await Promise.race([
        new Promise((resolve) =>
          stickerLoadedEventEmitter.once(STICKER_LOADED_EVENT, resolve)
        ),
        new Promise((resolve) => {
          setTimeout(resolve, 5000)
        })
      ])

      if (!isStickerImageLoadedRef.current) {
        // Loading the sticker failed; return undefined
        throw new Error('The sticker component did not load successfully.')
      }
    }

    let res: string | undefined
    if (viewShotRef && viewShotRef.current && viewShotRef.current.capture) {
      res = await viewShotRef.current.capture()
    }
    return res
  }, [viewShotRef])
  const reportAndToastError = useCallback(
    (error: Error, name?: string) => {
      reportToSentry({
        level: ErrorLevel.Error,
        error,
        name
      })
      toast({ content: messages.shareToStoryError, type: 'error' })
      deactivateKeepAwake()
    },
    [toast]
  )
  const handleShareToInstagramStory = useCallback(async () => {
    if (content?.type === 'track') {
      activateKeepAwake()
      if (!shouldRenderShareToStorySticker) {
        setShouldRenderShareToStorySticker(true)
      }
      const encodedTrackId = encodeHashId(content.track.track_id)
      const streamMp3Url = apiClient.makeUrl(`/tracks/${encodedTrackId}/stream`)
      const storyVideoPath = path.join(
        RNFS.TemporaryDirectoryPath,
        `storyVideo-${uuid()}.mp4`
      )
      const audioStartOffsetConfig =
        content.track.duration && content.track.duration >= 20 ? '-ss 10 ' : ''

      let stickerUri: string | undefined // Have to capture the sticker image first because it doesn't work if you get the dominant colors first (mysterious).

      try {
        stickerUri = await captureStickerImage()
      } catch (e) {
        reportAndToastError(
          e,
          'Share to IG Story error - generate sticker step'
        )
        return
      }
      if (!stickerUri) {
        reportAndToastError(
          new Error('Sticker screenshot unsuccessful'),
          'Share to IG Story error - generate sticker step (sticker undefined)'
        )
        return
      }
      let dominantColorsResult: Color[]
      let dominantColorHex1: string
      let dominantColorHex2: string
      if (trackImageUri) {
        try {
          dominantColorsResult = await getDominantColors(trackImageUri)
        } catch (e) {
          reportAndToastError(
            e,
            'Share to IG Story error - calculate dominant colors step'
          )
          return
        }
        dominantColorHex1 = Array.isArray(dominantColorsResult)
          ? convertRGBToHex(dominantColorsResult[0])
          : DEFAULT_DOMINANT_COLORS[0]

        dominantColorHex2 = Array.isArray(dominantColorsResult)
          ? convertRGBToHex(dominantColorsResult[1])
          : DEFAULT_DOMINANT_COLORS[1]
      } else {
        ;[dominantColorHex1, dominantColorHex2] = DEFAULT_DOMINANT_COLORS
      }
      let session: FFmpegSession
      try {
        ;[session] = await Promise.all([
          FFmpegKit.execute(
            `${audioStartOffsetConfig}-i ${streamMp3Url} -filter_complex "gradients=s=1080x1920:c0=${dominantColorHex1}:c1=${dominantColorHex2}:x0=540:y0=0:x1=540:y1=1920:duration=10:speed=0.018:rate=60[bg];[0:a]aformat=channel_layouts=mono,showwaves=mode=cline:n=1:s=1080x200:scale=cbrt:colors=#ffffff[fg];[bg][fg]overlay=format=auto:x=0:y=H-h-100" -pix_fmt yuv420p -vb 50M -t 10 ${storyVideoPath}`
          )
        ])
      } catch (e) {
        reportAndToastError(e, 'Share to IG Story error')
        return
      }

      const returnCode = await session.getReturnCode()

      if (!ReturnCode.isSuccess(returnCode)) {
        const output = await session.getOutput()
        reportAndToastError(
          new Error(output),
          'Share to IG Story error - generate video background step'
        )
        return
      }
      const shareOptions = {
        backgroundVideo: storyVideoPath,
        stickerImage: stickerUri,
        attributionURL: Config.AUDIUS_URL,
        social: Share.Social.INSTAGRAM_STORIES,
        appId: Config.INSTAGRAM_APP_ID
      }
      try {
        await Share.shareSingle(shareOptions)
        deactivateKeepAwake()
      } catch (error) {
        reportAndToastError(error, 'Share to IG Story error - share to IG step')
      }
    }
  }, [
    trackImageUri,
    content,
    captureStickerImage,
    shouldRenderShareToStorySticker,
    reportAndToastError
  ])

  return {
    handleShareToStoryStickerLoad,
    handleShareToInstagramStory,
    shouldRenderShareToStorySticker
  }
}
