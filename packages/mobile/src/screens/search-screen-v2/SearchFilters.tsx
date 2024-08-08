import { useState } from 'react'

import {
  convertGenreLabelToValue,
  GENRES,
  MUSICAL_KEYS
} from '@audius/common/utils'
import { Image } from 'react-native'

import { FilterButton } from '@audius/harmony-native'
import { SegmentedControl } from 'app/components/core'
import { moodMap } from 'app/utils/moods'

import { ListSelectionScreen } from '../list-selection-screen'

import { useSearchFilter } from './searchState'

const messages = {
  genre: 'Genre',
  genreFilterLabel: 'Search Genre',
  mood: 'Mood',
  moodFilterLabel: 'Search Mood',
  key: 'Key',
  isPremium: 'Premium',
  isVerified: 'Verified',
  hasDownloads: 'Downloads Available',
  major: 'Major',
  minor: 'Minor'
}

const genreOptions = GENRES.map((genre) => ({
  label: genre,
  value: convertGenreLabelToValue(genre)
}))

export const GenreFilter = () => {
  const [genre, setGenre] = useSearchFilter('genre')

  return (
    <FilterButton
      label={messages.genre}
      value={genre}
      onChange={setGenre}
      options={genreOptions}
      size='small'
    />
  )
}

const moodOptions = Object.keys(moodMap)
  .sort()
  .map((mood) => ({
    label: mood,
    value: mood,
    leadingElement: (
      <Image source={moodMap[mood]} style={{ height: 16, width: 16 }} />
    )
  }))

export const MoodFilter = () => {
  const [mood, setMood] = useSearchFilter('mood')

  return (
    <FilterButton
      label={messages.mood}
      value={mood}
      onChange={setMood}
      options={moodOptions}
      size='small'
    />
  )
}

const getValueFromKey = (key: string) =>
  // If the key is an enharmonic equivalent (e.g. C# and Db), use the flat as the value
  key.includes('/') ? key.split('/')[1] : key

const keyOptions = MUSICAL_KEYS.map((k) => ({
  label: k,
  value: getValueFromKey(k)
}))

const FilterKeyScreen = (props) => {
  const { value, ...other } = props

  const [scale, setScale] = useState(value?.split(' ')[1] ?? 'Major')

  const keyOptions = MUSICAL_KEYS.map((k) => ({
    label: k,
    value: `${getValueFromKey(k)} ${scale}`
  }))

  return (
    <ListSelectionScreen
      {...other}
      header={
        <SegmentedControl
          options={[
            { key: 'Major', text: messages.major },
            { key: 'Minor', text: messages.minor }
          ]}
          selected={scale}
          onSelectOption={setScale}
          fullWidth
          equalWidth
        />
      }
      disableSearch
      data={keyOptions}
      value={value}
      clearable={Boolean(value && scale)}
    />
  )
}

export const KeyFilter = () => {
  const [key, setKey] = useSearchFilter('key')

  const getLabel = () => {
    if (!key) return messages.key
    const [keyValue, scale = 'Major'] = key.split(' ')
    const musicalKey = MUSICAL_KEYS.find((key) => key.match(keyValue))
    if (!musicalKey) return messages.key
    return `${musicalKey} ${scale}`
  }

  return (
    <FilterButton
      label={getLabel()}
      value={key}
      onChange={setKey}
      options={keyOptions}
      size='small'
      screen={FilterKeyScreen}
    />
  )
}

export const IsPremiumFilter = () => {
  const [isPremium, setIsPremium] = useSearchFilter('isPremium')

  return (
    <FilterButton
      label={messages.isPremium}
      value={isPremium?.toString()}
      onPress={() => setIsPremium(isPremium ? undefined : true)}
      size='small'
    />
  )
}

export const IsVerifiedFilter = () => {
  const [isVerified, setIsVerified] = useSearchFilter('isVerified')

  return (
    <FilterButton
      label={messages.isVerified}
      value={isVerified?.toString()}
      onPress={() => {
        setIsVerified(isVerified ? undefined : true)
      }}
      size='small'
    />
  )
}
