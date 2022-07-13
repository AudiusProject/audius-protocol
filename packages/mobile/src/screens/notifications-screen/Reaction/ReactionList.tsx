import { useCallback, useContext, useRef, useState } from 'react'

import {
  reactionOrder,
  ReactionTypes
} from 'audius-client/src/common/store/ui/reactions/slice'
import { Nullable } from 'audius-client/src/common/utils/typeUtils'
import { View, PanResponderGestureState, PanResponder } from 'react-native'

import { NotificationsDrawerNavigationContext } from '../NotificationsDrawerNavigationContext'

import { reactionMap } from './reactions'

type PositionEntries = [ReactionTypes, { x: number; width: number }][]

type ReactionListProps = {
  selectedReaction: Nullable<ReactionTypes>
  onChange: (reaction: Nullable<ReactionTypes>) => void
  isVisible: boolean
}

export const ReactionList = (props: ReactionListProps) => {
  const { selectedReaction, onChange, isVisible } = props
  const interactingRef = useRef<ReactionTypes | null>(null)
  const { setGesturesDisabled } = useContext(
    NotificationsDrawerNavigationContext
  )
  const [interacting, setInteracting] = useState<ReactionTypes | null>(null)
  const positions = useRef<{
    [k in ReactionTypes]: { x: number; width: number }
  }>({
    fire: { x: 0, width: 0 },
    heart: { x: 0, width: 0 },
    party: { x: 0, width: 0 },
    explode: { x: 0, width: 0 }
  })

  const handleGesture = useCallback(
    (_, gestureState: PanResponderGestureState) => {
      const { x0, moveX } = gestureState

      const positionEntries = Object.entries(
        positions.current
      ) as PositionEntries

      const currentReaction = positionEntries.find(([, { x, width }]) => {
        const currentPosition = moveX || x0
        return currentPosition > x && currentPosition <= x + width
      })

      if (currentReaction) {
        const [reactionType] = currentReaction
        interactingRef.current = reactionType
        setInteracting(reactionType as ReactionTypes)
      } else {
        interactingRef.current = null
        setInteracting(null)
      }
    },
    []
  )

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e, gestureState) => {
        setGesturesDisabled?.(true)
        handleGesture(e, gestureState)
      },
      onPanResponderMove: handleGesture,
      onPanResponderRelease: () => {
        onChange(interactingRef.current)
        interactingRef.current = null
        setInteracting(null)
        setGesturesDisabled?.(false)
      },
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true
    })
  )

  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'center'
        }}
        {...panResponder.current.panHandlers}>
        {reactionOrder.map((reactionType) => {
          const Reaction = reactionMap[reactionType]
          const status =
            selectedReaction === reactionType
              ? 'selected'
              : interacting === reactionType
              ? 'interacting'
              : selectedReaction
              ? 'unselected'
              : 'idle'
          return (
            <Reaction
              key={reactionType}
              status={status}
              onMeasure={({ x, width }: { x: number; width: number }) => {
                positions.current = {
                  ...positions.current,
                  [reactionType]: { x, width }
                }
              }}
              isVisible={isVisible}
            />
          )
        })}
      </View>
    </View>
  )
}
