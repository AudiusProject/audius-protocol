import React from 'react'

import {
  FieldVisibility,
  Genre,
  PremiumConditions,
  decodeHashId
} from '@audius/common'
import cn from 'classnames'

import RepostFavoritesStats from 'components/repost-favorites-stats/RepostFavoritesStats'
import { Tile } from 'components/tile'
import { CardTitle } from 'components/track/CardTitle'
import styles from 'components/track/GiantTrackTile.module.css'
import { Text } from 'components/typography'
import trackPageStyles from 'pages/track-page/components/desktop/TrackPage.module.css'
import { profilePage } from 'utils/route'

import { TrackPageProps } from './track.page.server'

export function Page(props: TrackPageProps) {
  const { track } = props

  if (!track) {
    return null
  }

  // return (
  //   <GiantTrackTile
  //     loading={false}
  //     playing={false}
  //     previewing={false}
  //     trackTitle={track.title}
  //     trackId={decodeHashId(track.id)!}
  //     aiAttributionUserId={track.aiAttributionUserId!}
  //     userId={decodeHashId(track.userId) ?? 0}
  //     artistHandle={track.user.handle}
  //     coverArtSizes={{}}
  //     tags={track.tags ?? ''}
  //     description={track.description ?? ''}
  //     listenCount={track.playCount}
  //     duration={track.duration}
  //     released={track.releaseDate ?? ''}
  //     credits={track.creditsSplits ?? ''}
  //     genre={track.genre ?? ''}
  //     mood={track.mood ?? ''}
  //     repostCount={track.repostCount}
  //     saveCount={track.favoriteCount}
  //     isReposted={false}
  //     isOwner={false}
  //     currentUserId={0}
  //     isArtistPick={false}
  //     isSaved={false}
  //     badge={null}
  //     isUnlisted={track.isUnlisted}
  //     isPremium={!!track.isPremium}
  //     premiumConditions={track.premiumConditions as PremiumConditions}
  //     doesUserHaveAccess={false}
  //     isRemix={!!track.remixOf}
  //     isPublishing={false}
  //     fieldVisibility={track.fieldVisibility as FieldVisibility}
  //     coSign={null}
  //     following={false}
  //     // Actions
  //     onPlay={() => {}}
  //     onPreview={() => {}}
  //     onShare={() => {}}
  //     onRepost={() => {}}
  //     onSave={() => {}}
  //     onFollow={() => {}}
  //     onUnfollow={() => {}}
  //     onDownload={() => {}}
  //     onMakePublic={() => {}}
  //     onClickReposts={() => {}}
  //     onClickFavorites={() => {}}
  //   />
  // )

  const {
    title,
    id,
    coverArtSizes,
    _coSign,
    isUnlisted,
    remixOf,
    isPremium,
    genre,
    premiumConditions
  } = track

  return (
    <div className={trackPageStyles.contentWrapper}>
      <Tile className={styles.giantTrackTile} size='large' elevation='mid'>
        <div className={styles.topSection}>
          {/* <GiantArtwork
            trackId={id}
            coverArtSizes={coverArtSizes}
            coSign={_cosign}
            callback={onArtworkLoad}
          /> */}
          <div className={styles.infoSection}>
            <div className={styles.infoSectionHeader}>
              {/* <CardTitle
                isUnlisted={isUnlisted}
                isRemix={!!remixOf}
                isPremium={!!isPremium}
                isPodcast={genre === Genre.PODCASTS}
                premiumConditions={premiumConditions as PremiumConditions}
              /> */}
              <div className={styles.title}>
                <h1>{title}</h1>
              </div>
              <div className={styles.artistWrapper}>
                <div>
                  <span>By </span>
                  <a
                    href={profilePage(track.user.handle)}
                    className={cn(styles.root)}
                  >
                    <Text variant='inherit' className={styles.name}>
                      {track.user.handle}
                    </Text>
                  </a>
                </div>
              </div>
            </div>

            {/* <div className={cn(styles.statsSection)}>
              <RepostFavoritesStats
                isUnlisted={isUnlisted}
                repostCount={repostCount}
                saveCount={saveCount}
                onClickReposts={onClickReposts}
                onClickFavorites={onClickFavorites}
              />
              {isLongFormContent && isNewPodcastControlsEnabled
                ? renderListenCount()
                : null}
            </div> */}
          </div>
          {/* <div className={styles.badges}>
            {aiAttributionUserId ? (
              <Badge
                icon={<IconRobot />}
                className={styles.badgeAi}
                textLabel={messages.generatedWithAi}
              />
            ) : null}
            {badge ? (
              <Badge className={styles.badgePlacement} textLabel={badge} />
            ) : null}
          </div> */}
        </div>

        {/* <div className={cn(styles.bottomSection, fadeIn)}>
          <div className={styles.infoLabelsSection}>
            <InfoLabel
              className={styles.infoLabelPlacement}
              labelName='duration'
              labelValue={`${formatSeconds(duration)}`}
            />
            {renderReleased()}
            {renderGenre()}
            {renderMood()}
            {credits ? (
              <InfoLabel
                className={styles.infoLabelPlacement}
                labelName='credit'
                labelValue={credits}
              />
            ) : null}
          </div>
          {description ? (
            <UserGeneratedText
              component='h3'
              size='small'
              className={styles.description}
            >
              {description}
            </UserGeneratedText>
          ) : null}
        </div> */}
      </Tile>
    </div>
  )
}
