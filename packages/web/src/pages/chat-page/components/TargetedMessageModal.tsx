import { useMemo } from 'react'

import { useGetCurrentUser, useGetUserTracksByHandle } from '@audius/common/api'
import { isContentUSDCPurchaseGated } from '@audius/common/models'
import { useTargetedMessageModal } from '@audius/common/src/store/ui/modals/create-targeted-message-modal'
import { chatActions } from '@audius/common/store'
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
import { Formik, FormikValues, useField } from 'formik'
import { useDispatch } from 'react-redux'
const { goToChat } = chatActions

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

type TargetedMessageFormValues = {
  target_audience: 'followers' | 'supporters' | 'purchasers' | 'remix_creators'
  purchased_track_id?: string
  remixed_track_id?: string
}

export const TargetedMessageModal = () => {
  const dispatch = useDispatch()
  const { isOpen, onClose } = useTargetedMessageModal()

  const initialValues: TargetedMessageFormValues = {
    target_audience: 'followers',
    purchased_track_id: undefined,
    remixed_track_id: undefined
  }

  const handleSubmit = (values: FormikValues) => {
    window.alert(JSON.stringify(values))
    switch (values.target_audience) {
      case 'followers':
        dispatch(goToChat({ chatId: 'followers' }))
        break
      case 'supporters':
        // do something
        break
      case 'purchasers':
        // do something
        break
      case 'remix_creators':
        // do something
        break
      default:
        break
    }
  }

  return (
    <Modal size='small' isOpen={isOpen} onClose={onClose}>
      <Formik<TargetedMessageFormValues>
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
              <TargetedMessagesFields />
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

const TargetedMessagesFields = () => {
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

const FollowersMessageField = () => {
  const { data: user } = useGetCurrentUser()
  const { follower_count: followerCount } = user ?? {}
  const [{ value }] = useField(TARGET_AUDIENCE_FIELD)
  const selected = value === 'followers'
  return (
    <Flex as='label' gap='l'>
      <Radio value='followers' />
      <Flex direction='column' gap='xs'>
        <Flex gap='xs'>
          <Text variant='title' size='l'>
            {messages.followers.label}
          </Text>
          {selected ? (
            <Text variant='title' size='l' color='subdued'>
              ({followerCount ?? 0})
            </Text>
          ) : null}
        </Flex>
        {selected ? (
          <Text size='s'>{messages.followers.description}</Text>
        ) : null}
      </Flex>
    </Flex>
  )
}

const TipSupportersMessageField = () => {
  const { data: user } = useGetCurrentUser()
  const { supporter_count: supporterCount } = user ?? {}
  const [{ value }] = useField(TARGET_AUDIENCE_FIELD)
  const selected = value === 'supporters'
  return (
    <Flex as='label' gap='l'>
      <Radio value='supporters' />
      <Flex direction='column' gap='xs'>
        <Flex gap='xs'>
          <Text variant='title' size='l'>
            {messages.supporters.label}
          </Text>
          {selected ? (
            <Text variant='title' size='l' color='subdued'>
              ({supporterCount ?? 0})
            </Text>
          ) : null}
        </Flex>
        {selected ? (
          <Text size='s'>{messages.supporters.description}</Text>
        ) : null}
      </Flex>
    </Flex>
  )
}

const PastPurchasersMessageField = () => {
  const { data: user } = useGetCurrentUser()
  const {
    // TODO: Need to add a new endpoint to get the list of past purchasers
    supporter_count: supporterCount,
    handle,
    user_id: currentUserId
  } = user ?? {}
  const [{ value }] = useField(TARGET_AUDIENCE_FIELD)
  const [purchasedTrackField, , { setValue: setPurchasedTrackId }] = useField({
    name: 'purchased_track_id',
    type: 'select'
  })

  const isSelected = value === 'purchasers'

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
      <Radio value='purchasers' />
      <Flex direction='column' gap='xs'>
        <Flex gap='xs'>
          <Text variant='title' size='l'>
            {messages.purchasers.label}
          </Text>
          {isSelected ? (
            <Text variant='title' size='l' color='subdued'>
              ({supporterCount ?? 0})
            </Text>
          ) : null}
        </Flex>
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

  const isSelected = value === 'remix_creators'

  const { data: tracks } = useGetUserTracksByHandle({ handle, currentUserId })
  const premiumTrackOptions = useMemo(
    () =>
      (tracks ?? [])
        .filter((track) => {
          // TODO: get tracks with remixes
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
      <Radio value='remix_creators' />
      <Flex direction='column' gap='xs'>
        <Flex gap='xs'>
          <Text variant='title' size='l'>
            {messages.remixCreators.label}
          </Text>
          {isSelected ? (
            <Text variant='title' size='l' color='subdued'>
              {/* TODO: Need to add a new endpoint to get the list of tracks with remixes and their creators */}
              ({0})
            </Text>
          ) : null}
        </Flex>
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
