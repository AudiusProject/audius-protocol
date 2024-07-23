import { useCallback, useMemo } from 'react'

import type { PlaylistTrackId } from '@audius/common/models'
import { useField } from 'formik'
import { View } from 'react-native'

import { Divider, Text } from 'app/components/core'
import { TrackList } from 'app/components/track-list'
import { makeStyles } from 'app/styles'

const messages = {
  reorderTitle: 'Drag Tracks to Reorder'
}

const useStyles = makeStyles(({ palette, spacing, typography }) => ({
  reorderTitle: {
    fontFamily: typography.fontByWeight.demiBold,
    fontSize: typography.fontSize.large,
    color: palette.neutral,
    margin: spacing(4),
    marginTop: spacing(6),
    marginBottom: spacing(2)
  },
  trackList: {
    marginBottom: spacing(4)
  }
}))

export const TrackListFieldArray = () => {
  const styles = useStyles()
  const [{ value }, , { setValue }] = useField<PlaylistTrackId[]>(
    'playlist_contents.track_ids'
  )

  const trackIds = useMemo(() => value.map(({ track }) => track), [value])

  const handleReorder = useCallback(
    ({ from, to }) => {
      const newValue = [...value]
      const track = newValue[from]
      newValue.splice(from, 1)
      newValue.splice(to, 0, track)
      setValue(newValue)
    },
    [value, setValue]
  )

  const handleRemove = useCallback(
    (index: number) => {
      const newValue = [...value]
      newValue.splice(index, 1)
      setValue(newValue)
    },
    [value, setValue]
  )

  if (value.length === 0) {
    return null
  }

  return (
    <>
      <View>
        <Text style={styles.reorderTitle}>{messages.reorderTitle}</Text>
      </View>
      <TrackList
        hideArt
        isReorderable
        onReorder={handleReorder}
        onRemove={handleRemove}
        ids={trackIds}
        style={styles.trackList}
        trackItemAction='remove'
      />
      <Divider />
    </>
  )
}
