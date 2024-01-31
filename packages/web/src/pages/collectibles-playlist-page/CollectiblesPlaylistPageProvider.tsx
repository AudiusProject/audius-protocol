import {
  cacheUsersSelectors,
  profilePageActions,
  queueActions,
  QueueSource,
  collectibleDetailsUIActions,
  shareModalUIActions,
  playerSelectors,
  CollectionTrack,
  CollectionPageTrackRecord
} from '@audius/common/store'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
  ComponentType
} from 'react'

import {
  ShareSource,
  Chain,
  SmartCollectionVariant,
  Status,
  Collectible,
  Collection,
  SmartCollection,
  User
} from '@audius/common/models'
import { getHash, formatSeconds } from '@audius/common/utils'
import cn from 'classnames'
import { push } from 'connected-react-router'
import { useDispatch, useSelector } from 'react-redux'
import { matchPath } from 'react-router-dom'

import { useModalState } from 'common/hooks/useModalState'
import { AUDIO_NFT_PLAYLIST } from 'common/store/smart-collection/smartCollections'
import { TablePlayButton } from 'components/table/components/TablePlayButton'
import { getLocationPathname } from 'store/routing/selectors'
import { AppState } from 'store/types'
import { AUDIO_NFT_PLAYLIST_PAGE, profilePage } from 'utils/route'

import { CollectionPageProps as DesktopCollectionPageProps } from '../collection-page/components/desktop/CollectionPage'
import { CollectionPageProps as MobileCollectionPageProps } from '../collection-page/components/mobile/CollectionPage'

import styles from './CollectiblesPlaylistPage.module.css'
const { getPlaying, makeGetCurrent } = playerSelectors
const { requestOpen: requestOpenShareModal } = shareModalUIActions
const { setCollectible } = collectibleDetailsUIActions
const { add, clear, pause, play } = queueActions
const { fetchProfile } = profilePageActions
const { getUser } = cacheUsersSelectors

declare global {
  interface HTMLMediaElement {
    webkitAudioDecodedByteCount: number
    mozHasAudio: boolean
    audioTracks: unknown[]
  }
}

type CollectiblesPlaylistPageProviderProps = {
  children:
    | ComponentType<MobileCollectionPageProps>
    | ComponentType<DesktopCollectionPageProps>
}

const chainLabelMap: Record<Chain, string> = {
  [Chain.Eth]: 'Ethereum',
  [Chain.Sol]: 'Solana'
}

const hasAudio = (video: HTMLMediaElement) => {
  if (
    typeof video.webkitAudioDecodedByteCount !== 'undefined' ||
    video.mozHasAudio
  ) {
    if (
      video.webkitAudioDecodedByteCount > 0 ||
      video.mozHasAudio ||
      video.audioTracks?.length
    ) {
      return true
    }
  }
  return false
}

const getCurrent = makeGetCurrent()

export const CollectiblesPlaylistPageProvider = ({
  children: Children
}: CollectiblesPlaylistPageProviderProps) => {
  const dispatch = useDispatch()
  const currentPlayerItem = useSelector(getCurrent)
  const playing = useSelector(getPlaying)

  // Getting user data
  const pathname = useSelector(getLocationPathname)
  const routeMatch = useMemo(
    () =>
      matchPath<{ handle: string }>(pathname, {
        path: AUDIO_NFT_PLAYLIST_PAGE,
        exact: true
      }),
    [pathname]
  )

  const user = useSelector<AppState, User | null>((state) =>
    getUser(state, { handle: routeMatch?.params.handle ?? null })
  )

  const [audioCollectibles, setAudioCollectibles] = useState<Collectible[]>([])
  const firstLoadedCollectible = useRef<Collectible>()
  const hasFetchedCollectibles = useRef(false)
  const [hasFetchedAllCollectibles, setHasFetchedAllCollectibles] =
    useState(false)
  useEffect(() => {
    const asyncFn = async (cs: Collectible[]) => {
      const collectibleIds = Object.keys(user?.collectibles ?? {})
      const order = user?.collectibles?.order

      /**
       * Filter by the user's order if it exists.
       * This is to hide the hidden items
       */
      const isInUserOrder = (c: Collectible) => {
        if (order?.length) {
          return order.includes(c.id)
        } else if (collectibleIds.length) {
          return collectibleIds.includes(c.id)
        }
        return true
      }

      const potentiallyHasAudio = (c: Collectible) =>
        c.hasAudio ||
        ['mp3', 'wav', 'oga', 'mp4'].some((ext) =>
          c.animationUrl?.endsWith(ext)
        )

      const filteredAndSortedCollectibles = cs
        .filter((c) => isInUserOrder(c) && potentiallyHasAudio(c))
        // Sort by user collectibles order
        .sort((a, b) => (order ? order.indexOf(a.id) - order.indexOf(b.id) : 0))

      await Promise.all(
        filteredAndSortedCollectibles.map(async (collectible, index) => {
          if (collectible.animationUrl?.endsWith('mp4')) {
            const v = document.createElement('video')
            v.muted = true
            const duration: Promise<number> = new Promise((resolve) => {
              setTimeout(() => resolve(0), 60000)
              v.onloadedmetadata = () => {
                resolve(v.duration)
              }
            })

            v.preload = 'metadata'
            v.src = collectible.animationUrl
            collectible.duration = await duration
            v.play().catch((e) => console.error('video error', e))

            const videoHasAudio = await new Promise((resolve) => {
              const timeout = 5000
              const interval = 200
              const checkForAudio = (timer = 0) => {
                if (hasAudio(v)) {
                  resolve(true)
                } else {
                  if (timer < timeout) {
                    setTimeout(() => checkForAudio(timer + interval), interval)
                  } else {
                    resolve(false)
                  }
                }
              }
              checkForAudio()
            })

            // Stop the buffering of the video
            v.src = ''
            v.load()
            if (!videoHasAudio) {
              return null
            }
          } else {
            const a = new Audio()
            const duration: Promise<number> = new Promise((resolve) => {
              setTimeout(() => resolve(0), 60000)
              a.onloadedmetadata = () => {
                resolve(a.duration)
              }
            })
            a.preload = 'metadata'
            a.src = collectible.animationUrl ?? ''
            collectible.duration = await duration
          }
          if (collectible) {
            setAudioCollectibles((currentCollectibles) => {
              const newCollectibles = [...currentCollectibles]
              newCollectibles[index] = collectible
              return newCollectibles
            })
            if (!firstLoadedCollectible.current) {
              firstLoadedCollectible.current = collectible
            }
          }
          return collectible
        })
      )
      setHasFetchedAllCollectibles(true)
    }

    if (
      user?.collectibleList &&
      (user?.collectibles || user?.collectiblesOrderUnset) &&
      !hasFetchedCollectibles.current
    ) {
      const cs = [
        ...(user?.collectibleList ?? []),
        ...(user?.solanaCollectibleList ?? [])
      ]
      asyncFn(cs)
      hasFetchedCollectibles.current = true
    }
  }, [
    user,
    setAudioCollectibles,
    hasFetchedCollectibles,
    firstLoadedCollectible,
    setHasFetchedAllCollectibles
  ])

  const title = user
    ? `${user?.name} ${SmartCollectionVariant.AUDIO_NFT_PLAYLIST}`
    : SmartCollectionVariant.AUDIO_NFT_PLAYLIST

  useEffect(() => {
    if (routeMatch?.params.handle) {
      dispatch(
        fetchProfile(routeMatch.params.handle, null, false, false, false, true)
      )
    }
  }, [dispatch, routeMatch])

  const tracksLoading = !hasFetchedAllCollectibles

  const isPlayingACollectible = useMemo(
    () =>
      audioCollectibles.some(
        (collectible) =>
          collectible && collectible.id === currentPlayerItem?.collectible?.id
      ),
    [audioCollectibles, currentPlayerItem]
  )

  const firstCollectible = useMemo(
    () => audioCollectibles.find((c) => c),
    [audioCollectibles]
  )

  const entries = audioCollectibles
    .filter((c) => c)
    .map((collectible) => ({
      track_id: collectible.id,
      id: collectible.id,
      uid: collectible.id,
      artistId: user?.user_id,
      collectible,
      title: collectible.name,
      source: QueueSource.COLLECTIBLE_PLAYLIST_TRACKS
    }))

  const onClickRow = (collectible: Collectible, index: number) => {
    if (playing && collectible.id === currentPlayerItem?.collectible?.id) {
      dispatch(pause({}))
    } else if (collectible.id === currentPlayerItem?.collectible?.id) {
      dispatch(play({}))
    } else {
      if (!isPlayingACollectible) {
        dispatch(clear({}))
        dispatch(add({ entries }))
      }
      dispatch(play({ collectible }))
    }
  }

  const [, setIsDetailsModalOpen] = useModalState('CollectibleDetails')

  const onClickTrackName = (collectible: Collectible) => {
    dispatch(
      setCollectible({
        collectible,
        ownerHandle: user?.handle,
        embedCollectibleHash: getHash(collectible.id),
        isUserOnTheirProfile: false
      })
    )
    setIsDetailsModalOpen(true)
  }

  const onHeroTrackClickArtistName = () => {
    if (user) dispatch(push(profilePage(user?.handle)))
  }

  const handlePlayAllClick = () => {
    if (playing && isPlayingACollectible) {
      dispatch(pause({}))
    } else if (isPlayingACollectible) {
      dispatch(play({}))
    } else {
      dispatch(clear({}))
      dispatch(
        add({
          entries,
          index: 0
        })
      )
      dispatch(play({ collectible: firstCollectible }))
    }
  }

  const getPlayingUid = useCallback(() => {
    return currentPlayerItem.uid
      ? currentPlayerItem.uid
      : currentPlayerItem.collectible
      ? currentPlayerItem.collectible.id
      : null
  }, [currentPlayerItem])

  const formatMetadata = useCallback(
    (trackMetadatas: CollectionTrack[]): CollectionPageTrackRecord[] => {
      return trackMetadatas.map((metadata, i) => ({
        ...metadata,
        ...metadata.collectible,
        key: `${metadata.collectible?.name}_${metadata.uid}_${i}`,
        name: metadata.collectible?.name as string,
        artist: '',
        handle: '',
        date: metadata.dateAdded || metadata.created_at,
        time: 0,
        plays: 0
      }))
    },
    []
  )

  const getFilteredData = useCallback(
    (trackMetadatas: CollectionTrack[]) => {
      const playingUid = getPlayingUid()
      const playingIndex = entries.findIndex(({ uid }) => uid === playingUid)
      const formattedMetadata = formatMetadata(trackMetadatas)
      const filteredIndex =
        playingIndex > -1
          ? formattedMetadata.findIndex(
              (metadata) => metadata.uid === playingUid
            )
          : playingIndex
      return [formattedMetadata, filteredIndex] as [
        typeof formattedMetadata,
        number
      ]
    },
    [getPlayingUid, formatMetadata, entries]
  )

  const isQueued = useCallback(() => {
    return entries.some(
      (entry) => currentPlayerItem?.collectible?.id === entry.id
    )
  }, [entries, currentPlayerItem])

  const columns = [
    {
      title: '',
      key: 'playButton',
      className: 'colCollectiblesPlayButton',
      render: (val: string, record: Collectible, index: number) => (
        <TablePlayButton
          paused={!playing}
          playing={record.id === currentPlayerItem?.collectible?.id}
          className={styles.playButtonFormatting}
        />
      )
    },
    {
      title: 'Track Name',
      dataIndex: 'name',
      key: 'name',
      className: 'colTrackName',
      width: '70%',
      render: (val: string, record: Collectible) => (
        <div
          className={cn(styles.collectibleName, {
            [styles.active]: record.id === currentPlayerItem?.collectible?.id
          })}
          onClick={(e) => {
            e.stopPropagation()
            onClickTrackName(record)
          }}
        >
          {val}
        </div>
      )
    },
    {
      title: 'Chain',
      dataIndex: 'chain',
      key: 'chain',
      className: 'colChain',
      render: (val: string, record: Collectible) => (
        <div>{chainLabelMap[record.chain]}</div>
      )
    },
    {
      title: 'Time',
      dataIndex: 'time',
      key: 'time',
      className: 'colTime',
      render: (val: string, record: Collectible) => (
        <div>{record.duration ? formatSeconds(record.duration) : '--'}</div>
      )
    }
  ]

  const onHeroTrackShare = () => {
    if (user) {
      dispatch(
        requestOpenShareModal({
          type: 'audioNftPlaylist',
          userId: user?.user_id,
          source: ShareSource.TILE
        })
      )
    }
  }

  const metadata: SmartCollection | Collection = {
    ...AUDIO_NFT_PLAYLIST,
    playlist_name: title,
    description: AUDIO_NFT_PLAYLIST.makeDescription?.(user?.name) ?? '',
    playlist_contents: {
      track_ids: entries.map((entry) => ({
        track: entry.id
      }))
    },
    imageOverride: (firstLoadedCollectible.current?.imageUrl ??
      firstLoadedCollectible.current?.frameUrl ??
      firstLoadedCollectible.current?.gifUrl) as string | undefined,
    typeTitle: 'Audio NFT Playlist',
    customEmptyText: user
      ? `There are no playable audio NFTs in any wallets connected to ${user.name}`
      : ''
  }

  const childProps = {
    title,
    description: '',
    canonicalUrl: '',
    playlistId: SmartCollectionVariant.AUDIO_NFT_PLAYLIST,
    playing,
    type: 'playlist' as const,
    collection: {
      status: tracksLoading ? Status.LOADING : Status.SUCCESS,
      metadata,
      user
    },
    tracks: {
      status: !firstLoadedCollectible.current ? Status.LOADING : Status.SUCCESS,
      entries
    },
    columns,
    getPlayingUid,
    getFilteredData,
    isQueued,

    onPlay: handlePlayAllClick,
    onHeroTrackShare,
    onClickRow,
    onClickTrackName,
    onHeroTrackClickArtistName
  }

  // @ts-ignore TODO: remove provider pattern
  return <Children {...childProps} />
}
