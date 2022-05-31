import IconFollowing from 'app/assets/images/iconFollowing.svg'
import { Text, Tile } from 'app/components/core'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

const messages = {
  mutuals: 'Mutuals'
}

const useStyles = makeStyles(({ spacing }) => ({
  root: { flexGrow: 1 },
  tile: { height: 50 },
  content: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  icon: {
    marginRight: spacing(2)
  }
}))

export const MutualsButtonTile = () => {
  const styles = useStyles()
  const { neutral } = useThemeColors()

  return (
    <Tile
      styles={{ root: styles.root, tile: styles.tile, content: styles.content }}
    >
      <IconFollowing
        height={20}
        width={20}
        fill={neutral}
        style={styles.icon}
      />
      <Text variant='h3' noGutter>
        {messages.mutuals}
      </Text>
    </Tile>
  )
}
