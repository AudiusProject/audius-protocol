import { PureComponent } from 'react'

import {
  ShareSource,
  RepostSource,
  accountSelectors,
  collectionsSocialActions,
  tracksSocialActions,
  shareModalUIActions
} from '@audius/common'
import { IconKebabHorizontal, IconRepost, IconShare } from '@audius/harmony'
import cn from 'classnames'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import Menu from 'components/menu/Menu'
import Toast from 'components/toast/Toast'
import Tooltip from 'components/tooltip/Tooltip'
import { REPOST_TOAST_TIMEOUT_MILLIS } from 'utils/constants'

import styles from './ActionsTab.module.css'
const { requestOpen: requestOpenShareModal } = shareModalUIActions
const { repostTrack, undoRepostTrack } = tracksSocialActions
const { repostCollection, undoRepostCollection } = collectionsSocialActions
const getUserHandle = accountSelectors.getUserHandle

const MinimizedActionsTab = (props) => {
  const { isHidden, isDisabled, overflowMenu } = props

  overflowMenu.menu.includeShare = true
  overflowMenu.menu.includeRepost = true

  return (
    <div className={cn({ [styles.hide]: isHidden })}>
      {isDisabled || isHidden ? (
        <div className={styles.iconContainer}>
          <IconKebabHorizontal className={cn(styles.iconKebabHorizontal)} />
        </div>
      ) : (
        <Menu {...overflowMenu}>
          {(ref, triggerPopup) => (
            <div className={styles.iconContainer}>
              <div ref={ref}>
                <IconKebabHorizontal
                  className={cn(styles.iconKebabHorizontal)}
                  onClick={triggerPopup}
                />
              </div>
            </div>
          )}
        </Menu>
      )}
    </div>
  )
}

const ExpandedActionsTab = (props) => {
  const {
    isHidden,
    isDisabled,
    direction,
    currentUserReposted,
    isOwner,
    onToggleRepost,
    onShare,
    overflowMenu
  } = props

  overflowMenu.menu.includeShare = false
  overflowMenu.menu.includeRepost = false

  return (
    <>
      <Tooltip
        text={currentUserReposted ? 'Unrepost' : 'Repost'}
        disabled={isHidden || isDisabled || isOwner}
        placement={direction === 'horizontal' ? 'top' : 'right'}
        mount='page'
      >
        <div
          className={cn(styles.actionButton, {
            [styles.disabled]: isOwner
          })}
          onClick={isDisabled || isOwner ? () => {} : onToggleRepost}
        >
          <Toast
            text={'Reposted!'}
            disabled={currentUserReposted || isHidden || isDisabled || isOwner}
            delay={REPOST_TOAST_TIMEOUT_MILLIS}
            containerClassName={styles.actionIconContainer}
            placement={direction === 'horizontal' ? 'top' : 'right'}
          >
            <IconRepost
              size='m'
              className={cn(styles.iconRepost, {
                [styles.reposted]: currentUserReposted
              })}
            />
          </Toast>
        </div>
      </Tooltip>
      <Tooltip
        text='Share'
        disabled={isHidden || isDisabled}
        placement={direction === 'horizontal' ? 'top' : 'right'}
        mount='page'
      >
        <div
          className={styles.actionButton}
          onClick={isDisabled ? () => {} : onShare}
        >
          <div className={styles.actionIconContainer}>
            <IconShare size='m' className={styles.iconShare} />
          </div>
        </div>
      </Tooltip>
      <div className={cn(styles.actionButton, styles.menuKebabContainer)}>
        {isDisabled || isHidden ? (
          <div className={styles.iconKebabHorizontalWrapper}>
            <IconKebabHorizontal
              size='m'
              className={styles.iconKebabHorizontal}
            />
          </div>
        ) : (
          <Menu {...overflowMenu}>
            {(ref, triggerPopup) => (
              <div
                className={styles.iconKebabHorizontalWrapper}
                onClick={triggerPopup}
              >
                <div ref={ref} className={styles.iconKebabHorizontalRef}>
                  <IconKebabHorizontal
                    size='m'
                    className={styles.iconKebabHorizontal}
                  />
                </div>
              </div>
            )}
          </Menu>
        )}
      </div>
    </>
  )
}

export class ActionsTab extends PureComponent {
  onToggleRepost = () => {
    const {
      repostTrack,
      undoRepostTrack,
      repostCollection,
      undoRepostCollection,
      currentUserReposted,
      variant,
      trackId,
      playlistId
    } = this.props
    if (variant === 'track') {
      currentUserReposted ? undoRepostTrack(trackId) : repostTrack(trackId)
    } else if (variant === 'playlist' || variant === 'album') {
      currentUserReposted
        ? undoRepostCollection(playlistId)
        : repostCollection(playlistId)
    }
  }

  onShare = () => {
    const { trackId, variant, playlistId, shareTrack, shareCollection } =
      this.props
    if (variant === 'track') {
      shareTrack(trackId)
    } else if (variant === 'playlist' || variant === 'album') {
      shareCollection(playlistId)
    }
  }

  render() {
    const {
      minimized,
      standalone,
      isHidden,
      isDisabled,
      direction,
      variant,
      containerStyles,
      handle,
      userHandle,
      playlistId,
      playlistName,
      permalink,
      trackId,
      trackTitle,
      currentUserSaved,
      currentUserReposted,
      isArtistPick,
      isPublic,
      includeEdit
    } = this.props

    const overflowMenu = {
      menu: {
        handle,
        isFavorited: currentUserSaved,
        isReposted: currentUserReposted,
        mount: 'page',
        isOwner: handle === userHandle,
        isArtistPick
      }
    }
    if (variant === 'track') {
      overflowMenu.menu.type = 'track'
      overflowMenu.menu.trackId = trackId
      overflowMenu.menu.trackTitle = trackTitle
      overflowMenu.menu.isArtistPick = isArtistPick
    } else if (variant === 'playlist' || variant === 'album') {
      overflowMenu.menu.type = variant === 'playlist' ? 'playlist' : 'album'
      overflowMenu.menu.playlistId = playlistId
      overflowMenu.menu.playlistName = playlistName
      overflowMenu.menu.includeAddToCollection = false
      overflowMenu.menu.isPublic = isPublic
      overflowMenu.menu.includeEdit = includeEdit
      overflowMenu.menu.permalink = permalink
    }

    return (
      <div
        className={cn(styles.actionsSection, {
          [styles.show]: !isHidden,
          [styles.hide]: isHidden,
          [styles.horizontal]: direction === 'horizontal',
          [styles.vertical]: direction === 'vertical',
          [styles.disabled]: isDisabled,
          [styles.standalone]: standalone,
          [containerStyles]: !!containerStyles
        })}
      >
        {minimized ? (
          <MinimizedActionsTab {...this.props} overflowMenu={overflowMenu} />
        ) : (
          <ExpandedActionsTab
            {...this.props}
            isOwner={handle === userHandle}
            overflowMenu={overflowMenu}
            onToggleRepost={this.onToggleRepost}
            onShare={this.onShare}
          />
        )}
      </div>
    )
  }
}

ActionsTab.propTypes = {
  isHidden: PropTypes.bool,
  minimized: PropTypes.bool,
  standalone: PropTypes.bool,
  isPublic: PropTypes.bool,
  isDisabled: PropTypes.bool,
  includeEdit: PropTypes.bool,
  direction: PropTypes.oneOf(['vertical', 'horizontal']),
  variant: PropTypes.oneOf(['track', 'playlist', 'album']),
  containerStyles: PropTypes.string,
  currentUserReposted: PropTypes.bool,
  currentUserSaved: PropTypes.bool,
  handle: PropTypes.string,
  trackTitle: PropTypes.string,
  trackId: PropTypes.number,
  playlistName: PropTypes.string,
  playlistId: PropTypes.number,
  permalink: PropTypes.string
}

ActionsTab.defaultProps = {
  isHidden: false,
  minimized: false,
  standalone: false,
  isDisabled: false,
  direction: 'vertical',
  variant: 'track',
  handle: 'handle'
}

const mapStateToProps = (state) => ({
  userHandle: getUserHandle(state)
})

const mapDispatchToProps = (dispatch) => ({
  shareTrack: (trackId) =>
    dispatch(
      requestOpenShareModal({
        type: 'track',
        trackId,
        source: ShareSource.TILE
      })
    ),
  shareCollection: (collectionId) =>
    dispatch(
      requestOpenShareModal({
        type: 'collection',
        collectionId,
        source: ShareSource.TILE
      })
    ),
  repostTrack: (trackId) => dispatch(repostTrack(trackId, RepostSource.TILE)),
  undoRepostTrack: (trackId) =>
    dispatch(undoRepostTrack(trackId, RepostSource.TILE)),
  repostCollection: (playlistId) =>
    dispatch(repostCollection(playlistId, RepostSource.TILE)),
  undoRepostCollection: (playlistId) =>
    dispatch(undoRepostCollection(playlistId, RepostSource.TILE))
})

export default connect(mapStateToProps, mapDispatchToProps)(ActionsTab)
