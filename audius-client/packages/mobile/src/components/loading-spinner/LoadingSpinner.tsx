import React from 'react'

import LottieView from 'lottie-react-native'
import { StyleSheet, ViewStyle } from 'react-native'

import loadingSpinner from 'app/assets/animations/loadingSpinner.json'
import { useThemeColors } from 'app/utils/theme'

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

const LoadingSpinner = (props: LoadingSpinnerProps) => {
  const { neutralLight4 } = useThemeColors()
  const color = props.color ?? neutralLight4
  return (
    <LottieView
      style={[styles.spinner, props.style]}
      source={loadingSpinner}
      autoPlay
      loop
      colorFilters={[
        {
          keypath: 'Shape Layer 1',
          color
        },
        {
          keypath: 'Shape Layer 2',
          color
        }
      ]}
    />
  )
}

export default LoadingSpinner
