import { useCallback, useState } from 'react'

import {
  Button,
  Flex,
  IconCaretDown,
  IconCaretUp,
  IconComponent,
  IconSortDown,
  IconSortUp
} from '@audius/harmony-native'

import { Screen, SegmentedControl } from 'app/components/core'
import { SelectionItemList } from '../list-selection-screen/SelectionItemList'
import { useNavigation } from 'app/hooks/useNavigation'
import { useRoute } from '@react-navigation/native'
import { GetCoinsSortMethodEnum, GetCoinsSortDirectionEnum } from '@audius/sdk'

const messages = {
  title: 'SORT',
  ascending: 'Ascending',
  descending: 'Descending',
  price: 'Price',
  marketCap: 'Market Cap',
  volume: 'Volume',
  launchDate: 'Launch Date',
  holders: 'Holders',
  done: 'Done'
}

const sortOptions = [
  { value: GetCoinsSortMethodEnum.Price, label: messages.price },
  { value: GetCoinsSortMethodEnum.Volume, label: messages.volume },
  { value: GetCoinsSortMethodEnum.MarketCap, label: messages.marketCap },
  { value: GetCoinsSortMethodEnum.CreatedAt, label: messages.launchDate },
  { value: GetCoinsSortMethodEnum.Holder, label: messages.holders }
]

const directionOptions: Array<{
  key: GetCoinsSortDirectionEnum
  text: string
  leftIcon?: IconComponent
}> = [
  {
    key: GetCoinsSortDirectionEnum.Asc,
    text: messages.ascending,
    leftIcon: IconSortUp
  },
  {
    key: GetCoinsSortDirectionEnum.Desc,
    text: messages.descending,
    leftIcon: IconSortDown
  }
]

export const ArtistCoinSortScreen = () => {
  const navigation = useNavigation()
  const route = useRoute()

  const routeParams = route.params as any
  const initialSortMethod = routeParams?.initialSortMethod
  const initialSortDirection = routeParams?.initialSortDirection

  const [selectedOption, setSelectedOption] =
    useState<GetCoinsSortMethodEnum>(initialSortMethod)
  const [selectedDirection, setSelectedDirection] =
    useState<GetCoinsSortDirectionEnum>(initialSortDirection)

  const handleBackPress = useCallback(() => {
    // Navigate back to parent screen with sort params
    navigation.navigate('ArtistCoinsExplore', {
      sortMethod: selectedOption,
      sortDirection: selectedDirection
    })
  }, [navigation, selectedOption, selectedDirection])

  const handleDirectionChange = useCallback(
    (direction: GetCoinsSortDirectionEnum) => {
      setSelectedDirection(direction)
    },
    []
  )

  const handleSortOptionChange = useCallback(
    (value: GetCoinsSortMethodEnum) => {
      setSelectedOption(value)
    },
    []
  )

  return (
    <Screen title={messages.title} topbarRight={null}>
      <Flex
        pv='m'
        gap='l'
        backgroundColor='white'
        justifyContent='space-between'
        h='100%'
      >
        <Flex>
          <Flex ph='l'>
            <SegmentedControl
              fullWidth
              options={directionOptions}
              selected={selectedDirection}
              key={`direction-slider-${directionOptions.length}`}
              onSelectOption={handleDirectionChange}
            />
          </Flex>
          <SelectionItemList
            data={sortOptions}
            value={selectedOption}
            onChange={handleSortOptionChange}
          />
        </Flex>
        <Flex ph='l'>
          <Button variant='primary' fullWidth onPress={handleBackPress}>
            {messages.done}
          </Button>
        </Flex>
      </Flex>
    </Screen>
  )
}
