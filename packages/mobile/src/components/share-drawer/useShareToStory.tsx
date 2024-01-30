import { useCallback, useMemo, useRef, useState } from 'react'

import EventEmitter from 'events'
import path from 'path'

import type { Color, Nullable, ShareContent } from '@audius/common'
import {
  encodeHashId,
  ErrorLevel,
  modalsActions,
  SquareSizes,
  uuid
} from '@audius/common'
import {
  activateKeepAwake,
  deactivateKeepAwake
} from '@sayem314/react-native-keep-awake'
import { CreativeKit } from '@snapchat/snap-kit-react-native'
import type { FFmpegSession } from 'ffmpeg-kit-react-native'
import { FFmpegKit, FFmpegKitConfig, ReturnCode } from 'ffmpeg-kit-react-native'
import { Platform, View } from 'react-native'
import RNFS from 'react-native-fs'
import { check, PERMISSIONS, request, RESULTS } from 'react-native-permissions'
import type { ShareSingleOptions } from 'react-native-share'
import Share, { Social } from 'react-native-share'
import {
  init as initTikTokShare,
  share as shareToTikTok
} from 'react-native-tiktok'
import type ViewShot from 'react-native-view-shot'
import { useDispatch, useSelector } from 'react-redux'

import IconWavform from 'app/assets/images/iconWavform.svg'
import { Button, LinearProgress, Text } from 'app/components/core'
import { env } from 'app/env'
import { isImageUriSource } from 'app/hooks/useContentNodeImage'
import { useToast } from 'app/hooks/useToast'
import { make, track } from 'app/services/analytics'
import { apiClient } from 'app/services/audius-api-client'
import { setVisibility } from 'app/store/drawers/slice'
import {
  getCancel,
  getPlatform,
  getProgressPercentage
} from 'app/store/share-to-story-progress/selectors'
import type { ShareToStoryPlatform } from 'app/store/share-to-story-progress/slice'
import {
  reset,
  setCancel,
  setPlatform,
  setProgress
} from 'app/store/share-to-story-progress/slice'
import { makeStyles } from 'app/styles'
import { EventNames } from 'app/types/analytics'
import { convertRGBToHex } from 'app/utils/convertRGBtoHex'
import {
  getDominantRgb,
  pickTwoMostDominantAndVibrant
} from 'app/utils/dominantColors'
import { reportToSentry } from 'app/utils/reportToSentry'
import { getTrackRoute } from 'app/utils/routes'

import { HarmonyModalHeader } from '../core/HarmonyModalHeader'
import { NativeDrawer } from '../drawer'
import { DEFAULT_IMAGE_URL, useTrackImage } from '../image/TrackImage'

import { messages } from './messages'

const DEFAULT_DOMINANT_COLORS = ['000000', '434343']
const stickerLoadedEventEmitter = new EventEmitter()
const cancelRequestedEventEmitter = new EventEmitter()
const CANCEL_REQUESTED_EVENT = 'cancel' as const
const STICKER_LOADED_EVENT = 'loaded' as const

const START_EVENT_NAMES_MAP = {
  instagram: EventNames.SHARE_TO_IG_STORY,
  tiktok: EventNames.SHARE_TO_TIKTOK_VIDEO,
  snapchat: EventNames.SHARE_TO_SNAPCHAT
} as Record<
  ShareToStoryPlatform,
  | typeof EventNames.SHARE_TO_IG_STORY
  | typeof EventNames.SHARE_TO_TIKTOK_VIDEO
  | typeof EventNames.SHARE_TO_SNAPCHAT
>

const CANCELLED_EVENT_NAMES_MAP = {
  instagram: EventNames.SHARE_TO_IG_STORY_CANCELLED,
  tiktok: EventNames.SHARE_TO_TIKTOK_VIDEO_CANCELLED,
  snapchat: EventNames.SHARE_TO_SNAPCHAT_CANCELLED
} as Record<
  ShareToStoryPlatform,
  | typeof EventNames.SHARE_TO_IG_STORY_CANCELLED
  | typeof EventNames.SHARE_TO_TIKTOK_VIDEO_CANCELLED
  | typeof EventNames.SHARE_TO_SNAPCHAT_CANCELLED
>

const SUCCESS_EVENT_NAMES_MAP = {
  instagram: EventNames.SHARE_TO_IG_STORY_SUCCESS,
  tiktok: EventNames.SHARE_TO_TIKTOK_VIDEO_SUCCESS,
  snapchat: EventNames.SHARE_TO_SNAPCHAT_STORY_SUCCESS
} as Record<
  ShareToStoryPlatform,
  | typeof EventNames.SHARE_TO_IG_STORY_SUCCESS
  | typeof EventNames.SHARE_TO_TIKTOK_VIDEO_SUCCESS
  | typeof EventNames.SHARE_TO_SNAPCHAT_STORY_SUCCESS
>

const ERROR_EVENT_NAMES_MAP = {
  instagram: EventNames.SHARE_TO_IG_STORY_ERROR,
  tiktok: EventNames.SHARE_TO_TIKTOK_VIDEO_ERROR,
  snapchat: EventNames.SHARE_TO_SNAPCHAT_ERROR
} as Record<
  ShareToStoryPlatform,
  | typeof EventNames.SHARE_TO_IG_STORY_ERROR
  | typeof EventNames.SHARE_TO_TIKTOK_VIDEO_ERROR
  | typeof EventNames.SHARE_TO_SNAPCHAT_ERROR
>

export const useShareToStory = ({
  content,
  viewShotRef
}: {
  content: Nullable<ShareContent>
  viewShotRef: React.RefObject<ViewShot>
}) => {
  const { toast } = useToast()
  const dispatch = useDispatch()
  const cancelRef = useRef(false)
  const [selectedPlatform, setSelectedPlatform] =
    useState<ShareToStoryPlatform | null>(null)
  const trackTitle =
    content?.type === 'track' ? content?.track.title : undefined
  const artistHandle =
    content?.type === 'track' ? content?.artist.handle : undefined

  const trackImage = useTrackImage({
    track: content?.type === 'track' ? content.track : null,
    size: SquareSizes.SIZE_480_BY_480
  })
  const isStickerImageLoadedRef = useRef(false)
  const handleShareToStoryStickerLoad = () => {
    isStickerImageLoadedRef.current = true
    stickerLoadedEventEmitter.emit(STICKER_LOADED_EVENT)
  }
  const trackImageUri =
    content?.type === 'track' && isImageUriSource(trackImage?.source)
      ? trackImage?.source?.uri
      : DEFAULT_IMAGE_URL

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
    (open: boolean, platform?: ShareToStoryPlatform) => {
      if (open && platform) {
        dispatch(setPlatform(platform))
      }
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
    setSelectedPlatform(null)
  }, [dispatch, toggleProgressDrawer])

  const handleError = useCallback(
    (platform: ShareToStoryPlatform, error: Error, name?: string) => {
      reportToSentry({
        level: ErrorLevel.Error,
        error,
        name
      })
      toast({ content: messages.shareToStoryError, type: 'error' })
      track(
        make({
          eventName: ERROR_EVENT_NAMES_MAP[platform],
          title: trackTitle,
          artist: artistHandle,
          error: `${name ? `${name} - ` : ''}${error.message}`
        })
      )
      cleanup()
    },
    [artistHandle, cleanup, toast, trackTitle]
  )

  const cancelStory = useCallback(
    async (platform: ShareToStoryPlatform) => {
      cancelRef.current = true
      cancelRequestedEventEmitter.emit(CANCEL_REQUESTED_EVENT)
      await FFmpegKit.cancel()
      track(
        make({
          eventName: CANCELLED_EVENT_NAMES_MAP[platform],
          title: trackTitle,
          artist: artistHandle
        })
      )
      cleanup()
    },
    [artistHandle, cleanup, trackTitle]
  )

  const pasteToInstagramApp = useCallback(
    async (videoUri: string, stickerUri: string) => {
      const shareOptions: ShareSingleOptions = {
        backgroundVideo: videoUri,
        stickerImage: stickerUri,
        attributionURL: env.AUDIUS_URL,
        social: Social.InstagramStories,
        appId: env.INSTAGRAM_APP_ID
      }
      await Share.shareSingle(shareOptions)
    },
    []
  )

  const pasteToSnapchatApp = useCallback(
    async (videoUri: string, stickerUri: string, trackPermalink: string) => {
      const videoContent = {
        content: {
          uri: videoUri
        },
        sticker: {
          uri: stickerUri,
          width: 264,
          height: 365,
          posX: 0.5,
          posY: 0.5,
          rotationDegreesInClockwise: 0,
          isAnimated: false
        },
        attachmentUrl: trackPermalink
      }
      await CreativeKit.shareVideo(videoContent)
    },
    []
  )

  const pasteToTikTokApp = useCallback((videoUri: string) => {
    initTikTokShare(env.TIKTOK_APP_ID as string)
    shareToTikTok(videoUri, (_code) => {
      // TODO: Handle errors handed back from TikTok
    })
  }, [])

  const generateStory = useCallback(
    async (platform: ShareToStoryPlatform) => {
      if (content?.type === 'track') {
        track(
          make({
            eventName: START_EVENT_NAMES_MAP[platform],
            title: content.track.title,
            artist: content.artist.handle
          })
        )

        // Reset any stale values:
        dispatch(reset())
        cancelRef.current = false

        activateKeepAwake()
        dispatch(setCancel(() => cancelStory(platform)))
        toggleProgressDrawer(true, platform)
        dispatch(setProgress(10))

        // Step 1: Render and take a screenshot of the sticker
        let stickerUri: string | undefined

        // Step 2: Calculate the dominant colors of the cover art:
        let rawDominantColorsResult: Color[] | string | undefined // `getDominantRgb` returns a string containing a single default color if it couldn't find dominant colors

        try {
          // Execute Steps 1 and 2 concurrently:
          ;[rawDominantColorsResult, stickerUri] = await Promise.all([
            trackImageUri
              ? getDominantRgb(trackImageUri)
              : Promise.resolve(undefined),
            captureStickerImage()
          ])
        } catch (e) {
          handleError(
            platform,
            e,
            'Error at generate sticker + dominant colors step'
          )
          return
        }

        if (!stickerUri) {
          handleError(
            platform,
            new Error('Sticker screenshot unsuccessful'),
            'Error at generate sticker step (sticker undefined)'
          )
          return
        }

        const finalDominantColorsResult =
          rawDominantColorsResult &&
          Array.isArray(rawDominantColorsResult) &&
          rawDominantColorsResult.length > 0
            ? pickTwoMostDominantAndVibrant(rawDominantColorsResult).map(
                (c: Color) => convertRGBToHex(c)
              )
            : DEFAULT_DOMINANT_COLORS
        const dominantColorHex1 = finalDominantColorsResult[0]
        const dominantColorHex2 = finalDominantColorsResult[1]

        if (cancelRef.current) {
          cleanup()
          return
        }

        let backgroundSegment: string
        if (dominantColorHex2) {
          backgroundSegment = `gradients=s=540x960:x0=270:y0=2:x1=270:y1=958:c0=${dominantColorHex1}:c1=${dominantColorHex2}:duration=10:speed=0.042:rate=30`
        } else {
          // Sometimes there is only one dominant color (if the cover art is literally just a solid color). In that case, just use that one color as the background.
          backgroundSegment = `color=c=${dominantColorHex1}:s=540x960`
        }
        // For simplicity, assume that calculating dominant colors and generating the sticker takes 20% of the total loading time:
        dispatch(setProgress(20))

        const encodedTrackId = encodeHashId(content.track.track_id)
        const streamMp3Url = apiClient.makeUrl(
          `/tracks/${encodedTrackId}/stream`
        )
        const storyVideoPath = path.join(
          RNFS.TemporaryDirectoryPath,
          `storyVideo-${uuid()}.mp4`
        )
        const audioStartOffsetConfig =
          content.track.duration && content.track.duration >= 20
            ? '-ss 10 '
            : ''

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
        const SHOWFREQS_SEGMENT =
          'aformat=channel_layouts=mono:sample_rates=16000,adynamicsmooth,showfreqs=s=900x40:fscale=log:colors=#ffffff70'
        const thirdLayerSegment =
          platform === 'tiktok'
            ? '[vid];[1:v]scale=396:548[stkr];[vid][stkr]overlay=format=auto:x=72:y=200;'
            : ';'
        const stickerImageInput =
          platform === 'tiktok' ? ` -i ${stickerUri}` : ''
        try {
          session = await FFmpegKit.execute(
            `${audioStartOffsetConfig}-i ${streamMp3Url}${stickerImageInput} -filter_complex "${backgroundSegment}[bg];[0:a]${SHOWFREQS_SEGMENT}[fg];[0:a]${SHOWFREQS_SEGMENT},vflip[fgflip];[bg][fg]overlay=format=auto:x=-100:y=H-h-100[fo];[fo][fgflip]overlay=format=auto:x=-100:y=H-h-60${thirdLayerSegment}[0:a]anull" -pix_fmt yuv420p -c:v libx264 -preset ultrafast -c:a aac -t 10 ${storyVideoPath}`
          )
        } catch (e) {
          handleError(platform, e, 'Error at FFmpeg step')
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
            platform,
            new Error(output),
            'Error at generate video background step'
          )
          return
        }

        if (cancelRef.current) {
          cleanup()
        }
        // Step 4: Put everything together and push to platform
        const videoUri = `file://${storyVideoPath}`
        try {
          if (platform === 'instagram') {
            await pasteToInstagramApp(videoUri, stickerUri)
          } else if (platform === 'snapchat') {
            await pasteToSnapchatApp(
              videoUri,
              `file://${stickerUri}`,
              encodeURI(getTrackRoute(content.track, true))
            )
          } else if (platform === 'tiktok') {
            pasteToTikTokApp(`${storyVideoPath}`)
          }
        } catch (error) {
          handleError(platform, error, 'Error at share to app step')
          return
        } finally {
          cleanup()
        }
        track(
          make({
            eventName: SUCCESS_EVENT_NAMES_MAP[platform],
            title: content.track.title,
            artist: content.artist.handle
          })
        )
      }
    },
    [
      trackImageUri,
      content,
      toggleProgressDrawer,
      captureStickerImage,
      pasteToInstagramApp,
      pasteToSnapchatApp,
      handleError,
      cleanup,
      dispatch,
      cancelStory,
      pasteToTikTokApp
    ]
  )

  const handleShare = useCallback(
    async (platform: ShareToStoryPlatform) => {
      await Promise.race([
        generateStory(platform),
        new Promise<false>((resolve) =>
          cancelRequestedEventEmitter.once(CANCEL_REQUESTED_EVENT, () =>
            resolve(false)
          )
        )
      ])
    },
    [generateStory]
  )

  const handleShareToInstagramStory = useCallback(async () => {
    setSelectedPlatform('instagram')
    await handleShare('instagram')
  }, [handleShare])

  const handleShareToSnapchat = useCallback(async () => {
    setSelectedPlatform('snapchat')
    await handleShare('snapchat')
  }, [handleShare])

  const handleShareToTikTok = useCallback(async () => {
    if (Platform.OS === 'ios') {
      const isAddPhotoPermGrantedResult = await check(
        PERMISSIONS.IOS.PHOTO_LIBRARY_ADD_ONLY
      )
      if (
        isAddPhotoPermGrantedResult === RESULTS.DENIED ||
        isAddPhotoPermGrantedResult === RESULTS.LIMITED
      ) {
        const permissionStatus = await request(
          PERMISSIONS.IOS.PHOTO_LIBRARY_ADD_ONLY
        )
        if (permissionStatus !== RESULTS.GRANTED) {
          toast({
            content: messages.addToPhotoLibraryDenied,
            timeout: 8000,
            type: 'error'
          })
          return
        }
      } else if (
        isAddPhotoPermGrantedResult === RESULTS.BLOCKED ||
        isAddPhotoPermGrantedResult === RESULTS.UNAVAILABLE
      ) {
        toast({
          content: messages.addToPhotoLibraryBlocked,
          timeout: 12000,
          type: 'error'
        })
        return
      }
    }
    setSelectedPlatform('tiktok')
    await handleShare('tiktok')
  }, [handleShare, toast])

  return {
    handleShareToSnapchat,
    handleShareToStoryStickerLoad,
    handleShareToInstagramStory,
    handleShareToTikTok,
    selectedPlatform,
    cancelStory
  }
}

const useStyles = makeStyles(({ spacing }) => ({
  container: {
    paddingTop: spacing(4),
    paddingBottom: spacing(10),
    flexDirection: 'column',
    paddingHorizontal: spacing(4),
    alignItems: 'center'
  },
  subtitleText: {
    marginTop: spacing(4)
  },
  button: {
    marginTop: spacing(4)
  },
  progress: {
    marginTop: spacing(4),
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
  const progress = useSelector(getProgressPercentage)
  const cancel = useSelector(getCancel)
  const platform = useSelector(getPlatform)
  const handleCancel = useCallback(() => {
    cancel?.()
  }, [cancel])

  let subtitle: string
  if (platform === 'instagram') {
    subtitle = messages.loadingInstagramStorySubtitle
  } else if (platform === 'snapchat') {
    subtitle = messages.loadingSnapchatSubtitle
  } else {
    subtitle = messages.loadingTikTokSubtitle
  }

  return (
    <NativeDrawer
      zIndex={10}
      drawerName='ShareToStoryProgress'
      onClose={handleCancel}
    >
      <View style={styles.container}>
        <HarmonyModalHeader
          icon={IconWavform}
          title={messages.loadingStoryModalTitle}
        />
        <View style={styles.progress}>
          <LinearProgress value={progress} styles={progressBarStyles} />
        </View>
        <Text weight='medium' fontSize={'large'} style={styles.subtitleText}>
          {subtitle}
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
