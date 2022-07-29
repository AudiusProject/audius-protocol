import { useCallback, useEffect, useRef, useState } from 'react'

import { Name } from '@audius/common'
import cn from 'classnames'
import { Options } from 'linkifyjs'
import Linkify from 'linkifyjs/react'
import { animated } from 'react-spring'

import { ReactComponent as IconCaretDownLine } from 'assets/img/iconCaretDownLine.svg'
import { ReactComponent as IconCaretUpLine } from 'assets/img/iconCaretUpLine.svg'
import { squashNewLines } from 'common/utils/formatUtil'
import { OpacityTransition } from 'components/transition-container/OpacityTransition'
import { useSize } from 'hooks/useSize'
import { make, useRecord } from 'store/analytics/actions'

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
  const bioRef = useRef<HTMLDivElement>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isCollapsible, setIsCollapsible] = useState(false)
  const bioSize = useSize({ ref: bioRef })

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

  const onExternalLinkClick = useCallback(
    (event) => {
      record(
        make(Name.LINK_CLICKING, {
          url: event.target.href,
          source: 'profile page'
        })
      )
    },
    [record]
  )

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
    (event) => {
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

  const linkifyOptions = {
    attributes: { onClick: onExternalLinkClick }
  } as unknown as Options

  return (
    <div>
      <Linkify options={linkifyOptions}>
        <div
          className={cn(styles.description, {
            [styles.truncated]: isCollapsed
          })}
          ref={bioRef}
        >
          {squashNewLines(bio)}
        </div>
      </Linkify>
      {isCollapsed ? (
        <div>
          <OpacityTransition render={renderCollapsedContent} duration={300} />
          <div
            className={styles.truncateContainer}
            onClick={handleToggleCollapse}
          >
            <span>{messages.seeMore}</span>
            <IconCaretDownLine />
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
              <IconCaretUpLine />
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
