import {
  IconInstagram,
  IconTwitterBird,
  IconDiscord2,
  IconTelegram
} from '@audius/stems'
import cn from 'classnames'

import horizontalLogo from 'assets/img/Horizontal-Logo-Full-Color.png'
import {
  AUDIUS_HOME_LINK,
  AUDIUS_TWITTER_LINK,
  AUDIUS_INSTAMGRAM_LINK,
  AUDIUS_DISCORD_LINK,
  AUDIUS_PRESS_LINK,
  PRIVACY_POLICY,
  TERMS_OF_SERVICE,
  AUDIUS_LISTENING_LINK,
  AUDIUS_BLOG_LINK,
  DOWNLOAD_LINK,
  AUDIUS_HELP_LINK,
  AUDIUS_ORG,
  AUDIUS_MERCH_LINK,
  AUDIUS_TELEGRAM_LINK
} from 'utils/route'

import styles from './Footer.module.css'
import { handleClickRoute } from './handleClickRoute'

const bottomLinks = [
  {
    text: 'Terms of Service',
    link: TERMS_OF_SERVICE
  },
  {
    text: 'Privacy Policy',
    link: PRIVACY_POLICY
  }
]

const resourcesLinks = [
  {
    text: 'The Blog',
    link: AUDIUS_BLOG_LINK
  },
  {
    text: 'Merch Store',
    link: AUDIUS_MERCH_LINK
  },
  {
    text: 'Brand / Press',
    link: AUDIUS_PRESS_LINK
  },
  {
    text: 'Open Audio Foundation',
    link: AUDIUS_ORG
  }
]

const socialLinks = [
  {
    text: 'Instagram',
    Icon: IconInstagram,
    link: AUDIUS_INSTAMGRAM_LINK
  },
  {
    text: 'Twitter',
    Icon: IconTwitterBird,
    link: AUDIUS_TWITTER_LINK
  },
  {
    text: 'Discord',
    Icon: IconDiscord2,
    link: AUDIUS_DISCORD_LINK
  },
  {
    text: 'Telegram',
    Icon: IconTelegram,
    link: AUDIUS_TELEGRAM_LINK
  }
]

const messages = {
  copyright: (year: number | string) =>
    `© ${year} Audius Music. All rights reserved.`,
  product: 'Product',
  resources: 'Resources',
  socials: 'Socials',
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
          <div className={styles.siteLinksContainer}>
            <div className={styles.siteLinksColumnContainer}>
              <p className={styles.siteLinksColumnTitle}>{messages.product}</p>
              <a
                onClick={handleClickRoute(
                  AUDIUS_LISTENING_LINK,
                  props.setRenderPublicSite
                )}
                className={cn(styles.siteLink, styles.link)}
              >
                Audius Music
              </a>
              <a
                href={DOWNLOAD_LINK}
                target='_blank'
                className={cn(styles.siteLink, styles.link)}
              >
                Download
              </a>
              <a
                href={AUDIUS_HELP_LINK}
                target='_blank'
                className={cn(styles.siteLink, styles.link)}
              >
                Support
              </a>
            </div>
            <div className={styles.siteLinksColumnContainer}>
              <p className={styles.siteLinksColumnTitle}>{messages.resources}</p>
              {resourcesLinks.map((link) => (
                <a
                  key={link.text}
                  href={link.link}
                  target='_blank'
                  className={cn(styles.siteLink, styles.link)}
                >
                  {link.text}
                </a>
              ))}
            </div>
            <div className={styles.siteLinksColumnContainer}>
              <p className={styles.siteLinksColumnTitle}>{messages.socials}</p>
              {socialLinks.map(({ Icon, link, text }, idx) => (
                <a
                  key={idx}
                  href={link}
                  target='_blank'
                  className={styles.socialIconLinkContainer}
                >
                  <Icon className={styles.socialIconLink} />
                  {text}
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className={styles.divider}></div>
        <div className={styles.linksContainer}>
          <div className={styles.rightsContainer}>
            {!props.isMobile ? (
              <div>{messages.copyright(new Date().getFullYear())}</div>
            ) : null}
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
            {props.isMobile ? (
              <div>{messages.copyright(new Date().getFullYear())}</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Footer
