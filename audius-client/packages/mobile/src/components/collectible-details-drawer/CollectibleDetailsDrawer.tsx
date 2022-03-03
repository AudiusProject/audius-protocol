import { useCallback, useMemo } from 'react'

import { Chain } from 'audius-client/src/common/models/Chain'
import { getUserHandle } from 'audius-client/src/common/store/account/selectors'
import { getCollectible } from 'audius-client/src/common/store/ui/collectible-details/selectors'
import { ScrollView, StyleSheet, View } from 'react-native'
import Config from 'react-native-config'

import IconShare from 'app/assets/images/iconShare.svg'
import LogoEth from 'app/assets/images/logoEth.svg'
import LogoSol from 'app/assets/images/logoSol.svg'
import Button from 'app/components/button'
import { AppDrawer } from 'app/components/drawer'
import Text from 'app/components/text'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { ThemeColors, useThemedStyles } from 'app/hooks/useThemedStyles'
import share from 'app/utils/share'
import { useColor } from 'app/utils/theme'

import { ButtonType } from '../button/Button'

import { CollectibleDate } from './CollectibleDate'
import { CollectibleLink } from './CollectibleLink'
import { CollectibleMedia } from './CollectibleMedia'
import { getHash } from './helpers'

const MODAL_NAME = 'CollectibleDetails'
const AUDIUS_URL = Config.AUDIUS_URL

export const messages = {
  owned: 'OWNED',
  created: 'CREATED',
  share: 'SHARE',
  linkToCollectible: 'Link To Collectible'
}

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    root: {
      padding: 24,
      paddingTop: 8
    },

    details: {
      marginTop: 24
    },

    detailsDescription: {
      marginBottom: 24
    },

    detailsTitle: {
      textAlign: 'center',
      fontSize: 16,
      marginBottom: 24
    },

    detailsStamp: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      fontSize: 12
    },

    badge: {
      color: themeColors.white,
      textAlign: 'center',
      paddingTop: 4,
      paddingRight: 8,
      paddingBottom: 4,
      paddingLeft: 8,
      borderRadius: 14,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: themeColors.white
    },

    created: {
      backgroundColor: themeColors.primary
    },

    owned: {
      backgroundColor: themeColors.secondary
    },

    chainIcon: {
      borderWidth: 1,
      borderColor: themeColors.neutralLight7,
      borderRadius: 14,
      padding: 2,
      marginLeft: 8
    },

    shareButtonContainer: {
      marginVertical: 16
    },

    shareButton: {
      width: '100%'
    },

    shareButtonIcon: {
      marginRight: 10
    }
  })

const getHostname = (url: string) => {
  // React Native does not have URL builtin so use regex to get hostname
  // Example:
  // https://audius.co/nft -> audius.co

  // Second matched group which will be the hostname
  return url.match(/(https*:\/\/)([^/]+)/)?.[2] ?? ''
}

export const CollectibleDetailsDrawer = () => {
  const handle = useSelectorWeb(getUserHandle)
  const collectible = useSelectorWeb(getCollectible)

  const formattedLink = useMemo(() => {
    const url = collectible?.externalLink
    return url ? getHostname(url) : ''
  }, [collectible])

  const handleShare = useCallback(() => {
    if (collectible) {
      const url = `${AUDIUS_URL}/${handle}/collectibles/${getHash(
        collectible.id
      )}`
      share({ url })
    }
  }, [handle, collectible])

  const styles = useThemedStyles(createStyles)

  const ChainLogo = collectible?.chain === Chain.Eth ? LogoEth : LogoSol
  const buttonIconColor = useColor('neutralLight4')

  return (
    <AppDrawer modalName={MODAL_NAME} isGestureSupported={false} isFullscreen>
      {collectible && (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.root}>
          <CollectibleMedia collectible={collectible} />

          <View style={styles.details}>
            <Text style={styles.detailsTitle} weight='bold'>
              {collectible.name}
            </Text>
            <View style={styles.detailsStamp}>
              <Text
                style={[
                  styles.badge,
                  collectible.isOwned ? styles.owned : styles.created
                ]}
                weight='bold'
              >
                {collectible.isOwned ? messages.owned : messages.created}
              </Text>

              <View style={styles.chainIcon}>
                <ChainLogo height={20} width={20} />
              </View>
            </View>

            {!!collectible.dateCreated && (
              <CollectibleDate
                date={collectible.dateCreated}
                label='Date Created:'
              />
            )}

            {!!collectible.dateLastTransferred && (
              <CollectibleDate
                date={collectible.dateLastTransferred}
                label='Last Transferred:'
              />
            )}

            <Text style={styles.detailsDescription}>
              {collectible.description}
            </Text>

            {!!collectible.externalLink && (
              <CollectibleLink
                url={collectible.externalLink}
                text={formattedLink}
              />
            )}
            {!!collectible.permaLink && (
              <CollectibleLink
                url={collectible.permaLink}
                text={messages.linkToCollectible}
              />
            )}

            <View style={styles.shareButtonContainer}>
              <Button
                type={ButtonType.COMMON}
                title={messages.share}
                onPress={handleShare}
                containerStyle={styles.shareButton}
                iconPosition={'left'}
                style={{ padding: 8 }}
                icon={
                  <IconShare
                    style={styles.shareButtonIcon}
                    fill={buttonIconColor}
                  />
                }
              />
            </View>
          </View>
        </ScrollView>
      )}
    </AppDrawer>
  )
}
