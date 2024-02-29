import { useCallback, useEffect, useState } from 'react'

import { Name } from '@audius/common/models'
import {
  IconCaretDown as IconCaretDownLine,
  IconCaretUp as IconCaretUpLine
} from '@audius/harmony'
import { ResizeObserver } from '@juggle/resize-observer'
import cn from 'classnames'
// eslint-disable-next-line no-restricted-imports -- TODO: migrate to @react-spring/web
import { animated } from 'react-spring'
import useMeasure from 'react-use-measure'

import { make, useRecord } from 'common/store/analytics/actions'
import { OpacityTransition } from 'components/transition-container/OpacityTransition'
import { UserGeneratedText } from 'components/user-generated-text'

import SocialLink, { Type } from '../SocialLink'

import styles from './ProfilePage.module.css'

const messages = {
  seeMore: 'See More',
  seeLess: 'See Less'
}

type ProfileBioProps = {
  handle: string
  bio: string
  location: string
  website: string
  donation: string
  created: string
  twitterHandle: string
  instagramHandle: string
  tikTokHandle: string
}

// Line height is 16px, 4 lines
const MAX_BIO_SIZE = 16 * 4

export const ProfileBio = ({
  handle,
  bio,
  location,
  website,
  donation,
  created,
  twitterHandle,
  instagramHandle,
  tikTokHandle
}: ProfileBioProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isCollapsible, setIsCollapsible] = useState(false)
  const [bioRef, { height: bioSize }] = useMeasure({
    polyfill: ResizeObserver
  })

  const linkCount = [
    website,
    donation,
    twitterHandle,
    instagramHandle,
    tikTokHandle
  ].filter(Boolean).length
  const hasSocial = twitterHandle || instagramHandle || tikTokHandle

  /**
   * Collapse the component by default if:
   * - The bio is more than four lines OR
   * - There's more than one link
   */
  useEffect(() => {
    if (
      !isCollapsed &&
      !isCollapsible &&
      (bioSize > MAX_BIO_SIZE || linkCount > 1)
    ) {
      setIsCollapsed(true)
      setIsCollapsible(true)
    }
  }, [
    linkCount,
    bioSize,
    isCollapsed,
    isCollapsible,
    setIsCollapsed,
    setIsCollapsible
  ])

  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed(!isCollapsed)
  }, [isCollapsed, setIsCollapsed])

  const record = useRecord()

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
    (event: { target: { href: string } }) => {
      record(
        make(Name.PROFILE_PAGE_CLICK_DONATION, {
          handle: handle.replace('@', ''),
          donation: event.target.href
        })
      )
    },
    [record, handle]
  )

  const renderCollapsedContent = (_: any, style: object) =>
    hasSocial ? (
      <animated.div className={styles.socialsTruncated} style={style}>
        {twitterHandle && (
          <SocialLink
            type={Type.TWITTER}
            link={twitterHandle}
            onClick={onClickTwitter}
            iconOnly
          />
        )}
        {instagramHandle && (
          <SocialLink
            type={Type.INSTAGRAM}
            link={instagramHandle}
            onClick={onClickInstagram}
            iconOnly
          />
        )}
        {tikTokHandle && (
          <SocialLink
            type={Type.TIKTOK}
            link={tikTokHandle}
            onClick={onClickTikTok}
            iconOnly
          />
        )}
        {website && (
          <SocialLink
            type={Type.WEBSITE}
            link={website}
            onClick={onClickWebsite}
            iconOnly
          />
        )}
      </animated.div>
    ) : (
      <></>
    )

  const renderExpandedContent = (_: any, style: object) => (
    <animated.div className={styles.socials} style={style}>
      {twitterHandle && (
        <SocialLink
          type={Type.TWITTER}
          link={twitterHandle}
          onClick={onClickTwitter}
        />
      )}
      {instagramHandle && (
        <SocialLink
          type={Type.INSTAGRAM}
          link={instagramHandle}
          onClick={onClickInstagram}
        />
      )}
      {tikTokHandle && (
        <SocialLink
          type={Type.TIKTOK}
          link={tikTokHandle}
          onClick={onClickTikTok}
        />
      )}
      {website && (
        <SocialLink
          type={Type.WEBSITE}
          link={website}
          onClick={onClickWebsite}
        />
      )}
      {donation && (
        <SocialLink
          type={Type.DONATION}
          link={donation}
          onClick={onClickDonation}
        />
      )}
      <div className={styles.location}>{location}</div>
      <div className={styles.joined}>Joined {created}</div>
    </animated.div>
  )

  return (
    <div>
      <UserGeneratedText
        size='xSmall'
        ref={bioRef}
        className={cn(styles.description, {
          [styles.truncated]: isCollapsed
        })}
        linkSource='profile page'
      >
        {bio}
      </UserGeneratedText>
      {isCollapsed ? (
        <div>
          <OpacityTransition render={renderCollapsedContent} duration={300} />
          <div
            className={styles.truncateContainer}
            onClick={handleToggleCollapse}
          >
            <span>{messages.seeMore}</span>
            <IconCaretDownLine size='m' color='subdued' />
          </div>
        </div>
      ) : (
        <div>
          <OpacityTransition render={renderExpandedContent} duration={300} />
          {isCollapsible ? (
            <div
              className={styles.truncateContainer}
              onClick={handleToggleCollapse}
            >
              <span>{messages.seeLess}</span>
              <IconCaretUpLine size='m' color='subdued' />
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
