import { useCallback, useContext, useMemo, useRef, useState } from 'react'

import EventEmitter from 'events'
import path from 'path'

import type { Color, Nullable, ShareModalContent } from '@audius/common'
import { encodeHashId, ErrorLevel, modalsActions, uuid } from '@audius/common'
import {
  activateKeepAwake,
  deactivateKeepAwake
} from '@sayem314/react-native-keep-awake'
import type { FFmpegSession } from 'ffmpeg-kit-react-native'
import { FFmpegKit, FFmpegKitConfig, ReturnCode } from 'ffmpeg-kit-react-native'
import { View } from 'react-native'
import Config from 'react-native-config'
import RNFS from 'react-native-fs'
import Share from 'react-native-share'
import type ViewShot from 'react-native-view-shot'
import { useDispatch, useSelector } from 'react-redux'

import IconWavform from 'app/assets/images/iconWavform.svg'
import { Button, LinearProgress, Text } from 'app/components/core'
import { make, track } from 'app/services/analytics'
import { apiClient } from 'app/services/audius-api-client'
import { setVisibility } from 'app/store/drawers/slice'
import {
  getCancel,
  getProgressPercentage
} from 'app/store/share-to-story-progress/selectors'
import {
  reset,
  setCancel,
  setProgress
} from 'app/store/share-to-story-progress/slice'
import { makeStyles } from 'app/styles'
import { EventNames } from 'app/types/analytics'
import { convertRGBToHex } from 'app/utils/convertRGBtoHex'
import { reportToSentry } from 'app/utils/reportToSentry'
import { useThemeColors } from 'app/utils/theme'

import { getDominantRgb } from '../../../threads/dominantColors.thread'
import { NativeDrawer } from '../drawer'
import { DEFAULT_IMAGE_URL, useTrackImage } from '../image/TrackImage'
import { ToastContext } from '../toast/ToastContext'

import { messages } from './messages'

const DEFAULT_DOMINANT_COLORS = ['000000', '434343']
const stickerLoadedEventEmitter = new EventEmitter()
const cancelRequestedEventEmitter = new EventEmitter()
const CANCEL_REQUESTED_EVENT = 'cancel' as const
const STICKER_LOADED_EVENT = 'loaded' as const

export const useShareToStory = ({
  content,
  viewShotRef
}: {
  content: Nullable<ShareModalContent>
  viewShotRef: React.RefObject<ViewShot>
}) => {
  const { toast } = useContext(ToastContext)
  const dispatch = useDispatch()
  const cancelRef = useRef(false)
  const [shouldRenderShareToStorySticker, setShouldRenderShareToStorySticker] =
    useState(false)
  const trackTitle =
    content?.type === 'track' ? content?.track.title : undefined
  const artistHandle =
    content?.type === 'track' ? content?.artist.handle : undefined

  const trackImage = useTrackImage(
    content?.type === 'track' ? content.track : null
  )
  const isStickerImageLoadedRef = useRef(false)
  const handleShareToStoryStickerLoad = () => {
    isStickerImageLoadedRef.current = true
    stickerLoadedEventEmitter.emit(STICKER_LOADED_EVENT)
  }
  const trackImageUri =
    (trackImage && trackImage?.source[2].uri) ?? DEFAULT_IMAGE_URL
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

  const toggleProgressDrawer = useCallback(
    (open: boolean) => {
      dispatch(setVisibility({ drawer: 'ShareToStoryProgress', visible: open }))
      if (!open) {
        dispatch(modalsActions.setVisibility({ modal: 'Share', visible: true }))
      }
    },
    [dispatch]
  )

  // Actions that should always be taken once the story generation is finished (cancelled, errored, or successful):
  const cleanup = useCallback(() => {
    deactivateKeepAwake()
    dispatch(reset())
    toggleProgressDrawer(false)
  }, [dispatch, toggleProgressDrawer])

  const handleError = useCallback(
    (error: Error, name?: string) => {
      reportToSentry({
        level: ErrorLevel.Error,
        error,
        name
      })
      toast({ content: messages.shareToStoryError, type: 'error' })
      track(
        make({
          eventName: EventNames.SHARE_TO_IG_STORY_ERROR,
          title: trackTitle,
          artist: artistHandle,
          error: `${name ? `${name} - ` : ''}${error.message}`
        })
      )
      cleanup()
    },
    [artistHandle, cleanup, toast, trackTitle]
  )

  const cancelStory = useCallback(async () => {
    cancelRef.current = true
    cancelRequestedEventEmitter.emit(CANCEL_REQUESTED_EVENT)
    await FFmpegKit.cancel()
    track(
      make({
        eventName: EventNames.SHARE_TO_IG_STORY_CANCELLED,
        title: trackTitle,
        artist: artistHandle
      })
    )
    cleanup()
  }, [artistHandle, cleanup, trackTitle])

  const generateStory = useCallback(async () => {
    if (content?.type === 'track') {
      track(
        make({
          eventName: EventNames.SHARE_TO_IG_STORY,
          title: content.track.title,
          artist: content.artist.handle
        })
      )

      // Reset any stale values:
      dispatch(reset())
      cancelRef.current = false

      activateKeepAwake()
      dispatch(setCancel(cancelStory))
      toggleProgressDrawer(true)

      // Step 1: Render and take a screenshot of the sticker:
      // Note: We have to capture the sticker image first because it doesn't work if you get the dominant colors first (mysterious).
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

      let stickerUri: string | undefined

      try {
        stickerUri = await captureStickerImage()
      } catch (e) {
        handleError(e, 'Share to IG Story error - generate sticker step')
        return
      }
      if (!stickerUri) {
        handleError(
          new Error('Sticker screenshot unsuccessful'),
          'Share to IG Story error - generate sticker step (sticker undefined)'
        )
        return
      }
      dispatch(setProgress(10))
      // Step 2: Calculate the dominant colors of the cover art
      let dominantColorsResult: Color[]
      let dominantColorHex1: string
      let dominantColorHex2: string
      if (trackImageUri) {
        try {
          dominantColorsResult = await getDominantRgb(trackImageUri)
        } catch (e) {
          handleError(
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
      if (cancelRef.current) {
        cleanup()
        return
      }
      // For simplicity, assume that calculating dominant colors and generating the sticker takes 20% of the total loading time:
      dispatch(setProgress(20))

      // Step 3: Generate the background video using FFmpeg
      FFmpegKitConfig.enableStatisticsCallback((statistics) => {
        if (statistics.getTime() < 0) {
          return
        }
        const totalVideoDuration = 10000
        const loadedSoFar = statistics.getTime()
        const percentageLoaded = (loadedSoFar * 80) / totalVideoDuration
        // Pad the result by 10% so the progress bar gets full before we get to IG
        dispatch(setProgress(Math.min(20 + percentageLoaded + 10, 100)))
      })
      let session: FFmpegSession

      try {
        session = await FFmpegKit.execute(
          `${audioStartOffsetConfig}-i ${streamMp3Url} -filter_complex "gradients=s=540x960:x0=270:y0=2:x1=270:y1=958:c0=${dominantColorHex1}:c1=${dominantColorHex2}:duration=10:speed=0.042:rate=30[bg];[0:a]aformat=channel_layouts=mono,showfreqs=s=540x80:fscale=log:colors=#ffffff[fg];[bg][fg]overlay=format=auto:x=0:y=H-h-80" -pix_fmt yuv420p -c:v libx264 -preset ultrafast -c:a aac -t 10 ${storyVideoPath}`
        )
      } catch (e) {
        handleError(e, 'Share to IG Story error')
        return
      }
      if (cancelRef.current) {
        // The job was cancelled.
        cleanup()
        return
      }

      const returnCode = await session.getReturnCode()

      if (!ReturnCode.isSuccess(returnCode)) {
        const output = await session.getOutput()
        handleError(
          new Error(output),
          'Share to IG Story error - generate video background step'
        )
        return
      }

      // Step 4: Put everything together and push to IG
      const shareOptions = {
        backgroundVideo: `file://${storyVideoPath}`,
        stickerImage: stickerUri,
        attributionURL: Config.AUDIUS_URL,
        social: Share.Social.INSTAGRAM_STORIES,
        appId: Config.INSTAGRAM_APP_ID
      }

      if (cancelRef.current) {
        cleanup()
        return
      }
      try {
        await Share.shareSingle(shareOptions)
      } catch (error) {
        handleError(error, 'Share to IG Story error - share to IG step')
      } finally {
        cleanup()
      }

      track(
        make({
          eventName: EventNames.SHARE_TO_IG_STORY_SUCCESS,
          title: content.track.title,
          artist: content.artist.handle
        })
      )
    }
  }, [
    trackImageUri,
    content,
    toggleProgressDrawer,
    captureStickerImage,
    shouldRenderShareToStorySticker,
    handleError,
    cleanup,
    dispatch,
    cancelStory
  ])

  const handleShareToInstagramStory = useCallback(async () => {
    await Promise.race([
      generateStory(),
      new Promise<false>((resolve) =>
        cancelRequestedEventEmitter.once(CANCEL_REQUESTED_EVENT, () =>
          resolve(false)
        )
      )
    ])
  }, [generateStory])

  return {
    handleShareToStoryStickerLoad,
    handleShareToInstagramStory,
    shouldRenderShareToStorySticker,
    cancelStory
  }
}

const useStyles = makeStyles(({ spacing, palette }) => ({
  container: {
    paddingTop: spacing(4),
    paddingBottom: spacing(10),
    flexDirection: 'column',
    paddingHorizontal: spacing(4),
    alignItems: 'center'
  },
  title: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing(2),
    paddingBottom: spacing(4)
  },
  titleText: {
    textTransform: 'uppercase',
    marginTop: spacing(4)
  },
  subtitleText: {
    marginTop: spacing(4)
  },
  titleIcon: {
    alignSelf: 'flex-end',
    color: palette.neutral,
    marginRight: spacing(3)
  },
  button: {
    marginTop: spacing(4)
  },
  progress: {
    width: '100%',
    height: 24
  },
  progressBar: {
    height: 24
  },
  progressBarContainer: {
    borderRadius: 99
  }
}))

export const ShareToStoryProgressDrawer = () => {
  const styles = useStyles()
  const progressBarStyles = useMemo(
    () => ({
      root: styles.progressBarContainer,
      progress: styles.progressBar
    }),
    [styles.progressBar, styles.progressBarContainer]
  )
  const { neutralLight2 } = useThemeColors()
  const progress = useSelector(getProgressPercentage)
  const cancel = useSelector(getCancel)
  const handleCancel = useCallback(() => {
    cancel?.()
  }, [cancel])
  return (
    <NativeDrawer drawerName='ShareToStoryProgress' onClose={handleCancel}>
      <View style={styles.container}>
        <View style={styles.title}>
          <IconWavform
            style={styles.titleIcon}
            fill={neutralLight2}
            height={20}
            width={24}
          />
          <View>
            <Text
              weight='heavy'
              color='neutralLight2'
              fontSize={'xl'}
              style={styles.titleText}
            >
              {messages.loadingStoryModalTitle}
            </Text>
          </View>
        </View>
        <View style={styles.progress}>
          <LinearProgress value={progress} styles={progressBarStyles} />
        </View>
        <Text weight='medium' fontSize={'large'} style={styles.subtitleText}>
          {messages.loadingInstagramStorySubtitle}
        </Text>
        <Button
          title={messages.cancel}
          fullWidth
          variant='common'
          onPress={handleCancel}
          style={styles.button}
        />
      </View>
    </NativeDrawer>
  )
}
