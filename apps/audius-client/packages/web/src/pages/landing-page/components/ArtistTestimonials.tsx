import { Parallax } from 'react-scroll-parallax'
import { useSpring, animated } from 'react-spring'

import artist3lau from 'assets/img/publicSite/ImgArtist3LAU.jpg'
import artistAlinaBaraz from 'assets/img/publicSite/ImgArtistAlinaBaraz.jpg'
import artistDeadmau5 from 'assets/img/publicSite/ImgArtistDeadmau5.jpg'
import artistJasonDerulo from 'assets/img/publicSite/ImgArtistJasonDerulo.jpg'
import artistKatyPerry from 'assets/img/publicSite/ImgArtistKatyPerry.jpg'
import artistNas from 'assets/img/publicSite/ImgArtistNas.jpg'
import artistRezz from 'assets/img/publicSite/ImgArtistREZZ.jpg'
import artistSkrillex from 'assets/img/publicSite/ImgArtistSkrillex.jpg'
import artistSteveAoki from 'assets/img/publicSite/ImgArtistSteveAoki.jpg'
import artistChainsmokers from 'assets/img/publicSite/ImgArtistTheChainsmokers.jpg'
import dots2x from 'assets/img/publicSite/dots@2x.jpg'
import useHasViewed from 'hooks/useHasViewed'

import styles from './ArtistTestimonials.module.css'

const messages = {
  title: 'Built With The Best',
  subtitle: 'We designed it with you in mind and with them by our side.'
}

type AristProps = {
  imageUrl: string
  name: string
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

type MobileArtistProps = {
  imageUrl: string
  name: string
}
const MobileArtist = (props: MobileArtistProps) => {
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

const MobileOverflowArtist = (props: MobileArtistProps) => {
  return (
    <div className={styles.overflowArtistCard}>
      <img
        src={props.imageUrl}
        className={styles.artistImage}
        alt='Audius Artist'
      />
    </div>
  )
}

const artists = [
  {
    name: 'deadmau5',
    imageUrl: artistDeadmau5
  },
  {
    name: 'Katy Perry',
    imageUrl: artistKatyPerry
  },
  {
    name: 'Nas',
    imageUrl: artistNas
  },
  {
    name: 'Jason Derulo',
    imageUrl: artistJasonDerulo
  },
  {
    name: 'Steve Aoki',
    imageUrl: artistSteveAoki
  },
  {
    name: 'SKRILLEX',
    imageUrl: artistSkrillex
  },
  {
    name: 'REZZ',
    imageUrl: artistRezz
  },
  {
    name: 'The Chainsmokers',
    imageUrl: artistChainsmokers
  },
  {
    name: 'alina baraz',
    imageUrl: artistAlinaBaraz
  },
  {
    name: '3LAU',
    imageUrl: artist3lau
  }
]

type ArtistTestimonialsProps = {
  isMobile: boolean
}

const ArtistTestimonials = (props: ArtistTestimonialsProps) => {
  // Animate in the title and subtitle text
  const [hasViewed, refInView] = useHasViewed()
  // @ts-ignore
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
          {artists.slice(0, -4).map((artist, i) => (
            <MobileArtist key={artist.name} {...artist} />
          ))}
        </div>
        <div className={styles.overflowArtistsContainer}>
          {artists.slice(-4).map(artist => (
            <MobileOverflowArtist key={artist.name} {...artist} />
          ))}
        </div>
        <div className={styles.overflowArtistsText}>&amp; so many more</div>
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
                // @ts-ignore
                transform: titleStyles.x.interpolate(
                  x => `translate3d(0,${x}px,0)`
                ),
                width: '100%'
              }}
            >
              <h3 className={styles.title}>{messages.title}</h3>
              <h3 className={styles.subTitle}>{messages.subtitle}</h3>
            </animated.div>
          </div>
          <div className={styles.artistsContainer}>
            {artists.map(artist => (
              <Artist key={artist.name} {...artist} />
            ))}
          </div>
        </div>
        <Parallax
          y={[-15, 30]}
          styleInner={{
            position: 'absolute',
            top: '-70px',
            height: '100%'
          }}
        >
          <div
            className={styles.dotsBackground}
            style={{ backgroundImage: `url(${dots2x})` }}
          ></div>
        </Parallax>
      </div>
    </div>
  )
}

export default ArtistTestimonials
