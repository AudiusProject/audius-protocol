import React, { useState, useCallback } from 'react'

import cn from 'classnames'
import Linkify from 'linkifyjs/react'

import { ReactComponent as BadgeArtist } from 'assets/img/badgeArtist.svg'
import { Name } from 'common/models/Analytics'
import { formatCount, squashNewLines } from 'common/utils/formatUtil'
import ArtistChip from 'components/artist/ArtistChip'
import UserListModal from 'components/artist/UserListModal'
import Input from 'components/data-entry/Input'
import TextArea from 'components/data-entry/TextArea'
import More from 'components/general/More'
import ProfilePicture from 'components/general/ProfilePicture'
import Tag from 'components/track/Tag'
import UploadChip from 'components/upload/UploadChip'
import EditableName from 'containers/profile-page/components/EditableName'
import SocialLink, { Type } from 'containers/profile-page/components/SocialLink'
import SocialLinkInput from 'containers/profile-page/components/SocialLinkInput'
import ProfilePageBadge from 'containers/user-badges/ProfilePageBadge'
import { make, useRecord } from 'store/analytics/actions'
import { profilePage, searchResultsPage, UPLOAD_PAGE } from 'utils/route'

import styles from './ProfilePage.module.css'

const Tags = props => {
  const { tags, goToRoute } = props
  const record = useRecord()
  const onClickTag = useCallback(
    tag => {
      goToRoute(searchResultsPage(`#${tag}`))
      record(make(Name.TAG_CLICKING, { tag, source: 'profile page' }))
    },
    [goToRoute, record]
  )

  return tags && tags.length > 0 ? (
    <div className={styles.tags}>
      <div className={styles.infoHeader}>MOST USED TAGS</div>
      <div className={styles.tagsContent}>
        {tags.map(tag => (
          <Tag
            onClick={() => onClickTag(tag)}
            key={tag}
            className={styles.tag}
            textLabel={tag}
          />
        ))}
      </div>
    </div>
  ) : null
}

const Followers = props => {
  return (
    <div className={styles.followers}>
      <div className={styles.infoHeader}>
        {formatCount(props.followerCount)}
        {props.followerCount === 1
          ? ' FOLLOWER YOU KNOW'
          : ' FOLLOWERS YOU KNOW'}
      </div>
      <div className={styles.followersContent}>
        {props.followers
          .slice(0, Math.min(3, props.followers.length))
          .map(follower => (
            <ArtistChip
              key={follower.handle}
              userId={follower.user_id}
              profilePictureSizes={follower._profile_picture_sizes}
              handle={follower.handle}
              name={follower.name}
              followers={follower.follower_count}
              onClickArtistName={() => props.onClickArtistName(follower.handle)}
            />
          ))}
      </div>
    </div>
  )
}

const ProfileWrapping = props => {
  const [showMutualConnectionsModal, setShowMutualConnectionsModal] = useState(
    false
  )
  const record = useRecord()
  const {
    handle,
    goToRoute,
    twitterHandle,
    instagramHandle,
    tikTokHandle,
    website
  } = props
  const onClickTwitter = useCallback(() => {
    record(
      make(Name.PROFILE_PAGE_CLICK_TWITTER, {
        handle: handle.replace('@', ''),
        twitterHandle
      })
    )
  }, [record, handle, twitterHandle])
  const onClickInstagram = useCallback(() => {
    record(
      make(Name.PROFILE_PAGE_CLICK_INSTAGRAM, {
        handle: handle.replace('@', ''),
        instagramHandle
      })
    )
  }, [record, handle, instagramHandle])
  const onClickTikTok = useCallback(() => {
    record(
      make(Name.PROFILE_PAGE_CLICK_TIKTOK, {
        handle: handle.replace('@', ''),
        tikTokHandle
      })
    )
  }, [record, handle, tikTokHandle])
  const onClickWebsite = useCallback(() => {
    record(
      make(Name.PROFILE_PAGE_CLICK_WEBSITE, {
        handle: handle.replace('@', ''),
        website
      })
    )
  }, [record, handle, website])
  const onClickDonation = useCallback(
    event => {
      record(
        make(Name.PROFILE_PAGE_CLICK_DONATION, {
          handle: handle.replace('@', ''),
          donation: event.target.href
        })
      )
    },
    [record, handle]
  )

  const onExternalLinkClick = useCallback(
    event => {
      record(
        make(Name.LINK_CLICKING, {
          url: event.target.href,
          source: 'profile page'
        })
      )
    },
    [record]
  )

  const onClickUploadChip = useCallback(() => {
    goToRoute(UPLOAD_PAGE)
    record(make(Name.TRACK_UPLOAD_OPEN, { source: 'profile' }))
  }, [goToRoute, record])

  let leftNav = null
  if (props.editMode) {
    leftNav = (
      <div className={styles.edit}>
        <div className={styles.editLabel}>About You</div>
        <div className={styles.editField}>
          <TextArea
            className={styles.descriptionInput}
            size='small'
            grows
            placeholder='Description'
            defaultValue={props.bio || ''}
            onChange={props.onUpdateBio}
          />
        </div>
        <div className={styles.editField}>
          <Input
            className={styles.locationInput}
            characterLimit={30}
            size='small'
            placeholder='Location'
            defaultValue={props.location || ''}
            onChange={props.onUpdateLocation}
          />
        </div>
        <div className={cn(styles.editLabel, styles.section)}>
          Social Handles
        </div>
        <div className={styles.editField}>
          <SocialLinkInput
            defaultValue={props.twitterHandle}
            isDisabled={!!props.twitterVerified}
            className={styles.twitterInput}
            type={Type.TWITTER}
            onChange={props.onUpdateTwitterHandle}
          />
        </div>
        <div className={styles.editField}>
          <SocialLinkInput
            defaultValue={props.instagramHandle}
            className={styles.instagramInput}
            isDisabled={!!props.instagramVerified}
            type={Type.INSTAGRAM}
            onChange={props.onUpdateInstagramHandle}
          />
        </div>
        <div className={styles.editField}>
          <SocialLinkInput
            defaultValue={props.tikTokHandle}
            className={styles.tikTokInput}
            type={Type.TIKTOK}
            onChange={props.onUpdateTikTokHandle}
          />
        </div>
        <div className={cn(styles.editLabel, styles.section)}>Website</div>
        <div className={styles.editField}>
          <SocialLinkInput
            defaultValue={props.website}
            className={styles.websiteInput}
            type={Type.WEBSITE}
            onChange={props.onUpdateWebsite}
          />
        </div>
        <div className={cn(styles.editLabel, styles.section)}>Donate</div>
        <div className={styles.editField}>
          <SocialLinkInput
            defaultValue={props.donation}
            className={styles.donationInput}
            type={Type.DONATION}
            textLimitMinusLinks={32}
            onChange={props.onUpdateDonation}
          />
        </div>
      </div>
    )
  } else if (!props.loading && !props.isDeactivated) {
    leftNav = (
      <div className={styles.about}>
        <ProfilePageBadge userId={props.userId} className={styles.badge} />
        <Linkify options={{ attributes: { onClick: onExternalLinkClick } }}>
          <div className={styles.description}>{squashNewLines(props.bio)}</div>
        </Linkify>
        <div className={styles.location}>{props.location}</div>
        <div className={styles.joined}>Joined {props.created}</div>
        <div className={styles.socials}>
          {props.twitterHandle && (
            <SocialLink
              type={Type.TWITTER}
              link={props.twitterHandle}
              onClick={onClickTwitter}
            />
          )}
          {props.instagramHandle && (
            <SocialLink
              type={Type.INSTAGRAM}
              link={props.instagramHandle}
              onClick={onClickInstagram}
            />
          )}
          {props.tikTokHandle && (
            <SocialLink
              type={Type.TIKTOK}
              link={props.tikTokHandle}
              onClick={onClickTikTok}
            />
          )}
          {props.website && (
            <SocialLink
              type={Type.WEBSITE}
              link={props.website}
              onClick={onClickWebsite}
            />
          )}
          {props.donation && (
            <SocialLink
              type={Type.DONATION}
              link={props.donation}
              onClick={onClickDonation}
            />
          )}
        </div>
        {props.isArtist ? (
          <Tags goToRoute={props.goToRoute} tags={props.tags} />
        ) : null}
        {props.isOwner && !props.isArtist && (
          <UploadChip type='track' variant='nav' onClick={onClickUploadChip} />
        )}
        {props.followeeFollows.length > 0 && !props.isOwner && (
          <>
            <Followers
              followers={props.followeeFollows}
              followerCount={props.followeeFollowsCount}
              onClickArtistName={handle => props.goToRoute(profilePage(handle))}
            />
            <More
              text='View All'
              onClick={() => setShowMutualConnectionsModal(true)}
            />
            <UserListModal
              title={`${formatCount(
                props.followeeFollowsCount
              )} MUTUAL CONNECTIONS`}
              visible={showMutualConnectionsModal}
              onClose={() => setShowMutualConnectionsModal(false)}
              users={props.followeeFollows}
              loading={props.followeeFollowsLoading}
              hasMore={
                props.followeeFollows.length < props.followeeFollowsCount
              }
              loadMore={props.loadMoreFolloweeFollows}
              onClickArtistName={handle => props.goToRoute(profilePage(handle))}
            />
          </>
        )}
      </div>
    )
  }

  return (
    <div className={styles.profileWrapping}>
      <div className={styles.header}>
        <ProfilePicture
          userId={props.userId}
          updatedProfilePicture={
            props.updatedProfilePicture ? props.updatedProfilePicture.url : ''
          }
          error={
            props.updatedProfilePicture
              ? props.updatedProfilePicture.error
              : false
          }
          profilePictureSizes={
            props.isDeactivated ? null : props.profilePictureSizes
          }
          loading={props.loading}
          editMode={props.editMode}
          hasProfilePicture={props.hasProfilePicture}
          onDrop={props.onUpdateProfilePicture}
        />
        <div className={styles.nameWrapper}>
          <BadgeArtist
            className={cn(styles.badgeArtist, {
              [styles.hide]:
                !props.isArtist || props.loading || props.isDeactivated
            })}
          />
          {!props.isDeactivated && (
            <>
              <EditableName
                className={props.editMode ? styles.editableName : null}
                name={props.name}
                editable={props.editMode}
                verified={props.verified}
                onChange={props.onUpdateName}
                userId={props.userId}
              />
              <h2 className={styles.handle}>{props.handle}</h2>
            </>
          )}
        </div>
      </div>
      <div className={styles.info}>{leftNav}</div>
    </div>
  )
}

export default ProfileWrapping
