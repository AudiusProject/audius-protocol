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
  spacing,
  Text
} from '@audius/harmony'

import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { useRequiresAccountCallback } from 'hooks/useRequiresAccount'
import useTabs from 'hooks/useTabs/useTabs'

import { RemixContestDetailsTab } from './RemixContestDetailsTab'
import { RemixContestPrizesTab } from './RemixContestPrizesTab'
import { RemixContestSubmissionsTab } from './RemixContestSubmissionsTab'
import { TabBody } from './TabBody'

const messages = {
  title: 'Remix Contest',
  details: 'Details',
  prizes: 'Prizes',
  submissions: 'Submissions',
  uploadRemixButtonText: 'Upload Your Remix'
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
  const { data: remixContest } = useRemixContest(trackId)
  const { data: remixes } = useRemixes({ trackId, isContestEntry: true })
  const [contentHeight, setContentHeight] = useState(0)

  const handleHeightChange = useCallback((height: number) => {
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

  const { tabs: TabBar, body: ContentBody } = useTabs({
    tabs,
    elements: [
      <TabBody key='details' onHeightChange={handleHeightChange}>
        <RemixContestDetailsTab trackId={trackId} />
      </TabBody>,
      <TabBody key='prizes' onHeightChange={handleHeightChange}>
        <RemixContestPrizesTab trackId={trackId} />
      </TabBody>,
      <TabBody key='submissions' onHeightChange={handleHeightChange}>
        <RemixContestSubmissionsTab
          trackId={trackId}
          submissions={remixes.slice(0, 10)}
        />
      </TabBody>
    ],
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

  if (!trackId || !remixContest) return null

  const totalBoxHeight = TAB_BAR_HEIGHT + contentHeight

  return (
    <Flex
      column
      gap='l'
      css={{
        transition: 'height var(--harmony-expressive)'
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
        border='default'
        css={{
          transition: 'height var(--harmony-expressive)',
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
            ) : (
              <Flex h={spacing.m + spacing['2xl']} />
            )}
          </Flex>
          <Box
            css={{
              transition: 'height var(--harmony-expressive)',
              height: contentHeight
            }}
          >
            {ContentBody}
          </Box>
        </Flex>
      </Box>
    </Flex>
  )
}
