import { forwardRef } from 'react'

import {
  ScrollView as RNScrollView,
  ScrollViewProps as RNScrollViewProps
} from 'react-native'

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
