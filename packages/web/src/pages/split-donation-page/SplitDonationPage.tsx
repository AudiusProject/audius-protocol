import { useCallback, useEffect, useMemo, useState } from 'react'

import { useGetUsersByIds } from '@audius/common/api'
import { ID, Status } from '@audius/common/models'
import {
  musicConfettiActions,
  tippingSelectors,
  toastActions,
  TOKEN_LISTING_MAP
} from '@audius/common/store'
import {
  Button,
  Flex,
  IconUserList,
  LoadingSpinner,
  Paper,
  Text
} from '@audius/harmony'
import { Form, Formik, FormikHelpers, useFormikContext } from 'formik'
import { useDispatch, useSelector } from 'react-redux'
import { PieChart, Pie, Tooltip, Cell } from 'recharts'

import { TextField } from 'components/form-fields'
import { SelectField } from 'components/form-fields/SelectField'
import Header from 'components/header/desktop/Header'
import Page from 'components/page/Page'
import UserList from 'components/user-list/components/UserList'
import { audiusSdk } from 'services/audius-sdk'
import { encodeHashId } from 'utils/hashIds'

const { show: showConfetti } = musicConfettiActions
const { getDonatingTo } = tippingSelectors
const { toast } = toastActions

const messages = {
  title: 'Split Donation',
  description: 'Split your donation between multiple creators',
  amountInputLabel: 'Donation Amount',
  donateButtonLabel: 'Donate',
  donatingButtonLabel: 'Donating...',
  selectPresetLabel: 'Split Preset',
  configureLabel: 'Configure your donation',
  usersListLabel: 'Selected Users',
  piechartLabel: 'Donation Breakdown',
  successfullyDonated: 'Successfully donated!',
  noUsersSelected: 'No users selected',
  noUsersDescription: 'Select by clicking donate on a profile page!'
}

const header = <Header primary={messages.title} />

// prod
// const FEATURED_ARTIST_IDS = [50672, 207676588, 985480]
const FEATURED_ARTIST_IDS = [333792732, 453008334, 24056]
const MOST_LISTENED_ARTIST_IDS = [453008334, 333792732]

const presetOptions = [
  { value: 'featured', label: 'Featured Creators' },
  { value: 'custom', label: 'Custom Selection' },
  { value: 'favorite', label: 'Your Most Listened' }
]

type FormValues = {
  amount: number | undefined
  preset: 'featured' | 'custom' | 'favorite'
  userIds: ID[]
}

const initialValues: FormValues = {
  amount: undefined,
  preset: 'featured',
  userIds: []
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

type CustomPieChartProps = {
  data: { name: string; value: number }[]
}
const CustomPieChart = (props: CustomPieChartProps) => {
  const { data } = props
  return (
    <PieChart width={500} height={400} css={{ overflow: 'visible' }}>
      <Pie
        data={data}
        cx={250}
        cy={200}
        outerRadius={150}
        fill='#8884d8'
        dataKey='value'
        label={({ name, value }) => name}
        overflow={'visible'}
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip />
    </PieChart>
  )
}

export default CustomPieChart

type SplitDonationFormProps = {
  isLoading: boolean
}

const SplitDonationForm = (props: SplitDonationFormProps) => {
  const { isLoading } = props
  const { values, setFieldValue } = useFormikContext<FormValues>()
  const customSelectionUserIds = useSelector(getDonatingTo)

  const userIds = useMemo(() => {
    return (
      {
        featured: FEATURED_ARTIST_IDS,
        custom: customSelectionUserIds,
        favorite: MOST_LISTENED_ARTIST_IDS
      }[values.preset] ?? []
    )
  }, [values, customSelectionUserIds])

  const { data: users, status: usersStatus } = useGetUsersByIds({
    ids: userIds
  })

  useEffect(() => {
    setFieldValue('userIds', userIds)
  }, [userIds, setFieldValue])

  const piechartData = useMemo(() => {
    return (
      users?.map((user) => ({
        name: user.name,
        value: Number(((values.amount ?? 0) / userIds.length).toFixed(2))
      })) ?? []
    )
  }, [users, values, userIds])

  return (
    <Flex
      gap='l'
      alignItems='flex-start'
      css={{
        display: 'grid',
        'grid-template-columns': '2fr 1fr'
      }}
    >
      <Flex direction='column' gap='l' flex='1 1 auto'>
        <Paper direction='column' gap='l' p='xl'>
          <Text variant='title' css={{ alignSelf: 'left' }}>
            {messages.configureLabel}
          </Text>
          <TextField
            label={messages.amountInputLabel}
            placeholder='0'
            endAdornment='USDC'
            name='amount'
            type='number'
          />
          <SelectField
            options={presetOptions}
            name='preset'
            label={messages.selectPresetLabel}
          />
          <Button
            variant='primary'
            type='submit'
            fullWidth
            isLoading={isLoading}
          >
            {isLoading
              ? messages.donatingButtonLabel
              : messages.donateButtonLabel}
          </Button>
        </Paper>

        {userIds?.length && values.amount ? (
          <Paper direction='column' alignItems='center' gap='m' p='xl'>
            <Text variant='title' css={{ alignSelf: 'flex-start' }}>
              {messages.piechartLabel}
            </Text>
            {usersStatus === Status.LOADING ? (
              <LoadingSpinner />
            ) : (
              <CustomPieChart data={piechartData} />
            )}
          </Paper>
        ) : null}
      </Flex>
      <Flex direction='column' gap='l' flex='1 1 auto'>
        <Paper direction='column' gap='m' p='xl' alignItems='center'>
          <Text variant='title' css={{ alignSelf: 'flex-start' }}>
            {messages.usersListLabel}
          </Text>
          {usersStatus !== Status.LOADING && users?.length === 0 ? (
            <Flex direction='column' gap='m' alignItems='center' mv='3xl'>
              <IconUserList color='subdued' size='3xl' />
              <Text variant='body'>{messages.noUsersSelected}</Text>
              <Text variant='body'>{messages.noUsersDescription}</Text>
            </Flex>
          ) : (
            <UserList
              hasMore={false}
              loading={usersStatus === Status.LOADING}
              userId={null}
              users={users ?? []}
              isMobile={false}
              tag={'split-donation'}
              loadMore={() => {}}
              onClickArtistName={() => {}}
              onFollow={() => {}}
              onUnfollow={() => {}}
            />
          )}
        </Paper>
      </Flex>
    </Flex>
  )
}

export const SplitDonationPage = () => {
  const dispatch = useDispatch()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = useCallback(
    async (
      values: FormValues,
      { setFieldValue }: FormikHelpers<FormValues>
    ) => {
      setIsLoading(true)
      const { amount, userIds } = values
      const sdk = await audiusSdk()

      const amountPerUser = (amount ?? 0) / userIds.length

      try {
        const result = await sdk.users.sendSplitDonations({
          splits: userIds.map((id: number) => ({
            id: encodeHashId(id),
            amount: BigInt(
              amountPerUser * 10 ** TOKEN_LISTING_MAP.USDC.decimals
            )
          })),
          total: BigInt(
            Math.round((amount ?? 0) * 10 ** TOKEN_LISTING_MAP.USDC.decimals)
          )
        })

        console.log('Successfully sent split donation', result)

        setFieldValue('amount', undefined)
        dispatch(showConfetti())
        dispatch(toast({ content: `Successfully donated ${amount} USDC` }))
      } catch (e) {
        console.error(e)
      }
      setIsLoading(false)
    },
    [dispatch]
  )

  return (
    <Page
      title={messages.title}
      description={messages.description}
      header={header}
      css={{ textAlign: 'left' }}
    >
      <Formik initialValues={initialValues} onSubmit={handleSubmit}>
        <Form>
          <SplitDonationForm isLoading={isLoading} />
        </Form>
      </Formik>
    </Page>
  )
}
