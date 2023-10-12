// eslint-disable-next-line no-restricted-imports -- TODO: migrate to @react-spring/web
import { useSpring, animated } from 'react-spring'

import investorKatyPerry from 'assets/img/publicSite/Investor-Katy-Perry.webp'
import investorNas from 'assets/img/publicSite/Investor-Nas.webp'
import investorJasonDerulo from 'assets/img/publicSite/Investor-Jason-Derulo.webp'
import investorTheChainsmokers from 'assets/img/publicSite/Investor-The-Chainsmokers.webp'
import investorPushaT from 'assets/img/publicSite/Investor-Pusha-T.webp'
import useHasViewed from 'hooks/useHasViewed'
import cn from 'classnames'

import styles from './ArtistInvestors.module.css'

const messages = {
  title: 'Our Artist Investors',
  subtitle: 'We built Audius with you in mind and with them by our side.',
  manyMore: 'And so many more!'
}

type AristProps = {
  name: string
  handle: string
  imageUrl: string
}

const Artist = (props: AristProps) => {
  return (
    <div className={styles.cardMoveContainer}>
      <div className={styles.artistContainer}>
        <div className={styles.artistImageWrapper}>
          <animated.img src={props.imageUrl} className={styles.artistImage} />
        </div>
        <div className={styles.artistName}>{props.name}</div>
      </div>
    </div>
  )
}

const MobileArtist = (props: AristProps) => {
  return (
    <div className={styles.artistCard}>
      <div className={styles.artistImageWrapper}>
        <img
          src={props.imageUrl}
          className={styles.artistImage}
          alt='Audius Artist'
        />
      </div>
      <div className={styles.artistName}>{props.name}</div>
    </div>
  )
}

const artists = [
  {
    name: 'Katy Perry',
    handle: 'katyperry',
    imageUrl: investorKatyPerry
  },
  {
    name: 'Nas',
    handle: 'nas',
    imageUrl: investorNas
  },
  {
    name: 'Jason Derulo',
    handle: 'jasonderulo',
    imageUrl: investorJasonDerulo
  },
  {
    name: 'The Chainsmokers',
    handle: 'thechainsmokers',
    imageUrl: investorTheChainsmokers
  },
  {
    name: 'Pusha T',
    handle: 'pushat',
    imageUrl: investorPushaT
  }
]

type ArtistInvestorsProps = {
  isMobile: boolean
}

const ArtistInvestors = (props: ArtistInvestorsProps) => {
  // Animate in the title and subtitle text
  const [hasViewed, refInView] = useHasViewed()
  const titleStyles = useSpring({
    config: { mass: 3, tension: 2000, friction: 500 },
    opacity: hasViewed ? 1 : 0,
    x: hasViewed ? 0 : 120
  })

  if (props.isMobile) {
    return (
      <div className={styles.mobileContainer}>
        <h3 className={styles.title}>{messages.title}</h3>
        <h3 className={styles.subTitle}>{messages.subtitle}</h3>
        <div className={styles.artistsContainer}>
          {artists.map((artist, i) => (
            <MobileArtist key={artist.handle} {...artist} />
          ))}
        </div>
        <h3 className={cn(styles.subTitle, styles.manyMore)}>{messages.manyMore}</h3>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div ref={refInView} className={styles.content}>
        <div className={styles.foreground}>
          <div className={styles.animateTitleContainer}>
            <animated.div
              style={{
                opacity: titleStyles.opacity,
                transform: titleStyles.x.interpolate(
                  (x) => `translate3d(0,${x}px,0)`
                ),
                width: '100%'
              }}
            >
              <h3 className={styles.title}>{messages.title}</h3>
              <h3 className={styles.subTitle}>{messages.subtitle}</h3>
            </animated.div>
          </div>
          <div className={styles.artistsContainer}>
            {artists.map((artist) => (
              <Artist key={artist.handle} {...artist} />
            ))}
          </div>
          <h3 className={styles.subTitle}>{messages.manyMore}</h3>
        </div>
      </div>
    </div>
  )
}

export default ArtistInvestors
