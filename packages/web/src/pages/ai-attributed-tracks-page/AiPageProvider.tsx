import { useEffect, useCallback, ComponentType, RefObject } from 'react'

import { useUserByHandle } from '@audius/common/api'
import {
  lineupSelectors,
  aiPageLineupActions as tracksActions,
  aiPageActions,
  aiPageSelectors,
  queueSelectors,
  playerSelectors
} from '@audius/common/store'
import { route } from '@audius/common/utils'
import { connect } from 'react-redux'
import { useParams } from 'react-router'
import { Dispatch } from 'redux'

import { LineupVariant } from 'components/lineup/types'
import { AppState } from 'store/types'
import { push as pushRoute } from 'utils/navigation'

import { AiPageProps as DesktopAiPageProps } from './components/desktop/AiPage'
import { AiPageProps as MobileAiPageProps } from './components/mobile/AiPage'
const { profilePage } = route

const { makeGetCurrent } = queueSelectors
const { getPlaying, getBuffering } = playerSelectors
const { getLineup } = aiPageSelectors
const { reset } = aiPageActions
const { makeGetLineupMetadatas } = lineupSelectors

const messages = {
  title: 'AI Generated Tracks'
}

type OwnProps = {
  containerRef: RefObject<HTMLDivElement>
  children: ComponentType<DesktopAiPageProps> | ComponentType<MobileAiPageProps>
}

type mapStateProps = ReturnType<typeof makeMapStateToProps>
type AiPageProviderProps = OwnProps &
  ReturnType<mapStateProps> &
  ReturnType<typeof mapDispatchToProps>

const AiPageProvider = ({
  containerRef,
  children: Children,
  tracks,
  currentQueueItem,
  isPlaying,
  isBuffering,
  pause,
  play,
  loadMore,
  goToRoute,
  reset,
  resetTracks
}: AiPageProviderProps) => {
  const { handle } = useParams<{ handle: string }>()

  const { data: user } = useUserByHandle(handle)

  useEffect(() => {
    return function cleanup() {
      reset()
      resetTracks()
    }
  }, [reset, resetTracks])

  const goToArtistPage = useCallback(() => {
    if (user) {
      goToRoute(profilePage(user?.handle))
    }
  }, [goToRoute, user])

  useEffect(() => {
    if (user && !user.allow_ai_attribution) {
      goToRoute(profilePage(user?.handle))
    }
  }, [user, goToRoute])

  const getLineupProps = () => {
    return {
      selfLoad: true,
      variant: LineupVariant.MAIN,
      containerRef,
      lineup: tracks,
      playingUid: currentQueueItem.uid,
      playingSource: currentQueueItem.source,
      playingTrackId: currentQueueItem.track && currentQueueItem.track.track_id,
      playing: isPlaying,
      buffering: isBuffering,
      pauseTrack: pause,
      playTrack: play,
      actions: tracksActions,
      scrollParent: containerRef as any,
      loadMore: (offset: number, limit: number) => {
        loadMore(offset, limit, { aiUserHandle: handle ?? null })
      }
    }
  }

  const childProps = {
    title: messages.title,
    user: user ?? null,
    goToArtistPage,
    getLineupProps
  }

  return <Children {...childProps} />
}

function makeMapStateToProps() {
  const getRemixesTracksLineup = makeGetLineupMetadatas(getLineup)
  const getCurrentQueueItem = makeGetCurrent()

  const mapStateToProps = (state: AppState) => {
    return {
      tracks: getRemixesTracksLineup(state),
      currentQueueItem: getCurrentQueueItem(state),
      isPlaying: getPlaying(state),
      isBuffering: getBuffering(state)
    }
  }
  return mapStateToProps
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    goToRoute: (route: string) => dispatch(pushRoute(route)),
    loadMore: (
      offset: number,
      limit: number,
      payload: { aiUserHandle: string | null }
    ) =>
      dispatch(
        tracksActions.fetchLineupMetadatas(offset, limit, false, payload)
      ),
    pause: () => dispatch(tracksActions.pause()),
    play: (uid?: string) => dispatch(tracksActions.play(uid)),
    reset: () => dispatch(reset()),
    resetTracks: () => dispatch(tracksActions.reset())
  }
}

export default connect(makeMapStateToProps, mapDispatchToProps)(AiPageProvider)
