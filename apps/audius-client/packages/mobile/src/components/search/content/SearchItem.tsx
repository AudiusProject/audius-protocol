import React, { useCallback } from 'react'
import { StyleSheet, View, Text, TouchableHighlight } from 'react-native'
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
import useSearchHistory from '../../../store/search/hooks'
import { usePushSearchRoute } from '../utils'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
    height: 58
  },
  name: {
    fontSize: 14,
    fontFamily: 'AvenirNextLTPro-Medium'
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

type ItemContainerProps = { isLast: boolean; onPress: () => void }
const ItemContainer: React.FunctionComponent<ItemContainerProps> = ({
  isLast,
  onPress,
  children
}) => {
  const color = useColor('neutralLight4')
  const backgroundColor = useColor('neutralLight8')
  const containerStyle = useTheme(styles.container, {
    borderBottomColor: 'neutralLight8'
  })
  const viewStyle = isLast ? styles.container : containerStyle
  return (
    <TouchableHighlight underlayColor={backgroundColor} onPress={onPress}>
      <View style={viewStyle}>
        {children}
        <IconArrow fill={color} height={18} width={18} />
      </View>
    </TouchableHighlight>
  )
}

type UserSearchResultProps = { isLast: boolean; item: SearchUser }
const UserSearchResult = ({ isLast, item: user }: UserSearchResultProps) => {
  const nameStyle = useTheme(styles.name, { color: 'neutral' })
  const imageStyle = useTheme(styles.userImage, {
    backgroundColor: 'neutralLight4'
  })
  const pushRoute = usePushSearchRoute()
  const { appendSearchItem } = useSearchHistory()
  const onPress = useCallback(() => {
    appendSearchItem(user.name)
    const userRoute = getUserRoute(user)
    pushRoute(userRoute, 'search')
  }, [user, pushRoute, appendSearchItem])

  return (
    <ItemContainer isLast={isLast} onPress={onPress}>
      <UserImage user={user} imageStyle={imageStyle} />
      <UserBadges
        style={styles.badgeContainer}
        nameStyle={nameStyle}
        user={user}
      />
    </ItemContainer>
  )
}

type TrackSearchResultProps = { isLast: boolean; item: SearchTrack }
const TrackSearchResult = ({ isLast, item: track }: TrackSearchResultProps) => {
  const nameStyle = useTheme(styles.name, { color: 'neutral' })
  const userNameStyle = useTheme(styles.name, { color: 'neutralLight4' })
  const squareImageStyles = useTheme(styles.squareImage, {
    backgroundColor: 'neutralLight4'
  })

  const pushRoute = usePushSearchRoute()
  const { appendSearchItem } = useSearchHistory()
  const onPress = useCallback(() => {
    appendSearchItem(track.title)
    const trackRoute = getTrackRoute(track)
    pushRoute(trackRoute, 'search')
  }, [track, pushRoute, appendSearchItem])

  return (
    <ItemContainer isLast={isLast} onPress={onPress}>
      <TrackImage
        track={track}
        user={track.user}
        imageStyle={squareImageStyles}
      />
      <View style={styles.nameContainer}>
        <Text numberOfLines={1} style={nameStyle}>
          {track.title}
        </Text>
        <UserBadges
          style={styles.badgeContainer}
          nameStyle={userNameStyle}
          user={track.user}
        />
      </View>
    </ItemContainer>
  )
}

type PlaylistSearchResultProps = { isLast: boolean; item: SearchPlaylist }
const PlaylistSearchResult = ({
  isLast,
  item: playlist
}: PlaylistSearchResultProps) => {
  const nameStyle = useTheme(styles.name, { color: 'neutral' })
  const userNameStyle = useTheme(styles.name, { color: 'neutralLight4' })
  const squareImageStyles = useTheme(styles.squareImage, {
    backgroundColor: 'neutralLight4'
  })

  const pushRoute = usePushSearchRoute()
  const { appendSearchItem } = useSearchHistory()
  const onPress = useCallback(() => {
    appendSearchItem(playlist.playlist_name)
    const collectionRoute = getCollectionRoute(playlist as any)
    pushRoute(collectionRoute, 'search')
  }, [playlist, pushRoute, appendSearchItem])

  return (
    <ItemContainer isLast={isLast} onPress={onPress}>
      <PlaylistImage
        playlist={playlist}
        user={playlist.user}
        imageStyle={squareImageStyles}
      />
      <View style={styles.nameContainer}>
        <Text numberOfLines={1} style={nameStyle}>
          {playlist.playlist_name}
        </Text>
        <UserBadges
          style={styles.badgeContainer}
          nameStyle={userNameStyle}
          user={playlist.user}
        />
      </View>
    </ItemContainer>
  )
}

type AlbumSearchResultProps = { isLast: boolean; item: SearchPlaylist }
const AlbumSearchResult = ({
  isLast,
  item: playlist
}: AlbumSearchResultProps) => {
  const nameStyle = useTheme(styles.name, { color: 'neutral' })
  const userNameStyle = useTheme(styles.name, { color: 'neutralLight4' })
  const squareImageStyles = useTheme(styles.squareImage, {
    backgroundColor: 'neutralLight4'
  })

  const pushRoute = usePushSearchRoute()
  const { appendSearchItem } = useSearchHistory()
  const onPress = useCallback(() => {
    appendSearchItem(playlist.playlist_name)
    const collectionRoute = getCollectionRoute(playlist as any)
    pushRoute(collectionRoute, 'search')
  }, [playlist, pushRoute, appendSearchItem])

  return (
    <ItemContainer isLast={isLast} onPress={onPress}>
      <PlaylistImage
        playlist={playlist}
        user={playlist.user}
        imageStyle={squareImageStyles}
      />
      <View style={styles.nameContainer}>
        <Text numberOfLines={1} style={nameStyle}>
          {playlist.playlist_name}
        </Text>
        <UserBadges
          style={styles.badgeContainer}
          nameStyle={userNameStyle}
          user={playlist.user}
        />
      </View>
    </ItemContainer>
  )
}

type SearchItemProps = {
  isLast: boolean
  type: SectionHeader
  item: SearchUser | SearchTrack | SearchPlaylist
}
const SearchItem = ({ isLast, type, item }: SearchItemProps) => {
  switch (type) {
    case 'users':
      return <UserSearchResult isLast={isLast} item={item as SearchUser} />
    case 'tracks':
      return <TrackSearchResult isLast={isLast} item={item as SearchTrack} />
    case 'playlists':
      return (
        <PlaylistSearchResult isLast={isLast} item={item as SearchPlaylist} />
      )
    case 'albums':
      return <AlbumSearchResult isLast={isLast} item={item as SearchPlaylist} />
    default:
      return null
  }
}

export default SearchItem
