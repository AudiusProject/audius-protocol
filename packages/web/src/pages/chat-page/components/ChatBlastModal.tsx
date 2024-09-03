import { useMemo } from 'react'

import {
  useGetCurrentUser,
  useGetCurrentUserId,
  useGetPlaylistsByIds,
  useGetPurchasersCount,
  useGetRemixedTracks,
  useGetRemixersCount,
  useGetSalesAggegrate,
  useGetTracksByIds
} from '@audius/common/api'
import { useChatBlastModal, chatActions } from '@audius/common/src/store'
import { removeNullable } from '@audius/common/utils'
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
import { keyBy } from 'lodash'
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

type PurchasableContentOption = {
  contentId: string
  contentType: 'track' | 'album'
}

type ChatBlastFormValues = {
  target_audience: ChatBlastAudience
  purchased_content_metadata?: PurchasableContentOption
  remixed_track_id?: string
}

export const ChatBlastModal = () => {
  const dispatch = useDispatch()
  const { isOpen, onClose } = useChatBlastModal()

  const initialValues: ChatBlastFormValues = {
    target_audience: ChatBlastAudience.FOLLOWERS,
    purchased_content_metadata: undefined,
    remixed_track_id: undefined
  }

  const handleSubmit = (values: ChatBlastFormValues) => {
    onClose()
    const audienceContentId =
      values.target_audience === ChatBlastAudience.CUSTOMERS
        ? values.purchased_content_metadata?.contentId
        : values.remixed_track_id
    dispatch(
      createChatBlast({
        audience: values.target_audience,
        audienceContentId,
        audienceContentType: values.purchased_content_metadata?.contentType
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
  const { data: currentUserId } = useGetCurrentUserId({})
  const [{ value }] = useField(TARGET_AUDIENCE_FIELD)
  const [
    purchasedContentMetadataField,
    ,
    { setValue: setPurchasedContentMetadata }
  ] = useField({
    name: 'purchased_content_metadata',
    type: 'select'
  })
  const isSelected = value === ChatBlastAudience.CUSTOMERS

  const { data: salesAggregate } = useGetSalesAggegrate({
    userId: currentUserId!
  })

  const trackAggregates = salesAggregate?.filter(
    (sale) => sale.contentType === 'track'
  )
  const albumAggregates = salesAggregate?.filter(
    (sale) => sale.contentType === 'album'
  )

  const { data: tracks } = useGetTracksByIds({
    ids: trackAggregates?.map((sale) => parseInt(sale.contentId)) ?? [],
    currentUserId
  })
  const { data: albums } = useGetPlaylistsByIds({
    ids: albumAggregates?.map((sale) => parseInt(sale.contentId)) ?? [],
    currentUserId
  })
  const tracksById = useMemo(() => keyBy(tracks, 'track_id'), [tracks])
  const albumsById = useMemo(() => keyBy(albums, 'playlist_id'), [albums])

  const premiumContentOptions = useMemo(
    () =>
      (salesAggregate ?? [])
        .map((sale) => {
          const content =
            sale.contentType === 'track'
              ? tracksById[sale.contentId]
              : albumsById[sale.contentId]
          if (!content) return null
          return {
            value: { contentId: sale.contentId, contentType: sale.contentType },
            label: 'title' in content ? content?.title : content?.playlist_name
          }
        })
        .filter(removeNullable),
    [salesAggregate, tracksById, albumsById]
  )

  const { data: purchasersCount } = useGetPurchasersCount({
    userId: currentUserId!,
    contentId: purchasedContentMetadataField.value?.contentId,
    contentType: purchasedContentMetadataField.value?.contentType
  })

  return (
    <Flex as='label' gap='l'>
      <Radio value={ChatBlastAudience.CUSTOMERS} />
      <Flex direction='column' gap='xs'>
        <LabelWithCount
          label={messages.purchasers.label}
          count={purchasersCount}
          isSelected={isSelected}
        />
        {isSelected ? (
          <Flex direction='column' gap='l'>
            <Text size='s'>{messages.purchasers.description}</Text>
            <Select
              {...purchasedContentMetadataField}
              options={premiumContentOptions}
              label={messages.purchasers.placeholder}
              onChange={setPurchasedContentMetadata}
              clearable
            />
          </Flex>
        ) : null}
      </Flex>
    </Flex>
  )
}

const RemixCreatorsMessageField = () => {
  const { data: currentUserId } = useGetCurrentUserId({})
  const [{ value }] = useField(TARGET_AUDIENCE_FIELD)
  const [remixedTrackField, , { setValue: setRemixedTrackId }] = useField({
    name: 'remixed_track_id',
    type: 'select'
  })
  const { data: remixersCount } = useGetRemixersCount({
    userId: currentUserId!,
    trackId: remixedTrackField.value
      ? parseInt(remixedTrackField.value)
      : undefined
  })

  const { data: remixedTracks } = useGetRemixedTracks({
    userId: currentUserId!
  })

  const isSelected = value === ChatBlastAudience.REMIXERS

  const premiumTrackOptions = useMemo(
    () =>
      (remixedTracks ?? []).map((track) => ({
        value: track.track_id.toString(),
        label: track.title
      })),
    [remixedTracks]
  )

  return (
    <Flex as='label' gap='l'>
      <Radio value={ChatBlastAudience.REMIXERS} />
      <Flex direction='column' gap='xs'>
        <LabelWithCount
          label={messages.remixCreators.label}
          count={remixersCount ?? 0}
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
              clearable
            />
          </Flex>
        ) : null}
      </Flex>
    </Flex>
  )
}
