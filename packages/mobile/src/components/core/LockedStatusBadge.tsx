import { View } from 'react-native'

import { IconLock, IconLockUnlocked } from '@audius/harmony-native'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useColor } from 'app/utils/theme'

import { Text } from './Text'

const useStyles = makeStyles(({ palette, spacing, typography }) => ({
  root: {
    backgroundColor: palette.accentBlue,
    paddingHorizontal: spacing(2),
    paddingVertical: 1,
    borderRadius: spacing(10),
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing(1),
    flexDirection: 'row'
  },
  premium: {
    backgroundColor: palette.specialLightGreen
  },
  locked: {
    backgroundColor: palette.neutralLight4
  }
}))

export type LockedStatusBadgeProps = {
  locked: boolean
  variant?: 'premium' | 'gated'
  text?: string
  /** Whether the badge is colored when locked */
  coloredWhenLocked?: boolean
  iconSize?: 'medium' | 'small'
}

/** Renders a small badge with locked or unlocked icon */
export const LockedStatusBadge = (props: LockedStatusBadgeProps) => {
  const {
    locked,
    variant = 'gated',
    text,
    coloredWhenLocked = false,
    iconSize = 'medium'
  } = props
  const styles = useStyles()
  const staticWhite = useColor('white')
  const LockComponent = locked ? IconLock : IconLockUnlocked
  return (
    <View
      style={[
        styles.root,
        locked && !coloredWhenLocked
          ? styles.locked
          : variant === 'premium'
            ? styles.premium
            : null
      ]}
    >
      <LockComponent
        fill={staticWhite}
        width={iconSize === 'medium' ? spacing(3.5) : spacing(3)}
        height={iconSize === 'medium' ? spacing(3.5) : spacing(3)}
      />
      {text ? (
        <Text fontSize='xs' variant='label' color='white'>
          {text}
        </Text>
      ) : null}
    </View>
  )
}
