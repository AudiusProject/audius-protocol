import { forwardRef } from 'react'

import type { ScrollViewProps as RNScrollViewProps } from 'react-native'
import { ScrollView as RNScrollView } from 'react-native'

import { PlayBarChin } from './PlayBarChin'

export type ScrollViewElement = RNScrollView

type ScrollViewProps = RNScrollViewProps

export const ScrollView = forwardRef<ScrollViewElement, ScrollViewProps>(
  function ScrolView(props, ref) {
    const { children, ...other } = props
    return (
      <RNScrollView {...other} ref={ref}>
        {children}
        <PlayBarChin />
      </RNScrollView>
    )
  }
)
