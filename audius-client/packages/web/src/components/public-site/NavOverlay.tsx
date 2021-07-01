import React, { useState, useEffect } from 'react'

import {
  IconRemove,
  IconInstagram,
  IconTwitterBird,
  IconDiscord,
  IconExplore,
  IconTrending,
  IconCampFire
} from '@audius/stems'
import cn from 'classnames'
import ReactDOM from 'react-dom'

import HeroBackground from 'assets/img/publicSite/Hero-Background@2x.jpg'
import HorizontalLogo from 'assets/img/publicSite/Horizontal-Logo-Full-Color@2x.png'
import {
  handleClickRoute,
  AUDIUS_TWITTER_LINK,
  AUDIUS_INSTAMGRAM_LINK,
  AUDIUS_DISCORD_LINK,
  AUDIUS_TEAM_LINK,
  AUDIUS_DEV_STAKER_LINK,
  AUDIUS_LISTENING_LINK,
  AUDIUS_PRESS_LINK,
  PRIVACY_POLICY,
  TERMS_OF_SERVICE,
  AUDIUS_HOT_AND_NEW,
  AUDIUS_EXPLORE_LINK
} from 'utils/route'

import styles from './NavOverlay.module.css'

const messages = {
  startListening: 'Start Listening'
}

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

const dappLinks = [
  {
    text: 'Explore',
    icon: <IconExplore className={styles.dappLinkIcon} />,
    link: AUDIUS_EXPLORE_LINK,
    onClick: handleClickRoute(AUDIUS_EXPLORE_LINK)
  },
  {
    text: 'Trending',
    icon: <IconTrending className={styles.dappLinkIcon} />,
    link: AUDIUS_LISTENING_LINK,
    onClick: handleClickRoute(AUDIUS_LISTENING_LINK)
  },
  {
    text: 'Hot & New',
    icon: <IconCampFire className={styles.dappLinkIcon} />,
    link: AUDIUS_HOT_AND_NEW,
    onClick: handleClickRoute(AUDIUS_HOT_AND_NEW)
  }
]

const links = [
  {
    text: 'Dev & Stakers',
    link: AUDIUS_DEV_STAKER_LINK,
    onClick: handleClickRoute(AUDIUS_DEV_STAKER_LINK)
  },
  {
    text: 'Team',
    link: AUDIUS_TEAM_LINK,
    onClick: handleClickRoute(AUDIUS_TEAM_LINK)
  },
  {
    text: 'Press',
    link: AUDIUS_PRESS_LINK,
    onClick: handleClickRoute(AUDIUS_PRESS_LINK)
  },
  {
    text: 'Privacy Policy',
    link: PRIVACY_POLICY,
    onClick: handleClickRoute(PRIVACY_POLICY)
  },
  {
    text: 'Terms of Service',
    link: TERMS_OF_SERVICE,
    onClick: handleClickRoute(TERMS_OF_SERVICE)
  }
]

type NavOverlayProps = {
  isOpen: boolean
  closeNavScreen: () => void
  setRenderPublicSite: (shouldRender: boolean) => void
}

const rootId = 'navOverlay'

const useModalRoot = () => {
  const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null)

  useEffect(() => {
    let el = document.getElementById(rootId)
    if (el) {
      setModalRoot(el)
    } else {
      el = document.createElement('div')
      el.id = rootId
      document.body.appendChild(el)
      setModalRoot(el)
    }
  }, [])

  return modalRoot
}

const NavOverlay = (props: NavOverlayProps) => {
  const onStartListening = () => {
    props.setRenderPublicSite(false)
    props.closeNavScreen()
    window.history.pushState('', '/', AUDIUS_LISTENING_LINK)
  }

  const modalRoot = useModalRoot()

  return (
    modalRoot &&
    ReactDOM.createPortal(
      <div
        className={cn(styles.container, {
          [styles.hide]: !props.isOpen
        })}
      >
        <div
          className={cn(styles.backgroundContainer)}
          style={{
            backgroundImage: `url(${HeroBackground})`
          }}
        >
          <div className={cn(styles.background)}></div>
        </div>
        <div className={styles.content}>
          <div className={styles.iconContainer}>
            <IconRemove
              className={styles.iconClose}
              onClick={props.closeNavScreen}
            />
          </div>
          <div className={styles.centerLogo}>
            <img
              src={HorizontalLogo}
              className={styles.horizontalLogo}
              alt='Audius Logo'
            />
          </div>
          <div className={styles.startListeningButtonContainer}>
            <div
              className={styles.startListeningButton}
              onClick={onStartListening}
            >
              {messages.startListening}
            </div>
          </div>
          <div className={styles.dappLinksContainer}>
            <div className={styles.dappLinks}>
              {dappLinks.map(({ icon, text, onClick, link }, idx) => (
                <a
                  key={idx}
                  onClick={onClick}
                  className={styles.dappLink}
                  href={link}
                >
                  {icon}
                  <h4 className={styles.dappLinkText}>{text}</h4>
                </a>
              ))}
            </div>
          </div>
          <div className={styles.linksContainer}>
            {links.map(({ text, onClick, link }, idx) => (
              <a
                key={idx}
                onClick={onClick}
                className={styles.link}
                href={link}
              >
                {text}
              </a>
            ))}
            <div className={styles.iconsContainer}>
              {socialLinks.map(({ Icon, onClick, link }, idx) => (
                <a key={idx} href={link} onClick={onClick}>
                  <Icon className={styles.icon} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>,
      modalRoot
    )
  )
}

export default NavOverlay
