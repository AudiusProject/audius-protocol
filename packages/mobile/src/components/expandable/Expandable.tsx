import type { ReactNode } from 'react'

import type { StyleProp, ViewStyle } from 'react-native'
import { TouchableOpacity } from 'react-native'

import { Flex } from '@audius/harmony-native'

type ExpandableProps = {
  expanded: boolean
  children?: ReactNode
  renderHeader?: () => ReactNode
  onToggleExpand?: () => void
  style?: StyleProp<ViewStyle>
}

/**
 * Wraps content in an expandable container. Pressing the header
 * will expand/collapse the content.
 *
 * @param expanded whether the content is expanded
 * @param onToggleExpand callback when the header is pressed
 * @param renderHeader renders the header
 * @param style style of the container
 */
export const Expandable = ({
  expanded,
  children,
  onToggleExpand,
  renderHeader,
  style: styleProp
}: ExpandableProps) => {
  return (
    <Flex style={styleProp}>
      <TouchableOpacity onPress={onToggleExpand}>
        {renderHeader?.()}
      </TouchableOpacity>
      {expanded ? children : null}
    </Flex>
  )
}
