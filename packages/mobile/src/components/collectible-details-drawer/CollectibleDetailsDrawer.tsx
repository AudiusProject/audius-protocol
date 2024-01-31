import { useCallback, useMemo } from 'react'

import {
  cacheUsersSelectors,
  collectibleDetailsUISelectors
} from '@audius/common/store'
import { ScrollView, View } from 'react-native'
import { useSelector } from 'react-redux'

import IconShare from 'app/assets/images/iconShare.svg'
import { Button, ChainLogo, Text } from 'app/components/core'
import { AppDrawer } from 'app/components/drawer'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { getCollectiblesRoute } from 'app/utils/routes'
import share from 'app/utils/share'

import { CollectibleDate } from './CollectibleDate'
import { CollectibleLink } from './CollectibleLink'
import { CollectibleMedia } from './CollectibleMedia'
const { getCollectible, getCollectibleOwnerId } = collectibleDetailsUISelectors
const { getUser } = cacheUsersSelectors

const MODAL_NAME = 'CollectibleDetails'

export const messages = {
  owned: 'OWNED',
  created: 'CREATED',
  share: 'SHARE',
  linkToCollectible: 'Link To Collectible',
  dateCreated: 'Date Created:',
  lastTransferred: 'Last Transferred:'
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
    marginBottom: spacing(6)
  },
  detailsStamp: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing(5)
  },
  badge: {
    color: palette.staticWhite,
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
  chainLogo: {
    marginLeft: spacing(2)
  },
  shareButton: {
    marginVertical: spacing(4)
  }
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
  const collectible = useSelector(getCollectible)
  const ownerId = useSelector(getCollectibleOwnerId)
  const owner = useSelector((state) => getUser(state, { id: ownerId }))

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

  return (
    <AppDrawer modalName={MODAL_NAME} isGestureSupported={false} isFullscreen>
      {collectible ? (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.root}>
          <CollectibleMedia collectible={collectible} />
          <View style={styles.details}>
            <Text style={styles.detailsTitle} variant='h2'>
              {collectible.name}
            </Text>
            <View style={styles.detailsStamp}>
              <Text
                style={[
                  styles.badge,
                  collectible.isOwned ? styles.owned : styles.created
                ]}
                fontSize='xs'
                weight='bold'
              >
                {collectible.isOwned ? messages.owned : messages.created}
              </Text>
              <ChainLogo chain={collectible.chain} style={styles.chainLogo} />
            </View>
            {!!collectible.dateCreated && (
              <CollectibleDate
                date={collectible.dateCreated}
                label={messages.dateCreated}
              />
            )}
            {!!collectible.dateLastTransferred && (
              <CollectibleDate
                date={collectible.dateLastTransferred}
                label={messages.lastTransferred}
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
            <Button
              style={styles.shareButton}
              variant='commonAlt'
              title={messages.share}
              size='large'
              fullWidth
              onPress={handleShare}
              iconPosition='left'
              icon={IconShare}
              IconProps={{
                height: spacing(6),
                width: spacing(6)
              }}
            />
          </View>
        </ScrollView>
      ) : null}
    </AppDrawer>
  )
}
