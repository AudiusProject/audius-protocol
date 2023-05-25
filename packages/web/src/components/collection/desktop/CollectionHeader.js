import { PureComponent } from 'react'

import {
  squashNewLines,
  formatSecondsAsText,
  formatDate,
  getPathFromAudiusUrl,
  isAudiusUrl
} from '@audius/common'
import cn from 'classnames'
import Linkify from 'linkify-react'

import { ReactComponent as IconFilter } from 'assets/img/iconFilter.svg'
import { ArtistPopover } from 'components/artist/ArtistPopover'
import { Input } from 'components/input'
import RepostFavoritesStats from 'components/repost-favorites-stats/RepostFavoritesStats'
import Skeleton from 'components/skeleton/Skeleton'
import InfoLabel from 'components/track/InfoLabel'
import UserBadges from 'components/user-badges/UserBadges'

import { ActionButtons } from './ActionButtons'
import { Artwork } from './Artwork'
import styles from './CollectionHeader.module.css'

const messages = {
  filter: 'Filter Tracks'
}

class CollectionHeader extends PureComponent {
  state = {
    filterText: '',
    // Stores state if the user publishes the playlist this "session"
    previouslyUnpublished: false,
    artworkLoading: true
  }

  unsetPreviouslyPublished = () => {
    this.setState({ previouslyUnpublished: false })
  }

  onFilterChange = (e) => {
    const newFilterText = e.target.value
    this.setState({
      filterText: newFilterText
    })
    this.props.onFilterChange(e)
  }

  onArtworkLoad = () => {
    this.setState({ artworkLoading: false })
  }

  renderStatsRow = (isLoading) => {
    if (isLoading) return null
    const { reposts, saves, onClickReposts, onClickFavorites } = this.props
    return (
      <RepostFavoritesStats
        isUnlisted={false}
        repostCount={reposts}
        saveCount={saves}
        onClickReposts={onClickReposts}
        onClickFavorites={onClickFavorites}
        className={styles.statsWrapper}
      />
    )
  }

  render() {
    const {
      collectionId,
      type,
      title,
      coverArtSizes,
      artistName,
      artistHandle,
      description,
      isOwner,
      modified,
      numTracks,
      duration,
      isPublished,
      tracksLoading,
      loading,
      playing,
      onClickArtistName,
      onClickDescriptionExternalLink,
      onClickDescriptionInternalLink,
      onPlay,
      variant,
      gradient,
      icon,
      imageOverride,
      userId
    } = this.props
    const { artworkLoading } = this.state
    const isLoading = loading || artworkLoading

    const fadeIn = {
      [styles.show]: !isLoading,
      [styles.hide]: isLoading
    }

    return (
      <div className={styles.collectionHeader}>
        <div className={styles.topSection}>
          <Artwork
            collectionId={collectionId}
            coverArtSizes={coverArtSizes}
            callback={this.onArtworkLoad}
            gradient={gradient}
            icon={icon}
            imageOverride={imageOverride}
          />
          <div className={styles.infoSection}>
            <div className={cn(styles.typeLabel, fadeIn)}>
              {type === 'playlist' && !isPublished ? 'private playlist' : type}
            </div>
            <div className={styles.title}>
              <h1 className={cn(fadeIn)}>{title}</h1>
              {isLoading && <Skeleton className={styles.skeleton} />}
            </div>
            {artistName && (
              <div className={styles.artistWrapper}>
                <div className={cn(fadeIn)}>
                  <span>By</span>
                  <ArtistPopover handle={artistHandle}>
                    <h2 className={styles.artist} onClick={onClickArtistName}>
                      {artistName}
                      <UserBadges
                        userId={userId}
                        badgeSize={16}
                        className={styles.verified}
                      />
                    </h2>
                  </ArtistPopover>
                </div>
                {isLoading && (
                  <Skeleton className={styles.skeleton} width='60%' />
                )}
              </div>
            )}
            <div className={cn(styles.infoLabelsSection, fadeIn)}>
              {modified && (
                <InfoLabel
                  className={styles.infoLabelPlacement}
                  labelName='modified'
                  labelValue={formatDate(modified)}
                />
              )}
              {duration ? (
                <InfoLabel
                  className={styles.infoLabelPlacement}
                  labelName='duration'
                  labelValue={formatSecondsAsText(duration)}
                />
              ) : null}
              <InfoLabel
                className={styles.infoLabelPlacement}
                labelName='tracks'
                labelValue={numTracks}
              />
            </div>
            <div className={cn(styles.description, fadeIn)}>
              <Linkify
                options={{
                  attributes: {
                    onClick: (event) => {
                      const url = event.currentTarget.href

                      if (isAudiusUrl(url)) {
                        const path = getPathFromAudiusUrl(url)
                        event.nativeEvent.preventDefault()
                        onClickDescriptionInternalLink(path ?? '/')
                      } else {
                        onClickDescriptionExternalLink(event)
                      }
                    }
                  },
                  target: (href, type, tokens) => {
                    return isAudiusUrl(href) ? '' : '_blank'
                  }
                }}
              >
                {squashNewLines(description)}
              </Linkify>
            </div>
            <div className={cn(styles.statsRow, fadeIn)}>
              {this.renderStatsRow(isLoading)}
            </div>
            <ActionButtons
              playing={playing}
              variant={variant}
              isOwner={isOwner}
              userId={userId}
              collectionId={collectionId}
              onPlay={onPlay}
              isEmptyPlaylist={numTracks === 0}
              tracksLoading={tracksLoading}
            />
          </div>
          {this.props.onFilterChange ? (
            <div className={styles.inputWrapper}>
              <Input
                placeholder={messages.filter}
                prefix={<IconFilter />}
                onChange={this.onFilterChange}
                value={this.state.filterText}
                size='small'
                variant='bordered'
              />
            </div>
          ) : null}
        </div>
      </div>
    )
  }
}

CollectionHeader.defaultProps = {
  index: 0,
  loading: false,
  playing: false,
  active: true,
  type: 'playlist',
  tags: [],
  description: '',

  isOwner: false,
  isAlbum: false,
  hasTracks: false,
  isPublished: false,

  reposts: 0,
  saves: 0,

  onPlay: () => {}
}

export default CollectionHeader
