import { useCallback, useContext, useRef, useState } from 'react'

import { reactionOrder } from '@audius/common'
import type { Nullable, ReactionTypes } from '@audius/common'
import type { PanResponderGestureState } from 'react-native'
import { View, PanResponder } from 'react-native'

import { makeStyles } from 'app/styles'

import { NotificationsDrawerNavigationContext } from '../NotificationsDrawerNavigationContext'

import { reactionMap } from './reactions'

const useStyles = makeStyles(() => ({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center'
  }
}))

type PositionEntries = [ReactionTypes, { x: number; width: number }][]

type ReactionListProps = {
  selectedReaction: Nullable<ReactionTypes>
  onChange: (reaction: Nullable<ReactionTypes>) => void
  isVisible: boolean
}

const initialPositions = {
  fire: { x: 0, width: 0 },
  heart: { x: 0, width: 0 },
  party: { x: 0, width: 0 },
  explode: { x: 0, width: 0 }
}

type Positions = { [k in ReactionTypes]: { x: number; width: number } }

/*
 * List of reactions that allows a user to select a reaction by pressing,
 * or pressHolding + dragging.
 *
 * Implements gesture handler to track user drag position and presses, providing
 * each reaction one of the following statuses: idle/interacting/selected/unselected
 */
export const ReactionList = (props: ReactionListProps) => {
  const styles = useStyles()
  const { selectedReaction, onChange, isVisible } = props
  // The current reaction the user is interacting with.
  // Note this needs to be a ref since the guesture handler is also a ref
  const interactingReactionRef = useRef<ReactionTypes | null>(null)
  const { setGesturesDisabled } = useContext(
    NotificationsDrawerNavigationContext
  )
  // Whether or not the user is currently interacting with the reactions
  const [interacting, setInteracting] = useState<ReactionTypes | null>(null)
  const positions = useRef<Positions>(initialPositions)

  const handleGesture = useCallback(
    (_, gestureState: PanResponderGestureState) => {
      const { x0, moveX } = gestureState

      const positionEntries = Object.entries(
        positions.current
      ) as PositionEntries

      // based on the current x0 and moveX, determine which reaction the
      // user is interacting with.
      const currentReaction = positionEntries.find(([, { x, width }]) => {
        const currentPosition = moveX || x0
        return currentPosition > x && currentPosition <= x + width
      })

      if (currentReaction) {
        const [reactionType] = currentReaction
        interactingReactionRef.current = reactionType
        setInteracting(reactionType as ReactionTypes)
      } else {
        interactingReactionRef.current = null
        setInteracting(null)
      }
    },
    []
  )

  const handlePanResponderRelease = useCallback(() => {
    onChange(interactingReactionRef.current)
    interactingReactionRef.current = null
    setInteracting(null)
    setGesturesDisabled?.(false)
  }, [onChange, setGesturesDisabled])

  const panResponder = useRef(
    PanResponder.create({
      onPanResponderGrant: (e, gestureState) => {
        setGesturesDisabled?.(true)
        handleGesture(e, gestureState)
      },
      onPanResponderMove: handleGesture,
      onPanResponderRelease: handlePanResponderRelease,
      onPanResponderTerminate: handlePanResponderRelease,
      onMoveShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onStartShouldSetPanResponder: () => true
    })
  )

  return (
    <View>
      <View style={styles.root} {...panResponder.current.panHandlers}>
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
