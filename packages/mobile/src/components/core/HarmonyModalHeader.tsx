import type { ComponentType } from 'react'

import { View } from 'react-native'
import type { SvgProps } from 'react-native-svg'

import { Text } from 'app/components/core'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

const useStyles = makeStyles(({ spacing, palette }) => ({
  container: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: spacing(4),
    borderBottomColor: palette.neutralLight8,
    borderBottomWidth: 1
  },
  titleIcon: {
    marginRight: spacing(2)
  }
}))

type HarmonyModalHeaderProps = {
  icon: ComponentType<SvgProps>
  title: string
}

export const HarmonyModalHeader = ({
  icon: Icon,
  title
}: HarmonyModalHeaderProps) => {
  const styles = useStyles()
  const { neutralLight2 } = useThemeColors()

  return (
    <View style={styles.container}>
      <Icon
        style={styles.titleIcon}
        fill={neutralLight2}
        height={20}
        width={24}
      />
      <Text
        weight='heavy'
        color='neutralLight2'
        fontSize='xl'
        textTransform='uppercase'
      >
        {title}
      </Text>
    </View>
  )
}
