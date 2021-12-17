import React from 'react'

import LottieView from 'lottie-react-native'
import { StyleSheet, ViewStyle } from 'react-native'

import loadingSpinner from 'app/assets/animations/loadingSpinner.json'

const styles = StyleSheet.create({
  spinner: {
    height: 24,
    width: 24
  }
})

type LoadingSpinnerProps = {
  /**
   * The color of the spinner
   */
  color?: string
  /**
   * Style to apply to the spinner
   */
  style?: ViewStyle
}

const LoadingSpinner = ({ color, style }: LoadingSpinnerProps) => {
  return (
    <LottieView
      style={[styles.spinner, style]}
      source={loadingSpinner}
      autoPlay
      loop
      colorFilters={
        color
          ? [
              {
                keypath: 'Shape Layer 1',
                color
              },
              {
                keypath: 'Shape Layer 2',
                color
              }
            ]
          : undefined
      }
    />
  )
}

export default LoadingSpinner
