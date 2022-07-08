import { useCallback, useMemo } from 'react'

import { Collectible } from 'audius-client/src/common/models/Collectible'
import { ID } from 'audius-client/src/common/models/Identifiers'
import { getUserId } from 'audius-client/src/common/store/account/selectors'
import { setCollectible } from 'audius-client/src/common/store/ui/collectible-details/slice'
import { setVisibility } from 'audius-client/src/common/store/ui/modals/slice'
import { ImageBackground, StyleProp, Text, View, ViewStyle } from 'react-native'

import LogoEth from 'app/assets/images/logoEth.svg'
import LogoSol from 'app/assets/images/logoSol.svg'
import IconPlay from 'app/assets/images/pbIconPlay.svg'
import { Tile } from 'app/components/core'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles, shadow } from 'app/styles'

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
    chain: {
      position: 'absolute',
      bottom: spacing(3),
      right: spacing(3),
      height: spacing(6),
      width: spacing(6),
      borderRadius: 30,
      borderWidth: 1,
      borderColor: palette.neutralLight7,
      backgroundColor: palette.staticWhite,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadow()
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
  ownerId: ID
  style?: StyleProp<ViewStyle>
}

export const CollectiblesCard = (props: CollectiblesCardProps) => {
  const { collectible, style, ownerId } = props
  const { name, frameUrl, isOwned, mediaType, gifUrl, chain } = collectible

  const stylesConfig = useMemo(() => ({ isOwned }), [isOwned])
  const styles = useStyles(stylesConfig)

  const dispatchWeb = useDispatchWeb()
  const accountId = useSelectorWeb(getUserId)

  const handlePress = useCallback(() => {
    dispatchWeb(
      setCollectible({
        collectible,
        ownerId,
        isUserOnTheirProfile: accountId === ownerId
      })
    )
    dispatchWeb(setVisibility({ modal: 'CollectibleDetails', visible: true }))
  }, [dispatchWeb, collectible, accountId, ownerId])

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
            <View style={styles.chain}>
              {chain !== 'eth' ? (
                <LogoEth height={18} />
              ) : (
                <LogoSol height={16} />
              )}
            </View>
          </ImageBackground>
        </View>
      ) : null}
      <Text style={styles.title}>{name}</Text>
    </Tile>
  )
}
