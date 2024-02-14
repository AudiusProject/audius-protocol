import type { ReactNode } from 'react'

import { View } from 'react-native'

import { IconArrowRight } from '@audius/harmony-native'
import { GradientText, Shadow, Text } from 'app/components/core'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useThemeColors } from 'app/utils/theme'

const messages = {
  tier: 'Tier',
  minAmount: '$AUDIO',
  current: 'Current Tier'
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  root: {
    width: '100%',
    marginVertical: spacing(8)
  },
  container: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing(10),
    paddingHorizontal: spacing(4),
    borderColor: palette.neutralLight7,
    borderWidth: 2,
    borderRadius: spacing(4),
    backgroundColor: palette.neutralLight10,
    flexDirection: 'column'
  },
  current: {
    borderColor: palette.secondary,
    borderWidth: 4
  },
  currentIndicator: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  currentText: {
    color: palette.secondary,
    fontFamily: typography.fontByWeight.heavy,
    fontSize: typography.fontSize.medium,
    textTransform: 'uppercase'
  },
  currentPointer: {
    transform: [{ rotate: '90deg' }],
    marginBottom: spacing(2)
  },
  tier: {
    color: palette.neutralLight6,
    fontFamily: typography.fontByWeight.bold,
    fontSize: typography.fontSize.medium,
    textTransform: 'uppercase'
  },
  title: {
    margin: 8,
    fontFamily: typography.fontByWeight.heavy,
    fontSize: 28,
    textTransform: 'uppercase'
  },
  minAmount: {
    color: palette.secondary,
    fontFamily: typography.fontByWeight.bold,
    fontSize: typography.fontSize.small,
    lineHeight: spacing(4)
  },
  separator: {
    height: 1,
    width: 80,
    backgroundColor: palette.neutralLight6,
    marginVertical: 24
  }
}))

type TierProps = {
  tierNumber: number
  title: string
  colors: string[]
  minAmount: number
  image: ReactNode
  isCurrentTier: boolean
}

export const Tier = ({
  tierNumber,
  title,
  colors,
  minAmount,
  image,
  isCurrentTier
}: TierProps) => {
  const styles = useStyles()
  const { secondary } = useThemeColors()

  const renderTierBody = () => {
    return (
      <>
        <View style={[styles.container, isCurrentTier && styles.current]}>
          <Text style={styles.tier}>{`${messages.tier} ${tierNumber}`}</Text>
          <GradientText style={styles.title} colors={colors}>
            {title}
          </GradientText>
          <Text
            style={styles.minAmount}
          >{`${minAmount}+ ${messages.minAmount}`}</Text>
          <View style={styles.separator} />
          {image}
        </View>
      </>
    )
  }

  return isCurrentTier ? (
    <View style={styles.root}>
      <View style={styles.currentIndicator}>
        <Text style={styles.currentText}>{messages.current}</Text>
        <IconArrowRight
          height={20}
          width={20}
          style={styles.currentPointer}
          fill={secondary}
        />
      </View>
      <Shadow
        offset={{ height: 0, width: 0 }}
        radius={spacing(2)}
        color='rgb(162,47,235)'
        opacity={0.4}
      >
        {renderTierBody()}
      </Shadow>
    </View>
  ) : (
    <View style={styles.root}>{renderTierBody()}</View>
  )
}
