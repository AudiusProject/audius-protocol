import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext
} from 'react'

import { ID, Kind, UID } from '@audius/common/models'
import {
  PlayerBehavior,
  QueueSource,
  playerSelectors,
  queueActions
} from '@audius/common/store'
import { Uid, makeIndexedUid } from '@audius/common/utils'
import { useDispatch, useSelector } from 'react-redux'

const { getUid: getCurrentPlayerTrackUid } = playerSelectors

type LineupItem = {
  kind: Kind.TRACKS | Kind.COLLECTIONS
  id: ID
}

// Props accepted by the lineup provider
type LineupContextProps = {
  items: LineupItem[]
  name: string
  queueSource: QueueSource
}

// The value passed down through the context
type LineupContextValue = {
  onPlay: (uid: UID, index: number) => void
} & Pick<LineupContextProps, 'items' | 'name'>

const initialValue: LineupContextValue = {
  onPlay: () => {},
  items: [],
  name: ''
}

export const LineupContext = createContext<LineupContextValue | undefined>(
  initialValue
)

export const LineupContextProvider = (
  props: PropsWithChildren<LineupContextProps>
) => {
  const { items, queueSource, name, children } = props
  const dispatch = useDispatch()
  const currentPlayerTrackUid = useSelector(getCurrentPlayerTrackUid)
  const onPlay = useCallback(
    (uid: UID, index: number) => {
      const id = Number(Uid.getComponent(uid, 'id'))

      if (!currentPlayerTrackUid || uid !== currentPlayerTrackUid) {
        const toQueue = items.map((item) => {
          return {
            uid: makeIndexedUid(item.kind, item.id, index, name),
            id: item.id,
            source: queueSource,
            playerBehavior: PlayerBehavior.FULL_OR_PREVIEW
          }
        })
        dispatch(queueActions.clear({}))
        dispatch(queueActions.add({ entries: toQueue }))
      }
      dispatch(
        queueActions.play({
          uid,
          trackId: id,
          source: queueSource,
          playerBehavior: PlayerBehavior.FULL_OR_PREVIEW
        })
      )
    },
    [name, queueSource, items, currentPlayerTrackUid, dispatch]
  )
  return (
    <LineupContext.Provider
      value={{
        onPlay,
        ...props
      }}
    >
      {children}
    </LineupContext.Provider>
  )
}

export const useLineupContext = () => {
  const context = useContext(LineupContext)

  if (!context) {
    throw new Error(
      'useLineupContext must be used within a LineupContextProvider'
    )
  }

  return context
}
