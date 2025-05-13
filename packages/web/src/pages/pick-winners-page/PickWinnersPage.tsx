import { useState, useCallback } from 'react'

import { useRemixes, useTrackByPermalink } from '@audius/common/api'
import { remixMessages as messages } from '@audius/common/messages'
import { ID } from '@audius/common/models'
import { toast } from '@audius/common/src/store/ui/toast/slice'
import { pickWinnersPageLineupActions } from '@audius/common/store'
import { pluralize } from '@audius/common/utils'
import {
  Button,
  FilterButton,
  Flex,
  IconButton,
  IconMinus,
  IconPlus,
  IconCheck,
  Paper,
  Text,
  useTheme
} from '@audius/harmony'
import { useDispatch } from 'react-redux'
import { useParams } from 'react-router'

import { Header } from 'components/header/desktop/Header'
import { TanQueryLineup } from 'components/lineup/TanQueryLineup'
import { Page } from 'components/page/Page'
import { useUpdateSearchParams } from 'pages/search-page/hooks'

import { usePickWinnersPageParams } from './hooks'

const PICK_WINNERS_PAGE_SIZE = 10
const MAX_WINNERS = 5

export const PickWinnersPage = () => {
  const dispatch = useDispatch()
  const { color, motion } = useTheme()
  const { handle, slug } = useParams<{ handle: string; slug: string }>()
  const { data: originalTrack } = useTrackByPermalink(
    handle && slug ? `/${handle}/${slug}` : null
  )

  const updateSortParam = useUpdateSearchParams('sortMethod')
  const updateIsCosignParam = useUpdateSearchParams('isCosign')

  const { sortMethod, isCosign } = usePickWinnersPageParams()
  const {
    data,
    count,
    isFetching,
    isPending,
    isError,
    hasNextPage,
    play,
    pause,
    loadNextPage,
    isPlaying,
    lineup
  } = useRemixes({
    trackId: originalTrack?.track_id,
    sortMethod,
    isCosign,
    isContestEntry: true
  })

  const pageHeader = (
    <Header
      primary={messages.pickWinnersTitle}
      showBackButton
      rightDecorator={
        <Button size='small' disabled>
          {messages.finalizeWinners}
        </Button>
      }
    />
  )

  const [winners, setWinners] = useState<ID[]>([])

  const addIdToWinners = useCallback(
    (id: ID) => {
      if (winners.includes(id)) return
      if (winners.length >= MAX_WINNERS) {
        dispatch(toast({ content: messages.maxWinnersReached }))
        return
      }

      setWinners([...winners, id])
    },
    [winners, dispatch]
  )

  const removeIdFromWinners = useCallback(
    (id: ID) => {
      if (!winners.includes(id)) return
      setWinners(winners.filter((winnerId) => winnerId !== id))
    },
    [winners]
  )

  const tileAdornment = (elementId: ID, index: number) => {
    const Icon = winners.includes(elementId) ? IconCheck : IconPlus
    return (
      <Paper
        p='xs'
        shadow='flat'
        borderRadius='circle'
        css={{
          position: 'absolute',
          top: '50%',
          left: 0,
          backgroundColor: color.background.white,
          transform: 'translate(-50%, -50%)',
          transition: motion.hover,
          '&:hover': {
            backgroundColor: color.neutral.n100,
            transform: 'translate(-50%, -50%) scale(1.1)'
          },
          '&:active': {
            backgroundColor: color.neutral.n150,
            transform: 'translate(-50%, -50%) scale(0.98)'
          }
        }}
        onClick={() => addIdToWinners(elementId)}
        aria-label='Add Winner'
      >
        <Icon fill={color.icon.staticWhite} />
      </Paper>
    )
  }

  return (
    <Page title={messages.pickWinnersTitle} header={pageHeader}>
      <Flex column gap='3xl'>
        <Flex column gap='xl'>
          <Flex column gap='s'>
            <Text variant='heading'>{messages.winners}</Text>
            <Text variant='body'>{messages.winnersDescription}</Text>
          </Flex>
          {winners.length > 0 ? (
            // TODO: Render the reorderable track tiles for the winners here
            <Flex column gap='s'>
              {winners.map((winnerId) => (
                <Flex key={winnerId}>
                  <IconButton
                    icon={IconMinus}
                    aria-label='Remove Winner'
                    onClick={() => removeIdFromWinners(winnerId)}
                  />
                  <Text variant='body'>{winnerId}</Text>
                </Flex>
              ))}
            </Flex>
          ) : (
            <Paper
              p='3xl'
              pv={56}
              border='default'
              justifyContent='center'
              alignItems='center'
            >
              <Text variant='body'>{messages.winnerPlaceholder}</Text>
            </Paper>
          )}
        </Flex>
        <Flex column gap='xl'>
          <Flex column gap='s'>
            <Flex justifyContent='space-between'>
              <Text variant='heading'>
                {`${count !== undefined ? count : '...'} ${pluralize(
                  messages.submissions,
                  count ?? 0
                )}`}
              </Text>
              <Flex gap='s' mb='xl'>
                <FilterButton
                  label={messages.coSigned}
                  value={isCosign ? 'true' : null}
                  onClick={() => updateIsCosignParam(isCosign ? '' : 'true')}
                />
                <FilterButton
                  value={sortMethod ?? 'recent'}
                  variant='replaceLabel'
                  onChange={updateSortParam}
                  options={[
                    { label: 'Most Recent', value: 'recent' },
                    { label: 'Most Plays', value: 'plays' },
                    { label: 'Most Likes', value: 'likes' }
                  ]}
                />
              </Flex>
            </Flex>
            <TanQueryLineup
              data={data}
              isFetching={isFetching}
              isPending={isPending}
              isError={isError}
              hasNextPage={hasNextPage}
              play={play}
              pause={pause}
              loadNextPage={loadNextPage}
              isPlaying={isPlaying}
              lineup={lineup}
              pageSize={PICK_WINNERS_PAGE_SIZE}
              actions={pickWinnersPageLineupActions}
              elementAdornment={tileAdornment}
            />
          </Flex>
        </Flex>
      </Flex>
    </Page>
  )
}
