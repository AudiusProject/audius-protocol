import { useMemo } from 'react'

import { useGetCurrentUser, useGetUserTracksByHandle } from '@audius/common/api'
import { isContentUSDCPurchaseGated } from '@audius/common/models'
import { useTargetedMessageModal } from '@audius/common/src/store/ui/modals/create-targeted-message-modal'
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
import { Formik, FormikValues, useField } from 'formik'

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
      'Send a bulk message to everyone who has purchased content from you on Audius.'
  },
  remixCreators: {
    label: 'Remix Creators',
    description: 'Send a bulk message to creators who have remixed your tracks.'
  }
}

export const TargetedMessageModal = () => {
  const { isOpen, onClose } = useTargetedMessageModal()

  const initialValues = {
    target_audience: undefined,
    purchased_track_id: undefined,
    remixed_track_id: undefined
  }

  const handleSubmit = (values: FormikValues) => {
    window.alert(JSON.stringify(values))
    switch (values.target_audience) {
      case 'followers':
        // do something
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
      <Formik initialValues={initialValues} onSubmit={handleSubmit}>
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
  const [field] = useField('target_audience')

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
  const [{ value }] = useField('target_audience')
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
  const [{ value }] = useField('target_audience')
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
  const [{ value }] = useField('target_audience')
  const [purchasedTrackField] = useField({
    name: 'purchased_track_id',
    type: 'select'
  })

  const isSelected = value === 'purchasers'

  const { data: tracks } = useGetUserTracksByHandle({ handle, currentUserId })
  const premiumTrackOptions = useMemo(
    () =>
      (tracks ?? [])
        .filter((track) => isContentUSDCPurchaseGated(track.stream_conditions))
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
              label={'Premium Content'}
              onChange={window.alert}
            />
          </Flex>
        ) : null}
      </Flex>
    </Flex>
  )
}

const RemixCreatorsMessageField = () => {
  const { data: user } = useGetCurrentUser()
  const {
    // TODO: Need to add a new endpoint to get the list of tracks with remixes and their creators
    supporter_count: supporterCount,
    handle,
    user_id: currentUserId
  } = user ?? {}
  const [{ value }] = useField('target_audience')
  const [remixedTrackField] = useField({
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
              ({supporterCount ?? 0})
            </Text>
          ) : null}
        </Flex>
        {isSelected ? (
          <Flex direction='column' gap='l'>
            <Text size='s'>{messages.remixCreators.description}</Text>
            <Select
              {...remixedTrackField}
              options={premiumTrackOptions}
              label={'Tracks with Remixes'}
            />
          </Flex>
        ) : null}
      </Flex>
    </Flex>
  )
}
