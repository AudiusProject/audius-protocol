import type { ReactNode } from 'react'

import type { StyleProp, ViewStyle } from 'react-native'
import { StyleSheet, View } from 'react-native'

import { IconCosign } from '@audius/harmony-native'
import { useThemeColors } from 'app/utils/theme'

import { Size } from './types'

type CoSignProps = {
  size: Size
  children: ReactNode
  style?: StyleProp<ViewStyle>
}

const styles = StyleSheet.create({
  check: {
    position: 'absolute'
  }
})

const layoutBySize = {
  [Size.TINY]: {
    position: {
      bottom: 2,
      right: -2
    },
    size: {
      height: 10,
      width: 10
    }
  },
  [Size.SMALL]: {
    position: {
      bottom: -4,
      right: -5
    },
    size: {
      height: 16,
      width: 16
    }
  },
  [Size.MEDIUM]: {
    position: {
      bottom: -3,
      right: -3
    },
    size: {
      height: 24,
      width: 24
    }
  },
  [Size.LARGE]: {
    position: {
      bottom: -8,
      right: -8
    },
    size: {
      height: 32,
      width: 32
    }
  },
  [Size.XLARGE]: {
    position: {
      bottom: -7,
      right: -7
    },
    size: {
      height: 44,
      width: 44
    }
  }
}

const CoSign = ({ size, children, style }: CoSignProps) => {
  const { primary, staticWhite } = useThemeColors()

  const { size: iconSize, position } = layoutBySize[size]

  return (
    <View style={[{ flex: 1 }, style]}>
      <View>{children}</View>
      <View style={[styles.check, position]}>
        <IconCosign fill={primary} fillSecondary={staticWhite} {...iconSize} />
      </View>
    </View>
  )
}

export default CoSign
