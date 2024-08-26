import { useMemo } from 'react'

import {
  useGetCurrentUser,
  useGetRemixersCount,
  useGetUserTracksByHandle
} from '@audius/common/api'
import { isContentUSDCPurchaseGated } from '@audius/common/models'
import { useChatBlastModal, chatActions } from '@audius/common/src/store'
import {
  Flex,
  IconTowerBroadcast,
  Modal,
  ModalHeader,
  Text,
  ModalTitle,
  Radio,
  Button,
  RadioGroup,
  ModalFooter,
  IconCaretLeft,
  ModalContent,
  Select
} from '@audius/harmony'
import { ChatBlastAudience } from '@audius/sdk'
import { Formik, useField } from 'formik'
import { useDispatch } from 'react-redux'

const { createChatBlast } = chatActions

const messages = {
  title: 'Target Audience',
  back: 'Back',
  continue: 'Continue',
  followers: {
    label: 'My Followers',
    description: 'Send a bulk message to all of your followers.'
  },
  supporters: {
    label: 'Tip Supporters',
    description: 'Send a bulk message to everyone who has tipped you.'
  },
  purchasers: {
    label: 'Past Purchasers',
    description:
      'Send a bulk message to everyone who has purchased content from you on Audius.',
    placeholder: 'Premium Content'
  },
  remixCreators: {
    label: 'Remix Creators',
    description:
      'Send a bulk message to creators who have remixed your tracks.',
    placeholder: 'Tracks with Remixes'
  }
}

const TARGET_AUDIENCE_FIELD = 'target_audience'

type ChatBlastFormValues = {
  target_audience: ChatBlastAudience
  purchased_content_id?: string
  // TODO: purchased_content_type
  remixed_track_id?: string
}

export const ChatBlastModal = () => {
  const dispatch = useDispatch()
  const { isOpen, onClose } = useChatBlastModal()

  const initialValues: ChatBlastFormValues = {
    target_audience: ChatBlastAudience.FOLLOWERS,
    purchased_content_id: undefined,
    remixed_track_id: undefined
  }

  const handleSubmit = (values: ChatBlastFormValues) => {
    onClose()
    dispatch(
      createChatBlast({
        audience: values.target_audience,
        audienceContentId: values.purchased_content_id,
        // TODO: collection support
        audienceContentType: values.purchased_content_id ? 'track' : undefined
      })
    )
  }

  return (
    <Modal size='small' isOpen={isOpen} onClose={onClose}>
      <Formik<ChatBlastFormValues>
        initialValues={initialValues}
        onSubmit={handleSubmit}
      >
        {({ submitForm }) => (
          <>
            <ModalHeader>
              <ModalTitle
                icon={<IconTowerBroadcast />}
                title={messages.title}
              />
            </ModalHeader>
            <ModalContent>
              <ChatBlastsFields />
            </ModalContent>
            <ModalFooter>
              <Flex w='100%' gap='s'>
                <Button
                  variant='secondary'
                  iconLeft={IconCaretLeft}
                  css={{ flexGrow: 1 }}
                  onClick={onClose}
                >
                  {messages.back}
                </Button>
                <Button
                  variant='primary'
                  type='submit'
                  css={{ flexGrow: 1 }}
                  onClick={submitForm}
                >
                  {messages.continue}
                </Button>
              </Flex>
            </ModalFooter>
          </>
        )}
      </Formik>
    </Modal>
  )
}

const ChatBlastsFields = () => {
  const [field] = useField(TARGET_AUDIENCE_FIELD)

  return (
    <RadioGroup {...field}>
      <Flex direction='column' gap='xl'>
        <FollowersMessageField />
        <TipSupportersMessageField />
        <PastPurchasersMessageField />
        <RemixCreatorsMessageField />
      </Flex>
    </RadioGroup>
  )
}

const LabelWithCount = (props: {
  label: string
  count?: number
  isSelected: boolean
}) => {
  const { label, count, isSelected } = props
  return (
    <Flex gap='xs'>
      <Text variant='title' size='l'>
        {label}
      </Text>
      {isSelected && count !== undefined ? (
        <Text variant='title' size='l' color='subdued'>
          ({count})
        </Text>
      ) : null}
    </Flex>
  )
}

const FollowersMessageField = () => {
  const { data: user } = useGetCurrentUser()
  const [{ value }] = useField(TARGET_AUDIENCE_FIELD)
  const selected = value === ChatBlastAudience.FOLLOWERS
  return (
    <Flex as='label' gap='l'>
      <Radio value={ChatBlastAudience.FOLLOWERS} />
      <Flex direction='column' gap='xs'>
        <LabelWithCount
          label={messages.followers.label}
          count={user.follower_count}
          isSelected={selected}
        />
        {selected ? (
          <Text size='s'>{messages.followers.description}</Text>
        ) : null}
      </Flex>
    </Flex>
  )
}

const TipSupportersMessageField = () => {
  const { data: user } = useGetCurrentUser()
  const [{ value }] = useField(TARGET_AUDIENCE_FIELD)
  const selected = value === ChatBlastAudience.TIPPERS
  return (
    <Flex as='label' gap='l'>
      <Radio value={ChatBlastAudience.TIPPERS} />
      <Flex direction='column' gap='xs'>
        <LabelWithCount
          label={messages.supporters.label}
          count={user.supporter_count ?? 0}
          isSelected={selected}
        />
        {selected ? (
          <Text size='s'>{messages.supporters.description}</Text>
        ) : null}
      </Flex>
    </Flex>
  )
}

const PastPurchasersMessageField = () => {
  const { data: user } = useGetCurrentUser()
  const { handle, user_id: currentUserId } = user ?? {}
  const [{ value }] = useField(TARGET_AUDIENCE_FIELD)
  const [purchasedTrackField, , { setValue: setPurchasedTrackId }] = useField({
    name: 'purchased_content_id',
    type: 'select'
  })

  const isSelected = value === ChatBlastAudience.CUSTOMERS

  const { data: tracks } = useGetUserTracksByHandle({ handle, currentUserId })
  const premiumTrackOptions = useMemo(
    () =>
      (tracks ?? [])
        .filter(
          (track) =>
            isContentUSDCPurchaseGated(track.stream_conditions) ||
            isContentUSDCPurchaseGated(track.download_conditions)
        )
        .map((track) => ({
          value: track.track_id.toString(),
          label: track.title
        })),
    [tracks]
  )

  return (
    <Flex as='label' gap='l'>
      <Radio value={ChatBlastAudience.CUSTOMERS} />
      <Flex direction='column' gap='xs'>
        <LabelWithCount
          label={messages.purchasers.label}
          // TODO: Need to add a new endpoint to get the list of past purchasers
          count={user.supporter_count ?? 0}
          isSelected={isSelected}
        />
        {isSelected ? (
          <Flex direction='column' gap='l'>
            <Text size='s'>{messages.purchasers.description}</Text>
            <Select
              {...purchasedTrackField}
              options={premiumTrackOptions}
              label={messages.purchasers.placeholder}
              onChange={setPurchasedTrackId}
            />
          </Flex>
        ) : null}
      </Flex>
    </Flex>
  )
}

const RemixCreatorsMessageField = () => {
  const { data: user } = useGetCurrentUser()
  const { handle, user_id: currentUserId } = user ?? {}
  const [{ value }] = useField(TARGET_AUDIENCE_FIELD)
  const [remixedTrackField, , { setValue: setRemixedTrackId }] = useField({
    name: 'remixed_track_id',
    type: 'select'
  })
  const { data: remixersCount } = useGetRemixersCount({
    userId: currentUserId,
    trackId: remixedTrackField.value
  })

  const isSelected = value === ChatBlastAudience.REMIXERS

  const { data: tracks } = useGetUserTracksByHandle({ handle, currentUserId })
  const premiumTrackOptions = useMemo(
    () =>
      (tracks ?? [])
        .filter((track) => {
          return true
        })
        .map((track) => ({
          value: track.track_id.toString(),
          label: track.title
        })),
    [tracks]
  )

  return (
    <Flex as='label' gap='l'>
      <Radio value={ChatBlastAudience.REMIXERS} />
      <Flex direction='column' gap='xs'>
        <LabelWithCount
          label={messages.remixCreators.label}
          count={remixersCount}
          isSelected={isSelected}
        />
        {isSelected ? (
          <Flex direction='column' gap='l'>
            <Text size='s'>{messages.remixCreators.description}</Text>
            <Select
              {...remixedTrackField}
              options={premiumTrackOptions}
              label={messages.remixCreators.placeholder}
              onChange={setRemixedTrackId}
            />
          </Flex>
        ) : null}
      </Flex>
    </Flex>
  )
}
