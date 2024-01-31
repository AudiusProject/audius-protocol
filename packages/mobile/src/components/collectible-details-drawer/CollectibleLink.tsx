import { TouchableOpacity, View } from 'react-native'

import { IconLink } from '@audius/harmony-native'
import { Text, useLink } from 'app/components/core'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useThemeColors } from 'app/utils/theme'

const useStyles = makeStyles(({ spacing }) => ({
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing(5)
  },
  linkText: {
    textDecorationLine: 'underline'
  },
  linkIcon: {
    marginRight: spacing(1)
  }
}))

type CollectiblLinkProps = {
  url: string
  text: string
}

export const CollectibleLink = (props: CollectiblLinkProps) => {
  const { url, text } = props
  const styles = useStyles()
  const { onPress } = useLink(url)

  const { secondary } = useThemeColors()

  return (
    <TouchableOpacity onPress={onPress}>
      <View style={styles.link}>
        <IconLink
          fill={secondary}
          style={styles.linkIcon}
          height={spacing(4)}
          width={spacing(4)}
        />
        <Text style={styles.linkText} color='secondary' weight='demiBold'>
          {text}
        </Text>
      </View>
    </TouchableOpacity>
  )
}
