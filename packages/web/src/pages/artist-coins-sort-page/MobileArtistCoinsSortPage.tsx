import { useCallback, useState } from 'react'

import { useDispatch } from 'react-redux'
import { push } from 'redux-first-history'

import { GetCoinsSortMethodEnum, GetCoinsSortDirectionEnum } from '@audius/sdk'
import { walletMessages } from '@audius/common/messages'
import { useMobileHeader } from 'components/header/mobile/hooks'

import {
  Box,
  Flex,
  Text,
  Button,
  SegmentedControl,
  RadioGroup,
  Radio,
  IconSortUp,
  IconSortDown,
  IconComponent
} from '@audius/harmony'
import { useLocation } from 'react-router-dom'

const sortOptions = [
  {
    value: GetCoinsSortMethodEnum.Price,
    label: walletMessages.artistCoins.sortPrice
  },
  {
    value: GetCoinsSortMethodEnum.Volume,
    label: walletMessages.artistCoins.sortVolume
  },
  {
    value: GetCoinsSortMethodEnum.MarketCap,
    label: walletMessages.artistCoins.sortMarketCap
  },
  {
    value: GetCoinsSortMethodEnum.CreatedAt,
    label: walletMessages.artistCoins.sortLaunchDate
  },
  {
    value: GetCoinsSortMethodEnum.Holder,
    label: walletMessages.artistCoins.sortHolders
  }
]

const directionOptions: Array<{
  key: GetCoinsSortDirectionEnum
  text: string
  leftIcon?: IconComponent
}> = [
  {
    key: GetCoinsSortDirectionEnum.Asc,
    text: walletMessages.artistCoins.sortAscending,
    leftIcon: IconSortUp
  },
  {
    key: GetCoinsSortDirectionEnum.Desc,
    text: walletMessages.artistCoins.sortDescending,
    leftIcon: IconSortDown
  }
]

export const MobileArtistCoinsSortPage = () => {
  const dispatch = useDispatch()
  const location = useLocation()

  // Remove the mobile header title entirely
  useMobileHeader({ title: '' })

  const { initialSortMethod, initialSortDirection } =
    (location.state as {
      initialSortMethod?: GetCoinsSortMethodEnum
      initialSortDirection?: GetCoinsSortDirectionEnum
    }) ?? {}

  const [selectedOption, setSelectedOption] = useState<GetCoinsSortMethodEnum>(
    initialSortMethod ?? GetCoinsSortMethodEnum.MarketCap
  )
  const [selectedDirection, setSelectedDirection] =
    useState<GetCoinsSortDirectionEnum>(
      initialSortDirection ?? GetCoinsSortDirectionEnum.Desc
    )

  const handleBackPress = useCallback(() => {
    // Navigate back to explore page with sort params
    dispatch(
      push('/coins', {
        sortMethod: selectedOption,
        sortDirection: selectedDirection
      })
    )
  }, [dispatch, selectedOption, selectedDirection])

  const handleDirectionChange = useCallback(
    (direction: GetCoinsSortDirectionEnum) => {
      setSelectedDirection(direction)
    },
    []
  )

  const handleSortOptionChange = useCallback((value: string) => {
    setSelectedOption(value as GetCoinsSortMethodEnum)
  }, [])

  return (
    <Flex
      column
      h='100%'
      backgroundColor='white'
      justifyContent='space-between'
    >
      <Flex column>
        <Flex ph='l' pv='l'>
          <SegmentedControl
            fullWidth
            options={directionOptions}
            selected={selectedDirection}
            key={`direction-slider-${directionOptions.length}`}
            onSelectOption={handleDirectionChange}
          />
        </Flex>

        <RadioGroup
          name='sort-option'
          value={selectedOption}
          onChange={(e) =>
            handleSortOptionChange((e.target as HTMLInputElement).value)
          }
        >
          <Flex column gap='s'>
            {sortOptions.map((option) => (
              <Flex
                key={option.value}
                alignItems='center'
                gap='m'
                pv='l'
                ph='l'
                borderBottom='default'
                onClick={() => setSelectedOption(option.value)}
                css={{ cursor: 'pointer' }}
              >
                <Radio value={option.value} />
                <Text variant='body' size='l'>
                  {option.label}
                </Text>
              </Flex>
            ))}
          </Flex>
        </RadioGroup>
      </Flex>

      <Flex ph='l' pt='l' pb='4xl' borderTop='default'>
        <Button variant='primary' fullWidth onClick={handleBackPress}>
          {walletMessages.done}
        </Button>
      </Flex>
    </Flex>
  )
}
