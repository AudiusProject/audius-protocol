import { useCallback, useMemo } from 'react'

import type { ID, Collectible } from '@audius/common'
import {
  accountSelectors,
  collectibleDetailsUIActions,
  modalsActions
} from '@audius/common'
import type { StyleProp, ViewStyle } from 'react-native'
import { ImageBackground, Text, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import LogoEth from 'app/assets/images/logoEth.svg'
import LogoSol from 'app/assets/images/logoSol.svg'
import IconPlay from 'app/assets/images/pbIconPlay.svg'
import { Tile } from 'app/components/core'
import { makeStyles, shadow } from 'app/styles'
const { setVisibility } = modalsActions
const { setCollectible } = collectibleDetailsUIActions
const getUserId = accountSelectors.getUserId

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
      left: spacing(3),
      height: spacing(6),
      width: spacing(6),
      borderRadius: 30,
      borderWidth: 1,
      borderColor: palette.neutralLight7,
      backgroundColor: palette.staticWhite,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadow()
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

  const dispatch = useDispatch()
  const accountId = useSelector(getUserId)

  const handlePress = useCallback(() => {
    dispatch(
      setCollectible({
        collectible,
        ownerId,
        isUserOnTheirProfile: accountId === ownerId
      })
    )
    dispatch(setVisibility({ modal: 'CollectibleDetails', visible: true }))
  }, [dispatch, collectible, accountId, ownerId])

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
