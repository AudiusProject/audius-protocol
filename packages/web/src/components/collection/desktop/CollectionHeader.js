import { PureComponent, useState, useEffect } from 'react'

import {
  Button,
  ButtonType,
  IconPause,
  IconPlay,
  IconRepost,
  IconHeart,
  IconKebabHorizontal,
  IconShare,
  IconPencil,
  IconRocket
} from '@audius/stems'
import cn from 'classnames'
import Linkify from 'linkifyjs/react'
import PropTypes from 'prop-types'

import { ReactComponent as IconFilter } from 'assets/img/iconFilter.svg'
import { Variant } from 'common/models/Collection'
import { SquareSizes } from 'common/models/ImageSizes'
import { SmartCollectionVariant } from 'common/models/SmartCollectionVariant'
import { squashNewLines } from 'common/utils/formatUtil'
import { formatSecondsAsText, formatDate } from 'common/utils/timeUtil'
import { ArtistPopover } from 'components/artist/ArtistPopover'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import { Input } from 'components/input'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import Menu from 'components/menu/Menu'
import RepostFavoritesStats from 'components/repost-favorites-stats/RepostFavoritesStats'
import Skeleton from 'components/skeleton/Skeleton'
import Toast from 'components/toast/Toast'
import Tooltip from 'components/tooltip/Tooltip'
import InfoLabel from 'components/track/InfoLabel'
import UserBadges from 'components/user-badges/UserBadges'
import { useCollectionCoverArt } from 'hooks/useCollectionCoverArt'

import styles from './CollectionHeader.module.css'

const BUTTON_COLLAPSE_WIDTHS = {
  first: 1148,
  second: 1184,
  third: 1274,
  fourth: 1374
}

// Toast timeouts in ms
const REPOST_TIMEOUT = 1000

const messages = {
  shareButton: 'SHARE',
  repostButton: 'REPOST',
  repostButtonReposted: 'REPOSTED',
  favoriteButton: 'FAVORITE',
  favoriteButtonFavorited: 'FAVORITED',
  editButton: 'EDIT',
  publishButton: 'MAKE PUBLIC',
  publishingButton: 'PUBLISHING',
  reposted: 'Reposted!',
  repost: 'Repost',
  unrepost: 'Unrepost',
  favorite: 'Favorite',
  unfavorite: 'Unfavorite',
  playlistViewable: 'Your playlist can now be viewed by others!',
  filter: 'Filter Tracks'
}

const PlayButton = (props) => {
  return props.playing ? (
    <Button
      className={cn(
        styles.playAllButton,
        styles.buttonSpacing,
        styles.buttonFormatting
      )}
      textClassName={styles.buttonTextFormatting}
      type={ButtonType.PRIMARY_ALT}
      text='PAUSE'
      leftIcon={<IconPause />}
      onClick={props.onPlay}
      widthToHideText={BUTTON_COLLAPSE_WIDTHS.first}
      minWidth={132}
    />
  ) : (
    <Button
      className={cn(styles.playAllButton, styles.buttonSpacing)}
      textClassName={styles.buttonTextFormatting}
      type={ButtonType.PRIMARY_ALT}
      text='PLAY'
      leftIcon={<IconPlay />}
      onClick={props.onPlay}
      widthToHideText={BUTTON_COLLAPSE_WIDTHS.first}
      minWidth={132}
    />
  )
}

const repostButtonText = (isReposted) =>
  isReposted ? messages.repostButtonReposted : messages.repostButton
const favoriteButtonText = (isFavorited) =>
  isFavorited ? messages.favoriteButtonFavorited : messages.favoriteButton

const ViewerHasTracksButtons = (props) => {
  return (
    <>
      <PlayButton playing={props.playing} onPlay={props.onPlay} />
      <Button
        className={cn(styles.buttonSpacing, styles.buttonFormatting)}
        textClassName={styles.buttonTextFormatting}
        type={ButtonType.COMMON}
        text={messages.shareButton}
        leftIcon={<IconShare />}
        onClick={props.onShare}
        widthToHideText={BUTTON_COLLAPSE_WIDTHS.second}
      />
      <Toast
        text={messages.reposted}
        disabled={props.isReposted}
        delay={REPOST_TIMEOUT}
        fillParent={false}>
        <Tooltip
          disabled={props.isOwner || props.reposts === 0}
          text={props.isReposted ? messages.unrepost : messages.repost}>
          <div className={styles.buttonSpacing}>
            <Button
              type={props.isReposted ? ButtonType.SECONDARY : ButtonType.COMMON}
              className={styles.buttonFormatting}
              textClassName={styles.buttonTextFormatting}
              text={repostButtonText(props.isReposted)}
              leftIcon={<IconRepost />}
              onClick={props.onRepost}
              widthToHideText={BUTTON_COLLAPSE_WIDTHS.third}
            />
          </div>
        </Tooltip>
      </Toast>
      <Tooltip
        disabled={props.isOwner || props.saves === 0}
        text={props.isSaved ? messages.unfavorite : messages.favorite}>
        <div className={styles.buttonSpacing}>
          <Button
            type={props.isSaved ? ButtonType.SECONDARY : ButtonType.COMMON}
            className={styles.buttonFormatting}
            textClassName={styles.buttonTextFormatting}
            text={favoriteButtonText(props.isSaved)}
            leftIcon={<IconHeart />}
            onClick={props.onSave}
            widthToHideText={BUTTON_COLLAPSE_WIDTHS.fourth}
          />
        </div>
      </Tooltip>
      <span>
        <Menu {...props.overflowMenu}>
          {(ref, triggerPopup) => (
            <div className={cn(styles.buttonSpacing)} ref={ref}>
              <Button
                className={cn(styles.buttonFormatting)}
                leftIcon={<IconKebabHorizontal />}
                onClick={triggerPopup}
                text={null}
                textClassName={styles.buttonTextFormatting}
                type={ButtonType.COMMON}
              />
            </div>
          )}
        </Menu>
      </span>
    </>
  )
}

const ViewerNoTracksButtons = (props) => {
  return (
    <>
      <Button
        className={cn(styles.buttonSpacing, styles.buttonFormatting)}
        textClassName={styles.buttonTextFormatting}
        type={ButtonType.DISABLED}
        text={messages.shareButton}
        leftIcon={<IconShare />}
        onClick={props.onShare}
        widthToHideText={BUTTON_COLLAPSE_WIDTHS.second}
      />
      <Button
        className={cn(styles.buttonSpacing, styles.buttonFormatting)}
        textClassName={styles.buttonTextFormatting}
        type={ButtonType.DISABLED}
        text={repostButtonText(props.isReposted)}
        leftIcon={<IconRepost />}
        onClick={props.onRepost}
        widthToHideText={BUTTON_COLLAPSE_WIDTHS.third}
      />
      <Button
        className={cn(styles.buttonSpacing, styles.buttonFormatting)}
        textClassName={styles.buttonTextFormatting}
        type={ButtonType.DISABLED}
        text={favoriteButtonText(props.isSaved)}
        leftIcon={<IconHeart />}
        onClick={props.onSave}
        widthToHideText={BUTTON_COLLAPSE_WIDTHS.fourth}
      />
      <span>
        <Menu {...props.overflowMenu}>
          {(ref, triggerPopup) => (
            <div className={cn(styles.buttonSpacing)} ref={ref}>
              <Button
                className={cn(styles.buttonFormatting)}
                leftIcon={<IconKebabHorizontal />}
                textClassName={styles.buttonTextFormatting}
                text={null}
                onClick={triggerPopup}
                type={ButtonType.COMMON}
                widthToHideText={1400}
              />
            </div>
          )}
        </Menu>
      </span>
    </>
  )
}

const SmartCollectionButtons = (props) => {
  return (
    <>
      <PlayButton playing={props.playing} onPlay={props.onPlay} />
      {/* Audio NFT Playlist share button */}
      {props.playlistId === SmartCollectionVariant.AUDIO_NFT_PLAYLIST ? (
        <Button
          className={cn(styles.buttonSpacing, styles.buttonFormatting)}
          textClassName={styles.buttonTextFormatting}
          type={ButtonType.COMMON}
          text={messages.shareButton}
          leftIcon={<IconShare />}
          onClick={props.onShare}
          widthToHideText={BUTTON_COLLAPSE_WIDTHS.second}
        />
      ) : null}
      {props.onSave ? (
        <Tooltip
          disabled={props.isOwner || props.saves === 0}
          text={props.isSaved ? messages.unfavorite : messages.favorite}>
          <div className={styles.buttonSpacing}>
            <Button
              className={cn(styles.buttonSpacing, styles.buttonFormatting)}
              textClassName={styles.buttonTextFormatting}
              type={props.isSaved ? ButtonType.SECONDARY : ButtonType.COMMON}
              text={favoriteButtonText(props.isSaved)}
              leftIcon={<IconHeart />}
              onClick={props.onSave}
              widthToHideText={BUTTON_COLLAPSE_WIDTHS.second}
            />
          </div>
        </Tooltip>
      ) : null}
    </>
  )
}

const OwnerNoTracksButtons = (props) => {
  return (
    <>
      <Button
        className={cn(styles.buttonSpacing, styles.buttonFormatting)}
        textClassName={styles.buttonTextFormatting}
        type={ButtonType.COMMON}
        text={messages.editButton}
        leftIcon={<IconPencil />}
        onClick={props.onEdit}
        widthToHideText={BUTTON_COLLAPSE_WIDTHS.second}
      />
    </>
  )
}

const OwnerNotPublishedButtons = (props) => {
  return (
    <>
      <PlayButton playing={props.playing} onPlay={props.onPlay} />
      {props.isAlbum ? null : (
        <Button
          className={cn(styles.buttonSpacing, styles.buttonFormatting)}
          textClassName={styles.buttonTextFormatting}
          type={props.isPublishing ? ButtonType.DISABLED : ButtonType.COMMON}
          text={
            props.isPublishing
              ? messages.publishingButton
              : messages.publishButton
          }
          leftIcon={
            props.isPublishing ? (
              <LoadingSpinner className={styles.spinner} />
            ) : (
              <IconRocket />
            )
          }
          onClick={props.isPublishing ? () => {} : props.onPublish}
          widthToHideText={BUTTON_COLLAPSE_WIDTHS.second}
        />
      )}
      <Button
        className={cn(styles.buttonSpacing, styles.buttonFormatting)}
        textClassName={styles.buttonTextFormatting}
        type={ButtonType.COMMON}
        text={messages.editButton}
        leftIcon={<IconPencil />}
        onClick={props.onEdit}
        widthToHideText={BUTTON_COLLAPSE_WIDTHS.third}
      />
    </>
  )
}

const OwnerPublishedButtons = (props) => {
  const [showShareableToast, setShowShareableToast] = useState(false)

  const { isPublished, isPreviouslyUnpublished, unsetPreviouslyPublished } =
    props
  useEffect(() => {
    if (isPublished && isPreviouslyUnpublished) {
      setShowShareableToast(true)
      setTimeout(() => {
        setShowShareableToast(false)
        unsetPreviouslyPublished()
      }, 3000)
    }
  }, [isPreviouslyUnpublished, isPublished, unsetPreviouslyPublished])

  return (
    <>
      <PlayButton playing={props.playing} onPlay={props.onPlay} />
      <Toast
        text={messages.playlistViewable}
        fillParent={false}
        placement='top'
        firesOnClick={false}
        open={showShareableToast}>
        <Button
          className={cn(styles.buttonSpacing, styles.buttonFormatting)}
          textClassName={styles.buttonTextFormatting}
          type={ButtonType.COMMON}
          text={messages.shareButton}
          leftIcon={<IconShare />}
          onClick={props.onShare}
          widthToHideText={BUTTON_COLLAPSE_WIDTHS.second}
        />
      </Toast>
      <Button
        className={cn(styles.buttonSpacing, styles.buttonFormatting)}
        textClassName={styles.buttonTextFormatting}
        type={ButtonType.COMMON}
        text={messages.editButton}
        leftIcon={<IconPencil />}
        onClick={props.onEdit}
        widthToHideText={BUTTON_COLLAPSE_WIDTHS.third}
      />
      <span>
        <Menu {...props.overflowMenu}>
          {(ref, triggerPopup) => (
            <div className={cn(styles.buttonSpacing)} ref={ref}>
              <Button
                className={cn(styles.buttonFormatting)}
                leftIcon={<IconKebabHorizontal />}
                onClick={triggerPopup}
                text={null}
                textClassName={styles.buttonTextFormatting}
                type={ButtonType.COMMON}
              />
            </div>
          )}
        </Menu>
      </span>
    </>
  )
}

const Buttons = (props) => {
  const overflowMenuExtraItems = []
  if (!props.isOwner) {
    overflowMenuExtraItems.push({
      text: props.isFollowing ? 'Unfollow User' : 'Follow User',
      onClick: () =>
        setTimeout(
          () => (props.isFollowing ? props.onUnfollow() : props.onFollow()),
          0
        )
    })
  }

  const overflowMenu = {
    menu: {
      type: props.type,
      playlistId: props.playlistId,
      playlistName: props.playlistName,
      handle: props.ownerHandle,
      isFavorited: props.isSaved,
      mount: 'page',
      isOwner: props.isOwner,
      includeEmbed: true,
      includeSave: false,
      includeVisitPage: false,
      isPublic: props.isPublished,
      extraMenuItems: overflowMenuExtraItems
    }
  }

  const buttonProps = {
    ...props,
    overflowMenu
  }

  let buttons
  if (props.variant === Variant.SMART) {
    buttons = <SmartCollectionButtons {...buttonProps} />
  } else {
    if (props.isOwner) {
      if (props.hasTracks && props.isPublished) {
        buttons = <OwnerPublishedButtons {...buttonProps} />
      } else if (props.hasTracks && !props.isPublished) {
        buttons = <OwnerNotPublishedButtons {...buttonProps} />
      } else {
        buttons = <OwnerNoTracksButtons {...buttonProps} />
      }
    } else {
      if (props.hasTracks) {
        buttons = <ViewerHasTracksButtons {...buttonProps} />
      } else {
        buttons = <ViewerNoTracksButtons {...buttonProps} />
      }
    }
  }
  return buttons
}

const Artwork = ({
  collectionId,
  coverArtSizes,
  callback,
  gradient,
  icon: Icon,
  imageOverride
}) => {
  const image = useCollectionCoverArt(
    collectionId,
    coverArtSizes,
    SquareSizes.SIZE_1000_BY_1000
  )
  useEffect(() => {
    // If there's a gradient, this is a smart collection. Just immediately call back
    if (image || gradient || imageOverride) callback()
  }, [image, callback, gradient, imageOverride])

  return (
    <div className={styles.coverArtWrapper}>
      <DynamicImage
        className={styles.coverArt}
        image={gradient || imageOverride || image}>
        {Icon && (
          <Icon className={styles.imageIcon} style={{ background: gradient }} />
        )}
      </DynamicImage>
    </div>
  )
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

  onPublish = () => {
    this.setState({ previouslyUnpublished: true })
    this.props.onPublish()
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
      isAlbum,
      modified,
      numTracks,
      duration,
      isPublished,
      isPublishing,
      tracksLoading,
      loading,
      playing,
      isReposted,
      isSaved,
      isFollowing,
      reposts,
      saves,
      onClickArtistName,
      onClickDescriptionExternalLink,
      onPlay,
      onEdit,
      onShare,
      onSave,
      onRepost,
      onFollow,
      onUnfollow,
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
                  attributes: { onClick: onClickDescriptionExternalLink }
                }}>
                {squashNewLines(description)}
              </Linkify>
            </div>
            <div className={cn(styles.statsRow, fadeIn)}>
              {this.renderStatsRow(isLoading)}
            </div>
            <div
              className={cn(styles.buttonSection, {
                [styles.show]: !tracksLoading,
                [styles.hide]: tracksLoading
              })}>
              {!tracksLoading && (
                <Buttons
                  variant={variant}
                  playlistId={collectionId}
                  playlistName={title}
                  isOwner={isOwner}
                  type={type}
                  ownerHandle={artistHandle}
                  isAlbum={isAlbum}
                  hasTracks={numTracks > 0}
                  isPublished={isPublished}
                  isPreviouslyUnpublished={this.state.previouslyUnpublished}
                  unsetPreviouslyPublished={this.unsetPreviouslyPublished}
                  isPublishing={isPublishing}
                  playing={playing}
                  isReposted={isReposted}
                  isSaved={isSaved}
                  isFollowing={isFollowing}
                  reposts={reposts}
                  saves={saves}
                  shareClicked={this.shareClicked}
                  onPlay={onPlay}
                  onEdit={onEdit}
                  onPublish={this.onPublish}
                  onShare={onShare}
                  onSave={onSave}
                  onRepost={onRepost}
                  onFollow={onFollow}
                  onUnfollow={onUnfollow}
                />
              )}
            </div>
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

CollectionHeader.propTypes = {
  collectionId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  index: PropTypes.number,
  loading: PropTypes.bool,
  tracksLoading: PropTypes.bool,
  playing: PropTypes.bool,
  active: PropTypes.bool,
  type: PropTypes.oneOf(['playlist', 'album']),
  title: PropTypes.string,
  artistName: PropTypes.string,
  artistHandle: PropTypes.string,
  coverArtSizes: PropTypes.object,
  tags: PropTypes.array,
  description: PropTypes.string,
  userId: PropTypes.number,

  isOwner: PropTypes.bool,
  isAlbum: PropTypes.bool,
  hasTracks: PropTypes.bool,
  isPublished: PropTypes.bool,
  isPublishing: PropTypes.bool,
  isSaved: PropTypes.bool,
  reposts: PropTypes.number,
  saves: PropTypes.number,

  // Actions
  onClickArtistName: PropTypes.func,
  onFilterChange: PropTypes.func,
  onPlay: PropTypes.func,
  onEdit: PropTypes.func,
  onClickDescriptionExternalLink: PropTypes.func,

  // Smart collection
  variant: PropTypes.any, // CollectionVariant
  gradient: PropTypes.string,
  icon: PropTypes.any,
  imageOverride: PropTypes.string
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
  isPublishing: false,
  isSaved: false,

  reposts: 0,
  saves: 0,

  onPlay: () => {},
  onEdit: () => {}
}

export default CollectionHeader
