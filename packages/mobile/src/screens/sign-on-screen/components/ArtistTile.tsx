import { useCallback } from 'react'

import type { ID, UserMetadata } from '@audius/common'
import { useField } from 'formik'
import { Pressable } from 'react-native'

import { Text } from 'app/components/core'

type ArtistTileProps = {
  user: UserMetadata
}

export const ArtistTile = (props: ArtistTileProps) => {
  const [{ value: selectedArtists }, , { setValue }] = useField<ID[]>('artists')
  const { user } = props
  const { user_id, name } = user
  const checked = selectedArtists.includes(user_id)

  const handleChange = useCallback(() => {
    const newArtists = checked
      ? selectedArtists.filter((value) => value !== user_id)
      : [user_id, ...selectedArtists]

    setValue(newArtists)
  }, [selectedArtists, checked, setValue, user_id])

  return (
    <Pressable
      key={user_id}
      testID={`artist-${name}`}
      accessibilityRole='checkbox'
      accessibilityState={{ checked }}
      accessibilityLiveRegion='polite'
      onPress={handleChange}
      style={{
        backgroundColor: checked ? 'purple' : undefined
      }}
    >
      <Text>{name}</Text>
    </Pressable>
  )
}
