import React, { useCallback, useState, useEffect, useRef } from 'react'

import type { Nullable } from '@audius/common/utils'
import type { View } from 'react-native'
import type {
  LayoutChangeEvent,
  ScrollView,
  FlatList
} from 'react-native/types'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'

import {
  Box,
  Flex,
  PlainButton,
  IconCaretDown,
  IconCaretUp,
  spacing,
  useTheme
} from '@audius/harmony-native'
import { UserGeneratedText } from 'app/components/core'

const MAX_DESCRIPTION_LINES = 6
const DEFAULT_LINE_HEIGHT = spacing.xl

const messages = {
  seeMore: 'See More',
  seeLess: 'See Less'
}

type TrackDescriptionProps = {
  description?: Nullable<string>
  scrollRef?: React.RefObject<ScrollView | FlatList>
}

export const TrackDescription = ({
  description,
  scrollRef
}: TrackDescriptionProps) => {
  const { motion } = useTheme()
  const [isExpanded, setIsExpanded] = useState(false)
  const [showToggle, setShowToggle] = useState(false)
  const toggleButtonRef = useRef<View>(null)

  // Track height of content for animation
  const [contentHeight, setContentHeight] = useState<number | null>(null)
  const containerHeight = useSharedValue<number | null>(null)

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      width: '100%',
      height: containerHeight.value !== null ? containerHeight.value : 'auto',
      overflow: 'hidden'
    }
  })

  const scrollToButton = useCallback(
    (pageY: number, height: number) => {
      if (scrollRef?.current) {
        if ('scrollTo' in scrollRef.current) {
          // ScrollView
          scrollRef.current.scrollTo({
            y: pageY - height / 2,
            animated: true
          })
        } else if ('scrollToOffset' in scrollRef.current) {
          // FlatList
          scrollRef.current.scrollToOffset({
            offset: pageY - height / 2,
            animated: true
          })
        }
      }
    },
    [scrollRef]
  )

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => {
      const newIsExpanded = !prev

      // If we're collapsing, scroll to center the toggle button
      if (!newIsExpanded && toggleButtonRef.current) {
        toggleButtonRef.current.measure(
          (
            x: number,
            y: number,
            width: number,
            height: number,
            pageX: number,
            pageY: number
          ) => {
            scrollToButton(pageY, height)
          }
        )
      }

      return newIsExpanded
    })
  }, [scrollToButton])

  // Handle layout measurement
  const handleContentLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const height = e.nativeEvent.layout.height

      // Store content height for calculations
      if (contentHeight === null || height > contentHeight) {
        setContentHeight(height)

        // If first measure, set container height
        if (containerHeight.value === null) {
          const initialHeight = Math.min(
            height,
            DEFAULT_LINE_HEIGHT * MAX_DESCRIPTION_LINES
          )
          containerHeight.value = initialHeight
        }
      }

      // Show toggle if content exceeds max lines
      if (height > DEFAULT_LINE_HEIGHT * MAX_DESCRIPTION_LINES) {
        setShowToggle(true)
      }
    },
    [contentHeight, containerHeight]
  )

  // Update height when expanded state changes
  useEffect(() => {
    if (contentHeight === null) return

    if (isExpanded) {
      // Expand to full content height
      containerHeight.value = withTiming(contentHeight, motion.expressive)
    } else {
      // Collapse to max lines height
      containerHeight.value = withTiming(
        Math.min(contentHeight, DEFAULT_LINE_HEIGHT * MAX_DESCRIPTION_LINES),
        motion.expressive
      )
    }
  }, [isExpanded, contentHeight, containerHeight, motion.expressive])

  if (!description) return null

  return (
    <Flex gap='m'>
      <Animated.View style={animatedContainerStyle}>
        <Box onLayout={handleContentLayout}>
          <UserGeneratedText source={'track page'} variant='body' size='s'>
            {description}
          </UserGeneratedText>
        </Box>
      </Animated.View>

      {showToggle && (
        <Flex ref={toggleButtonRef}>
          <PlainButton
            iconRight={isExpanded ? IconCaretUp : IconCaretDown}
            onPress={toggleExpanded}
            style={{ alignSelf: 'flex-start' }}
          >
            {isExpanded ? messages.seeLess : messages.seeMore}
          </PlainButton>
        </Flex>
      )}
    </Flex>
  )
}
