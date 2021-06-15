import Audius from 'services/Audius'
import { useSelector, useDispatch } from 'react-redux'
import { ThunkAction } from 'redux-thunk'
import { Action } from 'redux'
import AppState from 'store/types'
import { DiscoveryProvider, Playlist, Track } from 'types'
import { useDiscoveryProviders } from '../discoveryProvider/hooks'
import { useEffect, useState } from 'react'
import imageBlank from 'assets/img/imageBlank2x.png'
import {
  MusicError,
  setTopAlbums,
  setTopPlaylists,
  setTopTracks
} from './slice'
import { fetchUntilSuccess } from '../../../utils/fetch'

const AUDIUS_URL = process.env.REACT_APP_AUDIUS_URL

// -------------------------------- Selectors  ---------------------------------

export const getTopTracks = (state: AppState) => state.cache.music.topTracks
export const getTopPlaylists = (state: AppState) =>
  state.cache.music.topPlaylists
export const getTopAlbums = (state: AppState) => state.cache.music.topAlbums

// -------------------------------- Thunk Actions  ---------------------------------

export function fetchTopTracks(
  nodes: DiscoveryProvider[]
): ThunkAction<void, AppState, Audius, Action<string>> {
  return async (dispatch, getState, aud) => {
    try {
      const json = await fetchUntilSuccess(
        nodes.map(node => `${node.endpoint}/v1/tracks/trending?limit=4`)
      )
      const tracks: Track[] = json.data.slice(0, 4).map((d: any) => ({
        title: d.title,
        handle: d.user.handle,
        artwork: d.artwork?.['480x480'] ?? imageBlank,
        url: `${AUDIUS_URL}/tracks/${d.id}`,
        userUrl: `${AUDIUS_URL}/users/${d.user.id}`
      }))
      dispatch(setTopTracks({ tracks }))
    } catch (e) {
      dispatch(setTopTracks({ tracks: MusicError.ERROR }))
      console.error(e)
    }
  }
}

export function fetchTopPlaylists(
  nodes: DiscoveryProvider[]
): ThunkAction<void, AppState, Audius, Action<string>> {
  return async (dispatch, getState, aud) => {
    try {
      const json = await fetchUntilSuccess(
        nodes.map(
          node => `${node.endpoint}/v1/playlists/top?type=playlist&limit=5`
        )
      )
      const playlists: Playlist[] = json.data.map((d: any) => ({
        title: d.playlist_name,
        handle: d.user.handle,
        artwork: d.artwork?.['480x480'] ?? imageBlank,
        plays: d.total_play_count,
        url: `${AUDIUS_URL}/playlists/${d.id}`
      }))
      dispatch(setTopPlaylists({ playlists }))
    } catch (e) {
      console.error(e)
      dispatch(setTopPlaylists({ playlists: MusicError.ERROR }))
    }
  }
}

export function fetchTopAlbums(
  nodes: DiscoveryProvider[]
): ThunkAction<void, AppState, Audius, Action<string>> {
  return async (dispatch, getState, aud) => {
    try {
      const json = await fetchUntilSuccess(
        nodes.map(
          node => `${node.endpoint}/v1/playlists/top?type=album&limit=5`
        )
      )
      const albums: Playlist[] = json.data.map((d: any) => ({
        title: d.playlist_name,
        handle: d.user.handle,
        artwork: d.artwork?.['480x480'] ?? imageBlank,
        plays: d.total_play_count,
        url: `${AUDIUS_URL}/playlists/${d.id}`
      }))
      dispatch(setTopAlbums({ albums }))
    } catch (e) {
      console.error(e)
      dispatch(setTopAlbums({ albums: MusicError.ERROR }))
    }
  }
}

// -------------------------------- Hooks  --------------------------------

export const useTopTracks = () => {
  const [doOnce, setDoOnce] = useState(false)
  const topTracks = useSelector(getTopTracks)
  const { nodes } = useDiscoveryProviders({})
  const dispatch = useDispatch()

  useEffect(() => {
    if (!doOnce && nodes[0] && !topTracks) {
      setDoOnce(true)
      dispatch(fetchTopTracks(nodes))
    }
  }, [doOnce, topTracks, dispatch, nodes])

  useEffect(() => {
    if (topTracks) {
      setDoOnce(false)
    }
  }, [topTracks, setDoOnce])

  return { topTracks }
}

export const useTopPlaylists = () => {
  const [doOnce, setDoOnce] = useState(false)
  const topPlaylists = useSelector(getTopPlaylists)
  const { nodes } = useDiscoveryProviders({})
  const dispatch = useDispatch()

  useEffect(() => {
    if (!doOnce && nodes[0] && !topPlaylists) {
      setDoOnce(true)
      dispatch(fetchTopPlaylists(nodes))
    }
  }, [topPlaylists, dispatch, nodes, doOnce])

  useEffect(() => {
    if (topPlaylists) {
      setDoOnce(false)
    }
  }, [topPlaylists, setDoOnce])

  return { topPlaylists }
}

export const useTopAlbums = () => {
  const [doOnce, setDoOnce] = useState(false)
  const topAlbums = useSelector(getTopAlbums)
  const { nodes } = useDiscoveryProviders({})
  const dispatch = useDispatch()

  useEffect(() => {
    if (!doOnce && nodes[0] && !topAlbums) {
      setDoOnce(true)
      dispatch(fetchTopAlbums(nodes))
    }
  }, [topAlbums, dispatch, nodes, doOnce])

  useEffect(() => {
    if (topAlbums) {
      setDoOnce(false)
    }
  }, [topAlbums, setDoOnce])

  return { topAlbums }
}
