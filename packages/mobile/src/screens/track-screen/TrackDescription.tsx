import React, { useCallback, useState, useEffect } from 'react'

import type { LayoutChangeEvent } from 'react-native/types'
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

// Constants
const MAX_DESCRIPTION_LINES = 8
const DEFAULT_LINE_HEIGHT = spacing.xl

const messages = {
  seeMore: 'See More',
  seeLess: 'See Less'
}

type TrackDescriptionProps = {
  description: string
}

export const TrackDescription = ({ description }: TrackDescriptionProps) => {
  const { motion } = useTheme()
  const [isExpanded, setIsExpanded] = useState(false)
  const [showToggle, setShowToggle] = useState(false)

  // Track height of content for animation
  const [contentHeight, setContentHeight] = useState<number | null>(null)
  const containerHeight = useSharedValue<number | null>(null)

  // Animated style for container
  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      width: '100%',
      height: containerHeight.value !== null ? containerHeight.value : 'auto',
      overflow: 'hidden'
    }
  })

  // Toggle expanded state
  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev)
  }, [])

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

  // Early return if no description
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
        <PlainButton
          iconRight={isExpanded ? IconCaretUp : IconCaretDown}
          onPress={toggleExpanded}
          style={{ alignSelf: 'flex-start' }}
        >
          {isExpanded ? messages.seeLess : messages.seeMore}
        </PlainButton>
      )}
    </Flex>
  )
}
