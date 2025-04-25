import { useState, useCallback } from 'react'

import { useRemixContest, useRemixes } from '@audius/common/api'
import { ID } from '@audius/common/models'
import { UPLOAD_PAGE } from '@audius/common/src/utils/route'
import {
  Box,
  Button,
  Flex,
  IconCloudUpload,
  IconTrophy,
  Text
} from '@audius/harmony'

import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { useRequiresAccountCallback } from 'hooks/useRequiresAccount'
import useTabs from 'hooks/useTabs/useTabs'

import { RemixContestDetailsTab } from './RemixContestDetailsTab'
import { RemixContestPrizesTab } from './RemixContestPrizesTab'
import { RemixContestSubmissionsTab } from './RemixContestSubmissionsTab'

const messages = {
  title: 'Remix Contest',
  details: 'Details',
  prizes: 'Prizes',
  submissions: 'Submissions',
  uploadRemixButtonText: 'Upload Your Remix'
}

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
  const { data: remixContest } = useRemixContest(trackId)
  const { data: remixes } = useRemixes({ trackId, isContestEntry: true })
  const [contentHeight, setContentHeight] = useState(0)

  const handleDetailsHeightChange = useCallback((height: number) => {
    setContentHeight(height)
  }, [])

  const tabs = [
    {
      text: messages.details,
      label: 'details'
    },
    {
      text: messages.prizes,
      label: 'prizes'
    },
    {
      text:
        messages.submissions + (remixes?.length ? ` (${remixes.length})` : ''),
      label: 'submissions'
    }
  ]

  const elements = [
    <RemixContestDetailsTab
      key='details'
      trackId={trackId}
      onHeightChange={handleDetailsHeightChange}
    />,
    <RemixContestPrizesTab key='prizes' trackId={trackId} />,
    <RemixContestSubmissionsTab
      key='submissions'
      trackId={trackId}
      submissions={remixes.slice(0, 10)}
    />
  ]

  const { tabs: TabBar, body: TabBody } = useTabs({
    tabs,
    elements,
    isMobile: false
  })

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

  // TODO: Also return null if no remix contest description
  if (!trackId || !remixContest) return null

  const headerHeight = 48 // Height of the title section
  const titleGap = 16 // Gap between title and box (from gap='l')
  const tabBarHeight = 56 // Height of the tab bar
  const verticalPadding = 16 // From pv='m' on the Flex
  const totalBoxHeight = tabBarHeight + contentHeight + verticalPadding * 2
  const totalHeight = headerHeight + titleGap + totalBoxHeight

  return (
    <Flex
      column
      gap='l'
      css={{
        transition: 'height var(--harmony-expressive)',
        height: totalHeight
      }}
    >
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
        css={{
          transition: 'height var(--harmony-expressive)',
          height: totalBoxHeight
        }}
      >
        <Flex column pv='m' css={{ height: '100%' }}>
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
            ) : null}
          </Flex>
          <Box
            css={{
              transition: 'height var(--harmony-expressive)',
              height: contentHeight
            }}
          >
            {TabBody}
          </Box>
        </Flex>
      </Box>
    </Flex>
  )
}
