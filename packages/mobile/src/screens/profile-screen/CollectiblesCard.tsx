import { useCallback } from 'react'

import { Collectible } from 'audius-client/src/common/models/Collectible'
import { setCollectible } from 'audius-client/src/common/store/ui/collectible-details/slice'
import { setVisibility } from 'audius-client/src/common/store/ui/modals/slice'
import { ImageBackground, StyleProp, Text, View, ViewStyle } from 'react-native'

import IconPlay from 'app/assets/images/pbIconPlay.svg'
import { Tile } from 'app/components/core'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { makeStyles } from 'app/styles'

const messages = {
  ownedStamp: 'owned',
  createdStamp: 'created'
}

type UseStyleConfig = {
  isOwned: boolean
}

const useStyles = makeStyles(
  ({ typography, palette, spacing }, { isOwned }: UseStyleConfig) => ({
    content: {
      padding: spacing(4)
    },
    title: {
      ...typography.h2,
      textAlign: 'center',
      color: palette.neutral,
      marginTop: spacing(4)
    },
    image: {
      overflow: 'hidden',
      paddingBottom: '100%',
      width: '100%',
      borderRadius: 8
    },
    iconPlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center'
    },
    stamp: {
      position: 'absolute',
      bottom: spacing(3),
      left: spacing(3),
      paddingVertical: spacing(1),
      paddingHorizontal: spacing(2),
      borderRadius: 11,
      overflow: 'hidden',
      borderColor: palette.white,
      borderWidth: 1,
      backgroundColor: isOwned ? palette.secondary : palette.primary,
      fontSize: 10,
      fontFamily: typography.fontByWeight.bold,
      textTransform: 'uppercase',
      color: palette.white
    }
  })
)

type CollectiblesCardProps = {
  collectible: Collectible
  style?: StyleProp<ViewStyle>
}

export const CollectiblesCard = (props: CollectiblesCardProps) => {
  const { collectible, style } = props
  const { name, frameUrl, isOwned, mediaType, gifUrl } = collectible
  const styles = useStyles({ isOwned })
  const dispatchWeb = useDispatchWeb()

  const handlePress = useCallback(() => {
    dispatchWeb(setCollectible({ collectible }))
    dispatchWeb(setVisibility({ modal: 'CollectibleDetails', visible: true }))
  }, [dispatchWeb, collectible])

  const url = frameUrl ?? gifUrl

  return (
    <Tile
      styles={{ root: style, content: styles.content }}
      onPress={handlePress}
    >
      {url ? (
        <View>
          <ImageBackground style={styles.image} source={{ uri: url }}>
            {mediaType === 'VIDEO' ? (
              <View style={styles.iconPlay}>
                <IconPlay
                  height={48}
                  width={48}
                  fill='none'
                  fillSecondary='hsla(0,0%,100%,.6)'
                />
              </View>
            ) : null}
            <Text style={styles.stamp}>
              {isOwned ? messages.ownedStamp : messages.createdStamp}
            </Text>
          </ImageBackground>
        </View>
      ) : null}
      <Text style={styles.title}>{name}</Text>
    </Tile>
  )
}
