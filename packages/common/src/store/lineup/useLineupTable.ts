import { useMemo } from 'react'

import { useSelector } from 'react-redux'

import { useTracks, useUsers } from '~/api'
import { Kind, Status } from '~/models'
import { removeNullable } from '~/utils/typeUtils'

import { LineupSelector } from './selectors'

const statusMap = {
  pending: Status.LOADING,
  loading: Status.LOADING,
  success: Status.SUCCESS,
  error: Status.ERROR
}

export const useLineupTable = <T, State>(
  lineupSelector: LineupSelector<T, State>
) => {
  const lineup = useSelector(lineupSelector)

  const {
    byId: tracksById,
    data: tracks,
    status: tracksStatus
  } = useTracks(lineup.entries.map((entry) => entry.id))

  const { byId: usersById, status: usersStatus } = useUsers(
    tracks?.map((track) => track.owner_id)
  )

  const { entries, deleted } = useMemo(() => {
    let deleted = 0
    const entries = lineup.entries
      .map((entry) => {
        const track = tracksById[entry.id]
        const trackOwner = usersById[track?.owner_id]
        if (track && trackOwner) {
          return { ...entry, ...track, user: trackOwner }
        } else if (entry.kind === Kind.EMPTY) {
          return { ...entry, owner_id: null }
        }
        deleted += 1
        return null
      })
      .filter(removeNullable)
    return { entries, deleted }
  }, [lineup.entries, tracksById, usersById])

  const isSuccess = [
    statusMap[tracksStatus],
    statusMap[usersStatus],
    lineup.status
  ].every((status) => status === Status.SUCCESS)

  const status =
    (isSuccess && lineup.entries.length > 0 && entries.length === 0) ||
    !isSuccess
      ? Status.LOADING
      : Status.SUCCESS

  return {
    ...lineup,
    deleted,
    entries,
    status
  }
}
