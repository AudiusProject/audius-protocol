import { useEffect, useState } from 'react'

import { UserCollectionMetadata } from '@audius/common'
import { useSpring, animated } from 'react-spring'
import { useAsyncFn } from 'react-use'

import audiusExclusivesPlaylistImg from 'assets/img/publicSite/AudiusExclusivesPlaylistArt.png'
import audiusWeeklyPlaylistImg from 'assets/img/publicSite/AudiusWeeklyPlaylistArt.png'
import hotAndNewPlaylistImg from 'assets/img/publicSite/HotAndNewPlaylistArt.jpeg'
import { ReactComponent as IconLines } from 'assets/img/publicSite/Lines.svg'
import moombahtonPlaylistImg from 'assets/img/publicSite/MoombahtonPlaylistArt.png'
import { ReactComponent as IconListenOnAudius } from 'assets/img/publicSite/listen-on-audius.svg'
import { fetchExploreContent } from 'common/store/pages/explore/sagas'
import { handleClickRoute } from 'components/public-site/handleClickRoute'
import useCardWeight from 'hooks/useCardWeight'
import useHasViewed from 'hooks/useHasViewed'
import AudiusBackend from 'services/AudiusBackend'
import { getCreatorNodeIPFSGateways } from 'utils/gatewayUtil'
import { playlistPage } from 'utils/route'

import styles from './FeaturedContent.module.css'

const messages = {
  title: 'Featured Content',
  subTitle: 'Check out the playlists we are listening to right now'
}

type PlaylistTileProps = {
  title: string
  artist: string
  imageUrl: string | null
  onClick: () => void
}

const FALLBACK_PLAYLISTS = [
  {
    title: 'Audius Exclusives',
    artist: 'Audius',
    imageUrl: audiusExclusivesPlaylistImg,
    link: '/audius/playlist/official-audius-exclusives-1428'
  },
  {
    title: 'MOOMBAHTON COMES TO AUDIUS',
    artist: 'Moombahton',
    imageUrl: moombahtonPlaylistImg,
    link: '/moombahton/playlist/moombahton-comes-to-audius-9601'
  },
  {
    title: 'Hot & New On Audius 🔥',
    artist: 'Audius',
    imageUrl: hotAndNewPlaylistImg,
    link: '/audius/playlist/hot-new-on-audius-%F0%9F%94%A5-4281'
  },
  {
    title: 'Audius Weekly',
    artist: 'Audius',
    imageUrl: audiusWeeklyPlaylistImg,
    link: '/3lau/is-it-love-feat.-yeah-boy-1151'
  }
]

const DesktopPlaylistTile = (props: PlaylistTileProps) => {
  const [cardRef, onMove, onLeave, transform] = useCardWeight({
    sensitivity: 1.8
  })
  const [mouseDown, setMouseDown] = useState(false)
  return (
    <div
      className={styles.trackMoveContainer}
      ref={cardRef}
      // @ts-ignore
      onClick={props.onClick}
      onMouseMove={onMove}
      onMouseLeave={() => {
        onLeave()
        setMouseDown(false)
      }}
      onMouseUp={() => setMouseDown(false)}
      onMouseDown={() => setMouseDown(true)}>
      <animated.div
        className={styles.trackContainer}
        // @ts-ignore
        style={{ transform: mouseDown ? '' : transform }}>
        <div
          className={styles.track}
          style={{
            backgroundImage: `url(${props.imageUrl})`,
            boxShadow: `0px 10px 50px -2px rgba(56, 14, 13, 0.4)`
          }}>
          <div className={styles.trackContent}>
            <div className={styles.trackArtist}>{`By ${props.artist}`}</div>
            <IconListenOnAudius className={styles.listenOnAudius} />
          </div>
        </div>
      </animated.div>
      <div className={styles.trackTitleContainer}>
        <span className={styles.trackTitle}>{props.title}</span>
      </div>
    </div>
  )
}

const MobilePlaylistTile = (props: PlaylistTileProps) => (
  <div
    key={props.title}
    className={styles.trackContainer}
    onClick={props.onClick}>
    <div
      className={styles.trackImage}
      style={{
        backgroundImage: `url(${
          props.imageUrl || audiusExclusivesPlaylistImg
        })`,
        boxShadow: `0px 10px 50px -2px rgba(56, 14, 13, 0.4)`
      }}></div>
    <div className={styles.trackTitle}>{props.title}</div>
  </div>
)

type FeaturedContentProps = {
  isMobile: boolean
  setRenderPublicSite: (shouldRender: boolean) => void
}

const getImageUrl = (
  size: 'small' | 'large',
  { cover_art, cover_art_sizes }: UserCollectionMetadata,
  creatorNodeEndpoint: string | null
) => {
  const gateways = getCreatorNodeIPFSGateways(creatorNodeEndpoint)
  const cNode = gateways[0]
  if (cover_art_sizes) {
    return `${cNode}${cover_art_sizes}/${
      size === 'small' ? '150x150' : '1000x1000'
    }.jpg`
  } else if (cover_art_sizes) {
    return `${cNode}${cover_art}`
  } else {
    return null
  }
}

const FeaturedContent = (props: FeaturedContentProps) => {
  const [trendingPlaylistsResponse, fetchTrendingPlaylists] =
    useAsyncFn(async () => {
      const featuredContent = await fetchExploreContent()
      const ids = featuredContent.featuredPlaylists
      const playlists = AudiusBackend.getPlaylists(
        null,
        ids
      ) as any as UserCollectionMetadata[]
      return playlists
    }, [])

  useEffect(() => {
    fetchTrendingPlaylists()
  }, [fetchTrendingPlaylists])
  // Animate in the title and subtitle text
  const [hasViewed, refInView] = useHasViewed(0.8)

  const textStyles = useSpring({
    config: { mass: 3, tension: 2000, friction: 500 },
    opacity: hasViewed ? 1 : 0,
    x: hasViewed ? 0 : 150
  })

  if (props.isMobile) {
    return (
      <div className={styles.mobileContainer}>
        <h3 className={styles.title}>{messages.title}</h3>
        <h4 className={styles.subTitle}>{messages.subTitle}</h4>
        <div className={styles.tracksContainer}>
          {trendingPlaylistsResponse.value == null ||
          trendingPlaylistsResponse.value.length < 4
            ? FALLBACK_PLAYLISTS.map((p) => (
                <MobilePlaylistTile
                  key={p.link}
                  {...p}
                  onClick={handleClickRoute(p.link, props.setRenderPublicSite)}
                />
              ))
            : trendingPlaylistsResponse.value
                .slice(0, 4)
                .map((p) => (
                  <MobilePlaylistTile
                    key={p.playlist_id}
                    title={p.playlist_name}
                    artist={p.user.name}
                    imageUrl={getImageUrl(
                      'small',
                      p,
                      p.user.creator_node_endpoint
                    )}
                    onClick={handleClickRoute(
                      playlistPage(
                        p.user.handle,
                        p.playlist_name,
                        p.playlist_id
                      ),
                      props.setRenderPublicSite
                    )}
                  />
                ))}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container} ref={refInView}>
      <div className={styles.content}>
        <div className={styles.animateTitleContainer}>
          <animated.div
            style={{
              transform: textStyles.x.interpolate(
                (x) => `translate3d(0,${x}px,0)`
              )
            }}>
            <div className={styles.header}>
              <h3 className={styles.title}>{messages.title}</h3>
              <h4 className={styles.subTitle}>{messages.subTitle}</h4>
            </div>
          </animated.div>
        </div>
        <div className={styles.tracksContainer}>
          {trendingPlaylistsResponse.value == null ||
          trendingPlaylistsResponse.value.length < 4
            ? FALLBACK_PLAYLISTS.map((p) => (
                <DesktopPlaylistTile
                  key={p.title}
                  {...p}
                  onClick={handleClickRoute(p.link, props.setRenderPublicSite)}
                />
              ))
            : trendingPlaylistsResponse.value
                .slice(0, 4)
                .map((p) => (
                  <DesktopPlaylistTile
                    key={p.playlist_id}
                    title={p.playlist_name}
                    artist={p.user.name}
                    imageUrl={getImageUrl(
                      'large',
                      p,
                      p.user.creator_node_endpoint
                    )}
                    onClick={handleClickRoute(
                      playlistPage(
                        p.user.handle,
                        p.playlist_name,
                        p.playlist_id
                      ),
                      props.setRenderPublicSite
                    )}
                  />
                ))}
        </div>
      </div>
      <IconLines className={styles.lines} />
    </div>
  )
}

export default FeaturedContent
