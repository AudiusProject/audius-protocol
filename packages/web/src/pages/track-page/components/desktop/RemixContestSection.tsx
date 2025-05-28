import { useState, useCallback } from 'react'

import { useRemixContest, useRemixesLineup, useTrack } from '@audius/common/api'
import { useFeatureFlag } from '@audius/common/hooks'
import { ID, Name } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import { UPLOAD_PAGE } from '@audius/common/src/utils/route'
import { dayjs } from '@audius/common/utils'
import {
  Box,
  Button,
  Flex,
  IconCloudUpload,
  IconTrophy,
  motion,
  spacing,
  Text
} from '@audius/harmony'
import { Link } from 'react-router-dom'

import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { useRequiresAccountCallback } from 'hooks/useRequiresAccount'
import useTabs from 'hooks/useTabs/useTabs'
import { track, make } from 'services/analytics'
import { pickWinnersPage } from 'utils/route'

import { RemixContestDetailsTab } from './RemixContestDetailsTab'
import { RemixContestPrizesTab } from './RemixContestPrizesTab'
import { RemixContestSubmissionsTab } from './RemixContestSubmissionsTab'
import { RemixContestWinnersTab } from './RemixContestWinnersTab'
import { TabBody } from './TabBody'

const messages = {
  title: 'Remix Contest',
  details: 'Details',
  prizes: 'Prizes',
  winners: 'Winners',
  submissions: 'Submissions',
  uploadRemixButtonText: 'Upload Your Remix',
  pickWinners: 'Pick Winners',
  editWinners: 'Edit Winners'
}

const TAB_BAR_HEIGHT = 56

type RemixContestSectionProps = {
  trackId: ID
  isOwner: boolean
}

/**
 * Section component that displays remix contest information for a track
 */
export const RemixContestSection = ({
  trackId,
  isOwner
}: RemixContestSectionProps) => {
  const navigate = useNavigateToPage()
  const { data: originalTrack } = useTrack(trackId)
  const { data: remixContest } = useRemixContest(trackId)
  const { isEnabled: isRemixContestWinnersMilestoneEnabled } = useFeatureFlag(
    FeatureFlags.REMIX_CONTEST_WINNERS_MILESTONE
  )
  const { data: remixes, count: remixCount } = useRemixesLineup({
    trackId,
    isContestEntry: true
  })

  const [contentHeight, setContentHeight] = useState(0)
  const hasPrizeInfo = !!remixContest?.eventData?.prizeInfo
  const isContestEnded = dayjs(remixContest?.endDate).isBefore(dayjs())
  const hasWinners =
    isRemixContestWinnersMilestoneEnabled &&
    (remixContest?.eventData?.winners?.length ?? 0) > 0

  const handleHeightChange = useCallback((height: number) => {
    setContentHeight(height)
  }, [])

  const tabs = [
    {
      text: messages.details,
      label: 'details'
    },
    ...(hasPrizeInfo
      ? [
          {
            text: messages.prizes,
            label: 'prizes'
          }
        ]
      : []),
    ...(hasWinners
      ? [
          {
            text: messages.winners,
            label: 'winners'
          }
        ]
      : [
          {
            text: remixCount
              ? `${messages.submissions} (${remixCount})`
              : messages.submissions,
            label: 'submissions'
          }
        ])
  ]

  const { tabs: TabBar, body: ContentBody } = useTabs({
    tabs,
    initialTab: hasWinners ? 'winners' : undefined,
    elements: [
      <TabBody key='details' onHeightChange={handleHeightChange}>
        <RemixContestDetailsTab trackId={trackId} />
      </TabBody>,
      ...(hasPrizeInfo
        ? [
            <TabBody key='prizes' onHeightChange={handleHeightChange}>
              <RemixContestPrizesTab trackId={trackId} />
            </TabBody>
          ]
        : []),
      ...(hasWinners
        ? [
            <TabBody key='winners' onHeightChange={handleHeightChange}>
              <RemixContestWinnersTab
                trackId={trackId}
                winnerIds={remixContest?.eventData?.winners ?? []}
              />
            </TabBody>
          ]
        : [
            <TabBody key='submissions' onHeightChange={handleHeightChange}>
              <RemixContestSubmissionsTab
                trackId={trackId}
                submissions={remixes.slice(0, 10)}
              />
            </TabBody>
          ])
    ],
    isMobile: false
  })

  const pickWinnersRoute = pickWinnersPage(originalTrack?.permalink ?? '')

  const handlePickWinnersClick = useCallback(() => {
    if (remixContest?.eventId) {
      track(
        make({
          eventName: Name.REMIX_CONTEST_PICK_WINNERS_OPEN,
          remixContestId: remixContest.eventId,
          trackId
        })
      )
    }
  }, [remixContest?.eventId, trackId])

  const goToUploadWithRemix = useRequiresAccountCallback(() => {
    if (!trackId) return

    const state = {
      initialMetadata: {
        is_remix: true,
        remix_of: {
          tracks: [{ parent_track_id: trackId }]
        }
      }
    }
    navigate(UPLOAD_PAGE, state)
  }, [trackId, navigate])
  if (!trackId || !remixContest) return null

  const totalBoxHeight = TAB_BAR_HEIGHT + contentHeight

  return (
    <Flex column gap='l'>
      <Flex alignItems='center' gap='s'>
        <IconTrophy color='default' />
        <Text variant='title' size='l'>
          {messages.title}
        </Text>
      </Flex>
      <Box
        backgroundColor='white'
        shadow='mid'
        borderRadius='l'
        border='default'
        css={{
          transition: motion.quick,
          overflow: 'hidden',
          height: totalBoxHeight
        }}
      >
        <Flex column pv='m'>
          <Flex justifyContent='space-between' borderBottom='default' ph='xl'>
            <Flex alignItems='center'>{TabBar}</Flex>
            {!isOwner ? (
              <Flex mb='m'>
                <Button
                  variant='secondary'
                  size='small'
                  onClick={goToUploadWithRemix}
                  iconLeft={IconCloudUpload}
                >
                  {messages.uploadRemixButtonText}
                </Button>
              </Flex>
            ) : isContestEnded && isRemixContestWinnersMilestoneEnabled ? (
              <Flex mb='m'>
                <Button
                  variant='secondary'
                  size='small'
                  onClick={handlePickWinnersClick}
                >
                  <Link to={pickWinnersRoute}>
                    {hasWinners ? messages.editWinners : messages.pickWinners}
                  </Link>
                </Button>
              </Flex>
            ) : (
              <Flex h={spacing.m + spacing['2xl']} />
            )}
          </Flex>
          {ContentBody}
        </Flex>
      </Box>
    </Flex>
  )
}
