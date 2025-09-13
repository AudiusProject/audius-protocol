import { useCallback, useState, ChangeEvent } from 'react'

import { COINS_CREATE_PAGE } from '@audius/common/src/utils/route'
import {
  Box,
  Button,
  Flex,
  IconCheck,
  IconVerified,
  Paper,
  Text,
  TextInput,
  TextInputSize,
  IconQuestionCircle,
  spacing,
  PlainButton,
  IconSearch
} from '@audius/harmony'
import { useDispatch } from 'react-redux'
import { push } from 'redux-first-history'

import { ExternalLink } from 'components/link'
import Page from 'components/page/Page'

import { ArtistCoinsTable } from '../artist-coins-launchpad-page/components/ArtistCoinsTable'

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
    dispatch(push(COINS_CREATE_PAGE))
  }, [dispatch])

  const handleSearchChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value)
  }, [])

  return (
    <Page title={messages.title}>
      <Flex column gap='xl'>
        <Flex
          p='3xl'
          direction='column'
          alignItems='center'
          justifyContent='center'
          gap='xl'
          w='100%'
          borderRadius='m'
          css={{
            background:
              'linear-gradient(0deg, rgba(0, 0, 0, 0.31) 0%, rgba(0, 0, 0, 0.49) 100%), url("http://localhost:3845/assets/f86c70e88c10c90dd6065df53ea1b503af7738c3.png")',
            backgroundSize: 'cover, cover',
            backgroundPosition: '0% 0%, 50% 50%',
            backgroundRepeat: 'no-repeat, no-repeat',
            boxShadow:
              '0px 0px 4px 0px rgba(0, 0, 0, 0.04), 0px 4px 8px 0px rgba(0, 0, 0, 0.06)'
          }}
        >
          <Text variant='display' size='s' color='staticWhite'>
            {messages.title}
          </Text>

          <Box w={400}>
            <TextInput
              label={messages.searchPlaceholder}
              placeholder={messages.searchPlaceholder}
              value={searchValue}
              onChange={handleSearchChange}
              startIcon={IconSearch}
              size={TextInputSize.SMALL}
            />
          </Box>
        </Flex>

        <Paper p='xl' gap='xl'>
          <Flex gap='xl' w='100%'>
            <Flex column gap='l' justifyContent='space-between' w='100%'>
              <Flex alignItems='center' justifyContent='space-between'>
                <Text variant='heading'>{messages.launchYourOwn}</Text>
                <Flex
                  pl='s'
                  gap='s'
                  alignItems='center'
                  border='default'
                  borderRadius='m'
                >
                  <Text variant='body' size='s'>
                    {messages.required}
                  </Text>
                  <Flex
                    ph='s'
                    pv='xs'
                    backgroundColor='surface2'
                    borderLeft='default'
                  >
                    <IconVerified size='s' />
                  </Flex>
                </Flex>
              </Flex>

              <Button
                onClick={handleGetStarted}
                fullWidth
                css={{
                  background:
                    'linear-gradient(91deg, var(--color-primary-P300, #CC0FE0) -7.07%, var(--color-secondary-S300, #7E1BCC) 50.55%, var(--color-special-Blue, #1BA1F1) 108.17%)'
                }}
              >
                {messages.getStarted}
              </Button>
            </Flex>

            <Box
              border='default'
              borderRadius='m'
              p='l'
              backgroundColor='surface1'
              w={540}
            >
              <Flex column gap='s'>
                {messages.checklistItems.map((item, index) => (
                  <Flex key={index} alignItems='center' gap='s'>
                    <IconCheck size='s' color='default' />
                    <Text variant='body' size='l'>
                      {item}
                    </Text>
                  </Flex>
                ))}
              </Flex>

              {/* With absolute positioning, must be rendered after the checklist items to have higher z-index */}
              <PlainButton
                iconLeft={IconQuestionCircle}
                asChild
                css={{
                  position: 'absolute',
                  top: spacing.l,
                  right: spacing.l
                }}
              >
                <ExternalLink to='https://help.audius.co/'>
                  {messages.help}
                </ExternalLink>
              </PlainButton>
            </Box>
          </Flex>
        </Paper>

        <ArtistCoinsTable searchQuery={searchValue} />
      </Flex>
    </Page>
  )
}
