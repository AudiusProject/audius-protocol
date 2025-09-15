import { useCallback, useState, ChangeEvent } from 'react'

import { useCurrentAccountUser } from '@audius/common/api'
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
import { Tooltip } from 'components/tooltip'

import { ArtistCoinsTable } from '../artist-coins-launchpad-page/components/ArtistCoinsTable'

const SEARCH_WIDTH = 400
const CHECKLIST_WIDTH = 540

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
  help: 'Help',
  getStartedTooltip: 'Verified users only'
}

export const ArtistCoinsExplorePage = () => {
  const dispatch = useDispatch()
  const [searchValue, setSearchValue] = useState('')
  const { data: currentUser } = useCurrentAccountUser()

  const isVerified = currentUser?.is_verified ?? false

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

          <Box w={SEARCH_WIDTH}>
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

              <Tooltip
                text={messages.getStartedTooltip}
                placement='top'
                disabled={isVerified}
              >
                {/* Need to wrap with Flex because disabled button doesn't capture mouse events */}
                <Flex>
                  <Button
                    onClick={handleGetStarted}
                    fullWidth
                    disabled={!isVerified}
                    css={{
                      background: isVerified
                        ? 'var(--harmony-gradient-purple)'
                        : undefined
                    }}
                  >
                    {messages.getStarted}
                  </Button>
                </Flex>
              </Tooltip>
            </Flex>

            <Box
              border='default'
              borderRadius='m'
              p='l'
              backgroundColor='surface1'
              w={CHECKLIST_WIDTH}
            >
              <Flex column gap='s'>
                {messages.checklistItems.map((item) => (
                  <Flex key={item} alignItems='center' gap='s'>
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
