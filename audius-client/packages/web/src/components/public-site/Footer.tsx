import React, { MouseEvent } from 'react'

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
  AUDIUS_EXPLORE_LINK,
  pushWindowRoute
} from 'utils/route'

import styles from './Footer.module.css'

const handleClickRoute = (route: string) => (e: MouseEvent) => {
  e.preventDefault()
  pushWindowRoute(route)
}

const onClickHome = () => pushWindowRoute(AUDIUS_HOME_LINK)
const onStartListening = () => pushWindowRoute(AUDIUS_LISTENING_LINK)

const bottomLinks = [
  {
    text: 'Privacy Policy',
    link: PRIVACY_POLICY,
    onClick: handleClickRoute(PRIVACY_POLICY)
  },
  {
    text: 'Terms of Use',
    link: TERMS_OF_SERVICE,
    onClick: handleClickRoute(TERMS_OF_SERVICE)
  }
]

const siteLinkRows = [
  [
    {
      text: 'Trending',
      link: AUDIUS_LISTENING_LINK,
      onClick: handleClickRoute(AUDIUS_LISTENING_LINK)
    },
    {
      text: 'Explore',
      link: AUDIUS_HOT_AND_NEW,
      onClick: handleClickRoute(AUDIUS_EXPLORE_LINK)
    },
    {
      text: 'Hot & New',
      link: AUDIUS_HOT_AND_NEW,
      onClick: handleClickRoute(AUDIUS_HOT_AND_NEW)
    }
  ],
  [
    {
      text: 'Team',
      link: AUDIUS_TEAM_LINK,
      onClick: handleClickRoute(AUDIUS_TEAM_LINK)
    },
    {
      text: 'Devs & Stakers',
      link: AUDIUS_DEV_STAKER_LINK,
      onClick: handleClickRoute(AUDIUS_DEV_STAKER_LINK)
    },
    {
      text: 'Press',
      link: AUDIUS_PRESS_LINK,
      onClick: handleClickRoute(AUDIUS_PRESS_LINK)
    }
  ]
]

const socialLinks = [
  {
    Icon: IconInstagram,
    link: AUDIUS_INSTAMGRAM_LINK,
    onClick: handleClickRoute(AUDIUS_INSTAMGRAM_LINK)
  },
  {
    Icon: IconTwitterBird,
    link: AUDIUS_TWITTER_LINK,
    onClick: handleClickRoute(AUDIUS_TWITTER_LINK)
  },
  {
    Icon: IconDiscord,
    link: AUDIUS_DISCORD_LINK,
    onClick: handleClickRoute(AUDIUS_DISCORD_LINK)
  }
]

const messages = {
  startListening: 'Start Listening Free',
  copyright: '© 2020 Audius, Inc. All Rights Reserved.',
  madeWith: 'Made with',
  love: '♥︎',
  location: 'in SF & LA'
}

type FooterProps = {
  isMobile: boolean
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
            onClick={onClickHome}
          />
          <button
            onClick={onStartListening}
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
                    onClick={siteLink.onClick}
                    className={cn(styles.siteLink, styles.link)}
                  >
                    {siteLink.text}
                  </a>
                ))}
              </div>
            ))}
          </div>
          <div className={styles.rightsContainer}>
            <div>{messages.copyright}</div>
            <div>
              <span>{messages.madeWith}</span>
              <span className={styles.heart}>{messages.love}</span>
              <span>{messages.location}</span>
            </div>
          </div>
          <div className={styles.socialLinks}>
            {socialLinks.map(({ Icon, onClick, link }, idx) => (
              <a
                key={idx}
                onClick={onClick}
                href={link}
                className={styles.socialIconLinkContainer}
              >
                <Icon className={styles.socialIconLink} />
              </a>
            ))}
          </div>
        </div>
        <div className={styles.bottomLinks}>
          {bottomLinks.map(({ text, link, onClick }) => (
            <a
              key={text}
              href={link}
              className={cn(styles.bottomLink, styles.link)}
              onClick={onClick}
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
