import type { ComponentType, ReactNode } from 'react'

import type { TextStyle, ViewStyle } from 'react-native'
import { View } from 'react-native'
import type { SvgProps } from 'react-native-svg'

import { GradientIcon, GradientText } from 'app/components/core'
import type { StylesProp } from 'app/styles'
import { makeStyles } from 'app/styles'

type ScreenHeaderProps = {
  children?: ReactNode
  text: string
  styles?: StylesProp<{ root: ViewStyle; header: TextStyle; icon: ViewStyle }>
  icon?: ComponentType<SvgProps>
  iconProps?: SvgProps
}

const useStyles = makeStyles(({ palette, spacing, typography }) => ({
  root: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: palette.white,
    height: 40,
    borderBottomWidth: 1,
    borderBottomColor: palette.neutralLight8,
    paddingHorizontal: spacing(4),
    borderTopWidth: 1,
    borderTopColor: palette.neutralLight8,
    elevation: 3,
    shadowColor: palette.neutralDark1,
    shadowOpacity: 0.12,
    shadowOffset: { height: 2, width: 0 },
    shadowRadius: 2
  },
  header: {
    fontSize: typography.fontSize.xl,
    lineHeight: 25,
    fontFamily: typography.fontByWeight.heavy
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerIcon: {
    marginRight: spacing(2)
  }
}))

export const ScreenHeader = (props: ScreenHeaderProps) => {
  const { children, text, styles: stylesProp, icon, iconProps } = props
  const styles = useStyles()

  return (
    <View style={[styles.root, stylesProp?.root]}>
      <View style={styles.headerContent}>
        {icon ? (
          <GradientIcon
            icon={icon}
            height={20}
            style={[styles.headerIcon, stylesProp?.icon]}
            {...iconProps}
          />
        ) : null}
        <GradientText
          accessibilityRole='header'
          style={[styles.header, stylesProp?.header]}
        >
          {text}
        </GradientText>
      </View>
      {children}
    </View>
  )
}
