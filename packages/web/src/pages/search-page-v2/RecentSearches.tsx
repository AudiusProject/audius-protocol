import { ID, Kind } from '@audius/common/models'
import { searchSelectors } from '@audius/common/store'
import { Button, Flex, Paper, Text } from '@audius/harmony'
import { useSelector } from 'react-redux'
const { getSearchHistory } = searchSelectors

const messages = {
  title: 'Recent searches',
  clear: 'Clear Recent Searches'
}

type RecentSearchProps = {
  kind: Kind
  id: ID
}

const RecentSearch = (props: RecentSearchProps) => {
  const { track, onAddTrack } = props
  const { track_id, title, owner_id } = track
  const user = useSelector((state) => getUser(state, { id: owner_id }))
  const image = useTrackCoverArt2(track_id, SquareSizes.SIZE_150_BY_150)

  const handleAddTrack = useCallback(() => {
    onAddTrack(track_id)
  }, [onAddTrack, track_id])

  return (
    <div className={styles.suggestedTrack}>
      <div className={styles.trackDetails}>
        <DynamicImage wrapperClassName={styles.trackArtwork} image={image} />
        <div className={styles.trackInfo}>
          <p className={styles.trackName}>{title}</p>
          {user ? (
            <UserNameAndBadges
              classes={{ name: styles.artistName }}
              user={user}
            />
          ) : null}
        </div>
      </div>
      <Button variant='secondary' size='small' onClick={handleAddTrack}>
        {messages.addTrack}
      </Button>
    </div>
  )
}

export const RecentSearches = () => {
  const recentSearches = useSelector(getSearchHistory)

  return (
    <Paper
      p='xl'
      css={{ width: '100%', maxWidth: '688px' }}
      direction='column'
      gap='l'
    >
      <Text variant='heading' size='s' css={{ alignSelf: 'flex-start' }}>
        {messages.title}
      </Text>
      <Flex>
        {recentSearches.map((recentSearch) => (
          <></>
          //   <RecentSearch />
        ))}
      </Flex>
      <Button
        variant='secondary'
        size='small'
        fullWidth={false}
        css={{ alignSelf: 'center' }}
      >
        {messages.clear}
      </Button>
    </Paper>
  )
}
