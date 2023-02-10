import { forwardRef } from 'react'

import type { Text as TextInputProps } from 'react-native'
import { TextInput, View } from 'react-native'

import { makeStyles } from 'app/styles'

type PositionTimestampProps = Partial<TextInputProps>

const useStyles = makeStyles(({ palette, typography }) => ({
  timestamp: {
    width: 50,
    color: palette.neutral,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontByWeight.regular,
    flexShrink: 1,
    textAlign: 'right'
  }
}))

export const PositionTimestamp = forwardRef<TextInput, PositionTimestampProps>(
  (props, ref) => {
    const styles = useStyles()
    return (
      <View pointerEvents='none'>
        <TextInput
          ref={ref}
          style={styles.timestamp}
          numberOfLines={1}
          {...props}
        />
      </View>
    )
  }
)
