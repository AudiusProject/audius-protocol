import { useRemixContest } from '@audius/common/api'
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
      text: messages.submissions,
      label: 'submissions'
    }
  ]

  const elements = [
    <RemixContestDetailsTab key='details' trackId={trackId} />,
    <RemixContestPrizesTab key='prizes' trackId={trackId} />,
    <RemixContestSubmissionsTab key='submissions' trackId={trackId} />
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

  return (
    <Flex column gap='l'>
      <Flex alignItems='center' gap='s'>
        <IconTrophy color='default' />
        <Text variant='title' size='l'>
          {messages.title}
        </Text>
      </Flex>
      <Box backgroundColor='white' shadow='mid' borderRadius='l'>
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
            ) : null}
          </Flex>
          {TabBody}
        </Flex>
      </Box>
    </Flex>
  )
}
