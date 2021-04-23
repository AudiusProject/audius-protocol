import React, { useCallback } from 'react'
import {
  StyleSheet,
  View,
  Text,
  TouchableHighlight
} from 'react-native'
import { useDispatch } from 'react-redux'
import { usePushWebRoute } from '../../../hooks/useWebAction'
import * as searchActions from '../../../store/search/actions'
import IconArrow from '../../../assets/images/iconArrow.svg'
import { useColor, useTheme } from '../../../utils/theme'
import {
  getTrackRoute,
  getUserRoute,
  getCollectionRoute
} from '../../../utils/routes'
import UserImage from '../../image/UserImage'
import TrackImage from '../../image/TrackImage'
import PlaylistImage from '../../image/PlaylistImage'
import UserBadges from '../../user-badges/UserBadges'
import { 
  SearchPlaylist,
  SearchTrack,
  SearchUser,
  SectionHeader
} from '../../../store/search/types'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderBottomWidth: 1,
    height: 58
  },
  name: {
    fontSize: 14
  },
  badgeContainer: {
    flex: 1
  },
  nameContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  },
  userImage: {
    borderRadius: 20,
    height: 40,
    width: 40,
    marginRight: 12
  },
  squareImage: {
    borderRadius: 4,
    height: 40,
    width: 40,
    marginRight: 12
  }
})

const usePushSearchRoute = () => {
  const dispatch = useDispatch()
  const onClose = useCallback(() => dispatch(searchActions.close()), [dispatch])
  const pushWebRoute = usePushWebRoute(onClose)
  return pushWebRoute
}

type ItemContainerProps = { onPress: () => void }
const ItemContainer: React.FunctionComponent<ItemContainerProps> = ({ onPress, children }) => {
  const color = useColor('neutralLight4')
  const backgroundColor = useColor('neutralLight8')
  const containerStyle = useTheme(styles.container, { borderBottomColor: 'neutralLight8' })

  return (
    <TouchableHighlight
      underlayColor={backgroundColor}
      onPress={onPress}
    >
      <View style={containerStyle}>
        {children}
        <IconArrow fill={color} height={18} width={18} />
      </View>
    </TouchableHighlight>
  )
}


type UserSearchResultProps = { item: SearchUser }
const UserSearchResult = ({ item: user }: UserSearchResultProps) => {
  const nameStyle = useTheme(styles.name, { color: 'neutral' })
  const imageStyle = useTheme(styles.userImage, { backgroundColor: 'neutralLight4' })
  const pushRoute = usePushSearchRoute()
  const onPress = useCallback(() => {
    const userRoute = getUserRoute(user)
    pushRoute(userRoute, 'search')
  }, [user, pushRoute])

  return (
    <ItemContainer onPress={onPress}>
      <UserImage user={user} imageStyle={imageStyle} />
      <UserBadges
        style={styles.badgeContainer}
        nameStyle={nameStyle}
        user={user}
      />
    </ItemContainer>
  )
}

type TrackSearchResultProps = { item: SearchTrack }
const TrackSearchResult = ({ item: track }: TrackSearchResultProps) => {
  const nameStyle = useTheme(styles.name, { color: 'neutral' })
  const userNameStyle = useTheme(styles.name, { color: 'neutralLight4' })
  const squareImageStyles = useTheme(styles.squareImage, { backgroundColor: 'neutralLight4' })

  const pushRoute = usePushSearchRoute()
  const onPress = useCallback(() => {
    const trackRoute = getTrackRoute(track)
    pushRoute(trackRoute, 'search')
  }, [track, pushRoute])

  return (
    <ItemContainer onPress={onPress}>
      <TrackImage track={track} user={track.user} imageStyle={squareImageStyles} />
      <View style={styles.nameContainer}>
        <Text numberOfLines={1} style={nameStyle}>{track.title}</Text>
        <UserBadges
          style={styles.badgeContainer}
          nameStyle={userNameStyle}
          user={track.user}
        />
      </View>
    </ItemContainer>
  )
}

type PlaylistSearchResultProps = { item: SearchPlaylist }
const PlaylistSearchResult = ({ item: playlist }: PlaylistSearchResultProps) => {
  const nameStyle = useTheme(styles.name, { color: 'neutral' })
  const userNameStyle = useTheme(styles.name, { color: 'neutralLight4' })
  const squareImageStyles = useTheme(styles.squareImage, { backgroundColor: 'neutralLight4' })

  const pushRoute = usePushSearchRoute()
  const onPress = useCallback(() => {
    const collectionRoute = getCollectionRoute(playlist as any)
    pushRoute(collectionRoute, 'search')
  }, [playlist, pushRoute])

  return (
    <ItemContainer onPress={onPress}>
      <PlaylistImage playlist={playlist} user={playlist.user} imageStyle={squareImageStyles} />
      <View style={styles.nameContainer}>
        <Text numberOfLines={1} style={nameStyle}>{playlist.playlist_name}</Text>
        <UserBadges
          style={styles.badgeContainer}
          nameStyle={userNameStyle}
          user={playlist.user}
        />
      </View>
    </ItemContainer>
  )
}

type AlbumSearchResultProps = { item: SearchPlaylist }
const AlbumSearchResult = ({ item: playlist }: AlbumSearchResultProps) => {
  const nameStyle = useTheme(styles.name, { color: 'neutral' })
  const userNameStyle = useTheme(styles.name, { color: 'neutralLight4' })
  const squareImageStyles = useTheme(styles.squareImage, { backgroundColor: 'neutralLight4' })

  const pushRoute = usePushSearchRoute()
  const onPress = useCallback(() => {
    const collectionRoute = getCollectionRoute(playlist as any)
    pushRoute(collectionRoute, 'search')
  }, [playlist, pushRoute])

  return (
    <ItemContainer onPress={onPress}>
      <PlaylistImage playlist={playlist} user={playlist.user} imageStyle={squareImageStyles} />
      <View style={styles.nameContainer}>
        <Text numberOfLines={1} style={nameStyle}>{playlist.playlist_name}</Text>
        <UserBadges
          style={styles.badgeContainer}
          nameStyle={userNameStyle}
          user={playlist.user}
        />
      </View>
    </ItemContainer>
  )
}


type SearchItemProps = { type: SectionHeader, item: SearchUser | SearchTrack | SearchPlaylist}
const SearchItem = ({ type, item }: SearchItemProps) => {
  switch (type) {
    case 'users':
      return <UserSearchResult item={item as SearchUser} />;
    case 'tracks':
      return <TrackSearchResult item={item as SearchTrack} />;
    case 'playlists':
      return <PlaylistSearchResult item={item as SearchPlaylist} />;
    case 'albums':
      return <AlbumSearchResult item={item as SearchPlaylist} />;
    default:
      return null
  }
}

export default SearchItem

