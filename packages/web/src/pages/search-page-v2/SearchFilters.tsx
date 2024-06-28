import { ReactElement, useMemo, useState } from 'react'

import {
  GENRES,
  MUSICAL_KEYS,
  convertGenreLabelToValue
} from '@audius/common/utils'
import {
  OptionsFilterButton,
  Flex,
  FilterButton,
  FilterButtonOptions,
  Popup,
  Paper,
  SegmentedControl,
  IconCaretDown,
  Divider,
  Box
} from '@audius/harmony'
import { useSearchParams } from 'react-router-dom-v5-compat'

import { BpmFilter } from './BpmFilter'
import { Filter } from './types'
import { MOODS, useUpdateSearchParams } from './utils'

const messages = {
  genre: 'Genre',
  genreSearchPlaceholder: 'Search Genre',
  mood: 'Mood',
  moodSearchPlaceholder: 'Search Mood',
  key: 'Key',
  isPremium: 'Premium',
  isVerified: 'Verified',
  hasDownloads: 'Downloads Available'
}

const GenreFilter = () => {
  const [urlSearchParams] = useSearchParams()
  const genre = urlSearchParams.get('genre')
  const updateSearchParams = useUpdateSearchParams('genre')

  return (
    <OptionsFilterButton
      label={messages.genre}
      popupAnchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      popupMaxHeight={400}
      popupTransformOrigin={{ vertical: 'top', horizontal: 'left' }}
      selection={genre}
      onChange={updateSearchParams}
      options={GENRES.map((genre) => ({
        label: genre,
        value: convertGenreLabelToValue(genre)
      }))}
      showFilterInput
      filterInputPlaceholder={messages.genreSearchPlaceholder}
    />
  )
}

const MoodFilter = () => {
  const [urlSearchParams] = useSearchParams()
  const mood = urlSearchParams.get('mood')
  const updateSearchParams = useUpdateSearchParams('mood')
  const sortedKeys = Object.keys(MOODS).sort()

  const moodCss = {
    '& .emoji': {
      marginBottom: 0
    }
  }
  const moodLabelCss = {
    '& .emoji': {
      marginBottom: 0,
      height: 16,
      width: 16
    }
  }

  const moodOptions = sortedKeys.map((mood) => ({
    label: MOODS[mood].label,
    value: MOODS[mood].value,
    leadingElement: <Box css={moodCss}>{MOODS[mood].icon}</Box>,
    labelLeadingElement: <Flex css={moodLabelCss}>{MOODS[mood].icon}</Flex>
  }))

  return (
    <OptionsFilterButton
      label={messages.mood}
      popupAnchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      popupMaxHeight={400}
      popupTransformOrigin={{ vertical: 'top', horizontal: 'left' }}
      selection={mood}
      onChange={updateSearchParams}
      options={moodOptions}
      showFilterInput
      filterInputPlaceholder={messages.moodSearchPlaceholder}
    />
  )
}

const KeyFilter = () => {
  const [urlSearchParams] = useSearchParams()
  const key = urlSearchParams.get('key')
  const updateSearchParams = useUpdateSearchParams('key')
  const [scale, setScale] = useState(key?.split(' ')[1] ?? 'Major')
  const keyOptions = MUSICAL_KEYS.map((k) => {
    const keyParts = k.split('/')
    return {
      label: k,
      // If the key is an enharmonic equivalent (e.g. C# and Db), use the flat as the value
      value: keyParts.length > 1 ? keyParts[1] : k
    }
  })

  const label = useMemo(() => {
    const pitch = key?.split(' ')[0]
    return keyOptions.find((option) => option.value === pitch)?.label
  }, [key, keyOptions])

  return (
    <FilterButton
      value={key}
      label={label ? `${label} ${scale}` : messages.key}
      onChange={updateSearchParams}
      iconRight={IconCaretDown}
    >
      {({ handleChange, isOpen, setIsOpen, anchorRef }) => (
        <Popup
          anchorRef={anchorRef}
          isVisible={isOpen}
          onClose={() => setIsOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        >
          <Paper mt='s' border='strong' shadow='far' css={{ minWidth: 200 }}>
            <Flex
              w='100%'
              gap='s'
              pv='s'
              direction='column'
              alignItems='flex-start'
              role='listbox'
            >
              <Box w='100%' ph='s'>
                <SegmentedControl
                  fullWidth
                  options={[
                    { key: 'Major', text: 'Major' },
                    { key: 'Minor', text: 'Minor' }
                  ]}
                  selected={scale}
                  onSelectOption={setScale}
                />
              </Box>
              <Divider css={{ width: '100%' }} />
              <Flex direction='column' w='100%' ph='s'>
                <FilterButtonOptions
                  options={keyOptions}
                  onChange={(option) =>
                    handleChange(`${option.value} ${scale}`)
                  }
                />
              </Flex>
            </Flex>
          </Paper>
        </Popup>
      )}
    </FilterButton>
  )
}

const IsPremiumFilter = () => {
  const [urlSearchParams] = useSearchParams()
  const isPremium = urlSearchParams.get('isPremium')
  const updateSearchParams = useUpdateSearchParams('isPremium')

  return (
    <FilterButton
      label={messages.isPremium}
      value={isPremium}
      onClick={() => updateSearchParams(isPremium ? '' : 'true')}
    ></FilterButton>
  )
}

const HasDownloadsFilter = () => {
  const [urlSearchParams] = useSearchParams()
  const hasDownloads = urlSearchParams.get('hasDownloads')
  const updateSearchParams = useUpdateSearchParams('hasDownloads')

  return (
    <FilterButton
      label={messages.hasDownloads}
      value={hasDownloads}
      onClick={() => {
        updateSearchParams(hasDownloads ? '' : 'true')
      }}
    ></FilterButton>
  )
}

const IsVerifiedFilter = () => {
  const [urlSearchParams] = useSearchParams()
  const isVerified = urlSearchParams.get('isVerified')
  const updateSearchParams = useUpdateSearchParams('isVerified')

  return (
    <FilterButton
      label={messages.isVerified}
      value={isVerified}
      onClick={() => {
        updateSearchParams(isVerified ? '' : 'true')
      }}
    ></FilterButton>
  )
}

export const filters: Record<Filter, () => ReactElement> = {
  genre: GenreFilter,
  mood: MoodFilter,
  key: KeyFilter,
  bpm: BpmFilter,
  isPremium: IsPremiumFilter,
  hasDownloads: HasDownloadsFilter,
  isVerified: IsVerifiedFilter
}
