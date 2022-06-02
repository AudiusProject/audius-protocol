import { useCallback, useContext, useRef, useState } from 'react'

import { Nullable } from 'audius-client/src/common/utils/typeUtils'
import { View, PanResponderGestureState, PanResponder } from 'react-native'

import { NotificationsDrawerNavigationContext } from '../NotificationsDrawerNavigationContext'

import { reactions, ReactionTypes } from './reactions'

type PositionEntries = [ReactionTypes, { x: number; width: number }][]

const reactionTypes: ReactionTypes[] = ['heart', 'fire', 'party', 'explode']

type ReactionListProps = {
  selectedReaction: Nullable<ReactionTypes>
  onChange: (reaction: Nullable<ReactionTypes>) => void
}

export const ReactionList = (props: ReactionListProps) => {
  const { selectedReaction, onChange } = props
  const interactingRef = useRef<ReactionTypes | null>(null)
  const { setGesturesDisabled } = useContext(
    NotificationsDrawerNavigationContext
  )
  const [interacting, setInteracting] = useState<ReactionTypes | null>(null)
  const positions = useRef({
    fire: { x: 0, width: 0 },
    heart: { x: 0, width: 0 },
    party: { x: 0, width: 0 },
    explode: { x: 0, width: 0 }
  })

  const handleGesture = useCallback(
    (_, gestureState: PanResponderGestureState) => {
      const { x0, moveX } = gestureState

      const positionEntires = Object.entries(
        positions.current
      ) as PositionEntries

      const currentReaction = positionEntires.find(([, { x, width }]) => {
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
        {...panResponder.current.panHandlers}
      >
        {reactionTypes.map(reactionType => {
          const Reaction = reactions[reactionType]
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
            />
          )
        })}
      </View>
    </View>
  )
}
