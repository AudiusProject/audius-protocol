import { useCallback, useState } from 'react'

import {
  Box,
  Button,
  Flex,
  IconCheck,
  Paper,
  Text,
  TextInput,
  TextLink
} from '@audius/harmony'
import { IconSearch } from '@audius/harmony'
import { useDispatch } from 'react-redux'
import { push } from 'redux-first-history'

import { ArtistCoinsTable } from '../artist-coins-launchpad-page/components/ArtistCoinsTable'
import Page from 'components/page/Page'

const messages = {
  title: 'Discover Artist Coins',
  searchPlaceholder: 'Search',
  getStarted: 'Get Started',
  launchYourOwn: 'Launch Your Own Artist Coin!',
  required: 'Required',
  checklistItems: [
    'Launch Your Coin',
    'Start collecting trading fees',
    'Offer exclusive perks to your fans'
  ],
  help: 'Help'
}

export const ArtistCoinsExplorePage = () => {
  const dispatch = useDispatch()
  const [searchValue, setSearchValue] = useState('')

  const handleGetStarted = useCallback(() => {
    dispatch(push('/artist-coins-launchpad'))
  }, [dispatch])

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchValue(e.target.value)
    },
    []
  )

  return (
    <Page title={messages.title} contentClassName='artist-coins-explore-page'>
      {/* Hero Section */}
      <Flex
        p='3xl'
        direction='column'
        alignItems='center'
        justifyContent='center'
        gap='2xl'
        w='100%'
        css={{
          background:
            'linear-gradient(180deg, rgba(0, 0, 0, 0.31) 0%, rgba(0, 0, 0, 0.49) 100%), url("https://source.unsplash.com/featured/1080x400?music,abstract")',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <Text variant='display' color='staticWhite'>
          {messages.title}
        </Text>

        <Box w={400} style={{ maxWidth: '100%' }}>
          <TextInput
            label={messages.searchPlaceholder}
            placeholder={messages.searchPlaceholder}
            value={searchValue}
            onChange={handleSearchChange}
            startIcon={IconSearch}
          />
        </Box>
      </Flex>

      {/* CTA Section */}
      <Box p='2xl' m='3xl 0'>
        <Paper p='2xl' gap='xl' direction='row' w='100%' alignItems='center'>
          <Box flex={2}>
            <Flex direction='column' gap='s'>
              <Text variant='heading'>{messages.launchYourOwn}</Text>
              <Text variant='body'>
                Create new ways to earn, reward your fans, and grow your
                community — all powered by your artist coin.
              </Text>
            </Flex>

            <Box p='l' backgroundColor='surface2' borderRadius='m' mt='l'>
              {messages.checklistItems.map((item, index) => (
                <Flex key={index} alignItems='center' gap='s' mb='s'>
                  <IconCheck size='s' />
                  <Text variant='body'>{item}</Text>
                </Flex>
              ))}
              <Flex alignItems='center' gap='xs' mt='m'>
                <Text size='s'>{messages.help}</Text>
                <TextLink size='s' variant='active'>
                  Learn more
                </TextLink>
              </Flex>
            </Box>
          </Box>

          <Flex direction='column' gap='l' alignItems='center' flex={1}>
            <Button
              variant='primary'
              size='large'
              onClick={handleGetStarted}
              fullWidth
            >
              {messages.getStarted}
            </Button>
          </Flex>
        </Paper>
      </Box>

      {/* Table Section */}
      <Box p='3xl 0'>
        <ArtistCoinsTable />
      </Box>
    </Page>
  )
}
