import { useCallback, useMemo } from 'react'

import { useGetUsersByIds } from '@audius/common/api'
import { Status } from '@audius/common/models'
import { Button, Flex, Paper } from '@audius/harmony'
import { Form, Formik, useFormik, useFormikContext } from 'formik'

import { TextField } from 'components/form-fields'
import { SelectField } from 'components/form-fields/SelectField'
import Header from 'components/header/desktop/Header'
import Page from 'components/page/Page'
import UserList from 'components/user-list/components/UserList'

const messages = {
  title: 'Split Donation',
  description: 'Split your donation between multiple creators',
  amountInputLabel: 'Donation Amount',
  donateButtonLabel: 'Donate',
  selectPresetLabel: 'Split Preset'
}

const header = <Header primary={messages.title} />

const FEATURED_ARTIST_IDS = [50672, 207676588, 985480]

const presetOptions = [
  { value: 'featured', label: 'Featured Creators' },
  { value: 'custom', label: 'Custom Selection' },
  { value: 'favorite', label: 'Your Favorite Creators' }
]

const initialValues = {
  preset: 'featured'
}

const SplitDonationForm = () => {
  const { values } = useFormikContext()

  const userIds = useMemo(() => {
    if (values.preset === 'featured') {
      return FEATURED_ARTIST_IDS
    }
    return []
  }, [])

  const { data: users, status: usersStatus } = useGetUsersByIds({
    ids: userIds
  })

  return (
    <Flex gap='m'>
      <Paper direction='column' gap='m' p='xl' flex='1 1 auto'>
        <TextField
          label={messages.amountInputLabel}
          placeholder='0'
          endAdornment='$AUDIO'
          name='amount'
          type='number'
        />
        <SelectField
          options={presetOptions}
          name='preset'
          label={messages.selectPresetLabel}
        />
        <Button variant='primary' type='submit' fullWidth>
          {messages.donateButtonLabel}
        </Button>
      </Paper>
      <Paper direction='column' gap='m' p='xl'>
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
      </Paper>
    </Flex>
  )
}

export const SplitDonationPage = () => {
  const handleSubmit = useCallback((formValues: any) => {
    console.log('submit', formValues)
  }, [])
  return (
    <Page
      title={messages.title}
      description={messages.description}
      header={header}
    >
      <Formik initialValues={initialValues} onSubmit={handleSubmit}>
        <Form>
          <SplitDonationForm />
        </Form>
      </Formik>
    </Page>
  )
}
