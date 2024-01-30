import type { ReactNode } from 'react'
import { useState, useCallback } from 'react'

import {
  accountSelectors,
  collectibleDetailsUIActions,
  modalsActions
} from '@audius/common'
import type { Collectible, ID } from '@audius/common/models'
import type { ImageStyle, StyleProp, ViewStyle } from 'react-native'
import { ImageBackground, Text, View } from 'react-native'
import { SvgUri } from 'react-native-svg'
import { useDispatch, useSelector } from 'react-redux'

import IconPlay from 'app/assets/images/pbIconPlay.svg'
import { ChainLogo, Tile } from 'app/components/core'
import { makeStyles } from 'app/styles'

import { CollectiblesCardErrorBoundary } from './CollectiblesCardErrorBoundary'
const { setVisibility } = modalsActions
const { setCollectible } = collectibleDetailsUIActions
const getUserId = accountSelectors.getUserId

const useStyles = makeStyles(({ typography, palette, spacing }) => ({
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
    left: spacing(3)
  }
}))

type CollectiblesCardProps = {
  collectible: Collectible
  ownerId: ID
  style?: StyleProp<ViewStyle>
}

type CollectibleImageProps = {
  uri: string
  style: StyleProp<ImageStyle>
  children?: ReactNode
}

const CollectibleImage = (props: CollectibleImageProps) => {
  const { children, style, uri } = props

  const isSvg = uri.match(/.*\.svg$/)
  const [size, setSize] = useState(0)

  return isSvg ? (
    <View
      onLayout={(e) => {
        setSize(e.nativeEvent.layout.width)
      }}
    >
      <SvgUri
        height={size}
        width={size}
        uri={uri}
        style={{ borderRadius: 8, overflow: 'hidden' }}
      >
        {children}
      </SvgUri>
    </View>
  ) : (
    <ImageBackground
      style={style}
      source={{
        uri
      }}
    >
      {children}
    </ImageBackground>
  )
}

export const CollectiblesCard = (props: CollectiblesCardProps) => {
  const { collectible, style, ownerId } = props
  const { name, frameUrl, mediaType, gifUrl, chain } = collectible

  const styles = useStyles()

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
    <CollectiblesCardErrorBoundary>
      <Tile
        styles={{ root: style, content: styles.content }}
        onPress={handlePress}
      >
        {url ? (
          <View>
            <CollectibleImage style={styles.image} uri={url}>
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
              <ChainLogo chain={chain} style={styles.chain} />
            </CollectibleImage>
          </View>
        ) : null}
        <Text style={styles.title}>{name}</Text>
      </Tile>
    </CollectiblesCardErrorBoundary>
  )
}
