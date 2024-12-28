import { useEffect, useCallback, ComponentType, RefObject } from 'react'

import { ID } from '@audius/common/models'
import {
  lineupSelectors,
  aiPageLineupActions as tracksActions,
  aiPageActions,
  aiPageSelectors,
  queueSelectors,
  playerSelectors
} from '@audius/common/store'
import { route } from '@audius/common/utils'
import { push as pushRoute } from 'utils/navigation'
import { connect } from 'react-redux'
import { useParams } from 'react-router'
import { Dispatch } from 'redux'

import { LineupVariant } from 'components/lineup/types'
import { AppState } from 'store/types'

import { AiPageProps as DesktopRemixesPageProps } from './components/desktop/AiPage'
import { AiPageProps as MobileRemixesPageProps } from './components/mobile/AiPage'
const { profilePage } = route

const { makeGetCurrent } = queueSelectors
const { getPlaying, getBuffering } = playerSelectors
const { getAiUser, getLineup } = aiPageSelectors
const { fetchAiUser, reset } = aiPageActions
const { makeGetLineupMetadatas } = lineupSelectors

const messages = {
  title: 'AI Generated Tracks'
}

type OwnProps = {
  containerRef: RefObject<HTMLDivElement>
  children:
    | ComponentType<DesktopRemixesPageProps>
    | ComponentType<MobileRemixesPageProps>
}

type mapStateProps = ReturnType<typeof makeMapStateToProps>
type AiPageProviderProps = OwnProps &
  ReturnType<mapStateProps> &
  ReturnType<typeof mapDispatchToProps>

const AiPageProvider = ({
  containerRef,
  children: Children,
  user,
  tracks,
  fetchAiUser,
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

  useEffect(() => {
    fetchAiUser(handle)
  }, [fetchAiUser, handle])

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
    user,
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
      user: getAiUser(state),
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
    fetchAiUser: (handle: string, userId?: ID) =>
      dispatch(fetchAiUser({ handle, userId })),
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
