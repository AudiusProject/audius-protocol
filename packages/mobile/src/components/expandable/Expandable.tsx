import type { ReactNode } from 'react'
import { useState, useCallback } from 'react'

import type { StyleProp, ViewStyle } from 'react-native'
import { Animated, LayoutAnimation, TouchableOpacity, View } from 'react-native'

import { makeStyles } from 'app/styles'

const useStyles = makeStyles(({ palette, spacing, typography }) => ({
  root: {
    display: 'flex'
  }
}))

const springToValue = ({
  animation,
  value
}: {
  animation: Animated.Value
  value: number
}) => {
  Animated.spring(animation, {
    toValue: value,
    tension: 160,
    friction: 15,
    useNativeDriver: true
  }).start()
}

export const useExpandable = () => {
  const [isExpanded, setIsExpanded] = useState(false)
  return { isExpanded, setIsExpanded, springToValue }
}

type ExpandableProps = {
  isExpanded: boolean
  setIsExpanded: (param: (expanded: boolean) => boolean) => void
  children?: ReactNode
  renderHeader?: () => ReactNode
  onExpand?: () => void
  style?: StyleProp<ViewStyle>
}

export const Expandable = ({
  isExpanded,
  setIsExpanded,
  children,
  onExpand,
  renderHeader,
  style: styleProp
}: ExpandableProps) => {
  const styles = useStyles()

  const toggleExpanded = useCallback(() => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(180, 'easeInEaseOut', 'opacity')
    )
    onExpand?.()
    setIsExpanded((expanded) => !expanded)
  }, [onExpand, setIsExpanded])

  return (
    <View style={styles.root}>
      <TouchableOpacity style={styleProp} onPress={toggleExpanded}>
        {renderHeader?.()}
      </TouchableOpacity>
      {isExpanded ? children : null}
    </View>
  )
}
