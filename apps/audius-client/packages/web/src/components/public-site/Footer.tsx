import React from 'react'

import { IconInstagram, IconTwitterBird, IconDiscord } from '@audius/stems'
import cn from 'classnames'

import horizontalLogo from 'assets/img/publicSite/Horizontal-Logo-Full-Color@2x.png'
import {
  AUDIUS_HOME_LINK,
  AUDIUS_TWITTER_LINK,
  AUDIUS_INSTAMGRAM_LINK,
  AUDIUS_DISCORD_LINK,
  AUDIUS_DEV_STAKER_LINK,
  AUDIUS_TEAM_LINK,
  AUDIUS_PRESS_LINK,
  PRIVACY_POLICY,
  TERMS_OF_SERVICE,
  AUDIUS_LISTENING_LINK,
  AUDIUS_HOT_AND_NEW,
  AUDIUS_EXPLORE_LINK
} from 'utils/route'

import styles from './Footer.module.css'
import { handleClickRoute } from './handleClickRoute'

const bottomLinks = [
  {
    text: 'Privacy Policy',
    link: PRIVACY_POLICY
  },
  {
    text: 'Terms of Use',
    link: TERMS_OF_SERVICE
  }
]

const siteLinkRows = [
  [
    {
      text: 'Trending',
      link: AUDIUS_LISTENING_LINK
    },
    {
      text: 'Explore',
      link: AUDIUS_EXPLORE_LINK
    },
    {
      text: 'Hot & New',
      link: AUDIUS_HOT_AND_NEW
    }
  ],
  [
    {
      text: 'Team',
      link: AUDIUS_TEAM_LINK
    },
    {
      text: 'Devs & Stakers',
      link: AUDIUS_DEV_STAKER_LINK
    },
    {
      text: 'Press',
      link: AUDIUS_PRESS_LINK
    }
  ]
]

const socialLinks = [
  {
    Icon: IconInstagram,
    link: AUDIUS_INSTAMGRAM_LINK
  },
  {
    Icon: IconTwitterBird,
    link: AUDIUS_TWITTER_LINK
  },
  {
    Icon: IconDiscord,
    link: AUDIUS_DISCORD_LINK
  }
]

const messages = {
  startListening: 'Start Listening Free',
  copyright: (year: number | string) =>
    `© ${year} Audius, Inc. All Rights Reserved.`,
  madeWith: 'Made with',
  love: '♥︎',
  location: 'in SF & LA'
}

type FooterProps = {
  isMobile: boolean
  setRenderPublicSite: (shouldRender: boolean) => void
}

const Footer = (props: FooterProps) => {
  return (
    <div
      className={cn(styles.container, {
        [styles.isMobile]: props.isMobile
      })}
    >
      <div className={styles.content}>
        <div className={styles.logoLinkContainer}>
          <img
            src={horizontalLogo}
            className={styles.logo}
            alt='Audius Logo'
            onClick={handleClickRoute(
              AUDIUS_HOME_LINK,
              props.setRenderPublicSite
            )}
          />
          <button
            onClick={handleClickRoute(
              AUDIUS_LISTENING_LINK,
              props.setRenderPublicSite
            )}
            className={styles.startListeningButton}
          >
            {messages.startListening}
          </button>
        </div>
        <div className={styles.divider}></div>
        <div className={styles.linksContainer}>
          <div className={styles.siteLinksContainer}>
            {siteLinkRows.map((sitelinks, idx) => (
              <div className={styles.siteLinksRowContainer} key={idx}>
                {sitelinks.map(siteLink => (
                  <a
                    key={siteLink.text}
                    href={siteLink.link}
                    onClick={handleClickRoute(
                      siteLink.link,
                      props.setRenderPublicSite
                    )}
                    className={cn(styles.siteLink, styles.link)}
                  >
                    {siteLink.text}
                  </a>
                ))}
              </div>
            ))}
          </div>
          <div className={styles.rightsContainer}>
            <div>{messages.copyright(new Date().getFullYear())}</div>
            <div>
              <span>{messages.madeWith}</span>
              <span className={styles.heart}>{messages.love}</span>
              <span>{messages.location}</span>
            </div>
          </div>
          <div className={styles.socialLinks}>
            {socialLinks.map(({ Icon, link }, idx) => (
              <a
                key={idx}
                onClick={handleClickRoute(link, props.setRenderPublicSite)}
                href={link}
                className={styles.socialIconLinkContainer}
              >
                <Icon className={styles.socialIconLink} />
              </a>
            ))}
          </div>
        </div>
        <div className={styles.bottomLinks}>
          {bottomLinks.map(({ text, link }) => (
            <a
              key={text}
              href={link}
              className={cn(styles.bottomLink, styles.link)}
              onClick={handleClickRoute(link, props.setRenderPublicSite)}
            >
              {text}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Footer
