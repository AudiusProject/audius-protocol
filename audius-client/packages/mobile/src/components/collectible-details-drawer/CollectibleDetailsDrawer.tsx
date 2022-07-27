import { useCallback, useMemo } from 'react'

import { Chain } from '@audius/common'
import { getUser } from 'audius-client/src/common/store/cache/users/selectors'
import {
  getCollectible,
  getCollectibleOwnerId
} from 'audius-client/src/common/store/ui/collectible-details/selectors'
import { ScrollView, View } from 'react-native'

import IconShare from 'app/assets/images/iconShare.svg'
import LogoEth from 'app/assets/images/logoEth.svg'
import LogoSol from 'app/assets/images/logoSol.svg'
import Button from 'app/components/button'
import { AppDrawer } from 'app/components/drawer'
import Text from 'app/components/text'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles'
import { getCollectiblesRoute } from 'app/utils/routes'
import share from 'app/utils/share'
import { useColor } from 'app/utils/theme'

import { ButtonType } from '../button/Button'

import { CollectibleDate } from './CollectibleDate'
import { CollectibleLink } from './CollectibleLink'
import { CollectibleMedia } from './CollectibleMedia'

const MODAL_NAME = 'CollectibleDetails'

export const messages = {
  owned: 'OWNED',
  created: 'CREATED',
  share: 'SHARE',
  linkToCollectible: 'Link To Collectible'
}

const useStyles = makeStyles(({ spacing, palette }) => ({
  root: {
    padding: spacing(6),
    paddingTop: spacing(2)
  },
  details: {
    marginTop: spacing(6)
  },
  detailsDescription: {
    marginBottom: spacing(6)
  },
  detailsTitle: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: spacing(6)
  },
  detailsStamp: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing(5),
    fontSize: 12
  },
  badge: {
    color: palette.white,
    textAlign: 'center',
    paddingVertical: spacing(1),
    paddingHorizontal: spacing(2),
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.white
  },
  created: { backgroundColor: palette.primary },
  owned: { backgroundColor: palette.secondary },
  chainIcon: {
    borderWidth: 1,
    borderColor: palette.neutralLight7,
    borderRadius: 14,
    padding: 2,
    marginLeft: spacing(2)
  },
  shareButtonContainer: { marginVertical: spacing(4) },
  shareButton: { width: '100%' },
  shareButtonIcon: { marginRight: 10 }
}))

const getHostname = (url: string) => {
  // React Native does not have URL builtin so use regex to get hostname
  // Example:
  // https://audius.co/nft -> audius.co

  // Second matched group which will be the hostname
  return url.match(/(https*:\/\/)([^/]+)/)?.[2] ?? ''
}

export const CollectibleDetailsDrawer = () => {
  const styles = useStyles()
  const collectible = useSelectorWeb(getCollectible)
  const ownerId = useSelectorWeb(getCollectibleOwnerId)
  const owner = useSelectorWeb((state) => getUser(state, { id: ownerId }))

  const formattedLink = useMemo(() => {
    const url = collectible?.externalLink
    return url ? getHostname(url) : ''
  }, [collectible])

  const handleShare = useCallback(() => {
    if (owner && collectible) {
      const url = getCollectiblesRoute(owner.handle, collectible.id)
      share({ url })
    }
  }, [owner, collectible])

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
                weight='bold'>
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
