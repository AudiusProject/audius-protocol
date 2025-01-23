import { useCallback, useEffect, useState } from 'react'

import {
  DEVELOPER_APP_DESCRIPTION_MAX_LENGTH,
  DEVELOPER_APP_IMAGE_URL_MAX_LENGTH,
  DEVELOPER_APP_NAME_MAX_LENGTH,
  developerAppSchema,
  useAddDeveloperApp
} from '@audius/common/api'
import { Name } from '@audius/common/models'
import { accountSelectors } from '@audius/common/store'
import { Button } from '@audius/harmony'
import { Form, Formik } from 'formik'
import { z } from 'zod'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { make, useRecord } from 'common/store/analytics/actions'
import { TextAreaField, TextField } from 'components/form-fields'
import { useSelector } from 'utils/reducer'

import styles from './CreateNewAppPage.module.css'
import { CreateAppPageProps, CreateAppsPages } from './types'
const { getUserId } = accountSelectors

type DeveloperAppValues = z.input<typeof developerAppSchema>

const messages = {
  appNameLabel: 'App Name',
  descriptionLabel: 'Short Description',
  imageUrlLabel: 'App Icon URL',
  cancel: 'Cancel',
  create: 'Create Key',
  creating: 'Creating Key',
  miscError: 'Sorry, something went wrong. Please try again later.'
}

type CreateNewAppPageProps = CreateAppPageProps

export const CreateNewAppPage = (props: CreateNewAppPageProps) => {
  const { setPage } = props
  const userId = useSelector(getUserId) as number
  const record = useRecord()

  const {
    mutate: addDeveloperApp,
    data,
    error,
    isError,
    isPending,
    isSuccess
  } = useAddDeveloperApp()
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (isSuccess && data) {
      setPage(CreateAppsPages.APP_DETAILS, data)
      record(
        make(Name.DEVELOPER_APP_CREATE_SUCCESS, {
          name: data.name,
          apiKey: data.apiKey
        })
      )
    }
  }, [data, record, setPage, isSuccess])

  useEffect(() => {
    if (isError) {
      setSubmitError(messages.miscError)
      record(
        make(Name.DEVELOPER_APP_CREATE_ERROR, {
          error: error.message
        })
      )
    }
  }, [record, isError, error])

  const handleSubmit = useCallback(
    (values: DeveloperAppValues) => {
      setSubmitError(null)
      record(
        make(Name.DEVELOPER_APP_CREATE_SUBMIT, {
          name: values.name,
          description: values.description
        })
      )
      addDeveloperApp(values)
    },
    [addDeveloperApp, record]
  )

  const initialValues: DeveloperAppValues = {
    userId,
    name: '',
    description: '',
    // Undefined unless set to pass validation
    imageUrl: undefined
  }

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={toFormikValidationSchema(developerAppSchema)}
    >
      {() => (
        <Form className={styles.content}>
          <TextField
            name='name'
            label={messages.appNameLabel}
            disabled={isPending}
            maxLength={DEVELOPER_APP_NAME_MAX_LENGTH}
          />
          <TextField
            name='imageUrl'
            label={messages.imageUrlLabel}
            disabled={isPending}
            maxLength={DEVELOPER_APP_IMAGE_URL_MAX_LENGTH}
          />
          <TextAreaField
            name='description'
            placeholder={messages.descriptionLabel}
            showMaxLength
            maxLength={DEVELOPER_APP_DESCRIPTION_MAX_LENGTH}
            disabled={isPending}
          />
          <div className={styles.actionsContainer}>
            <Button
              variant='secondary'
              type='button'
              fullWidth
              disabled={isPending}
              onClick={() => setPage(CreateAppsPages.YOUR_APPS)}
            >
              {messages.cancel}
            </Button>
            <Button
              variant='primary'
              type='submit'
              fullWidth
              isLoading={isPending}
            >
              {isPending ? messages.creating : messages.create}
            </Button>
          </div>
          {submitError == null ? null : (
            <div className={styles.errorContainer}>
              <span className={styles.errorText}>{messages.miscError}</span>
            </div>
          )}
        </Form>
      )}
    </Formik>
  )
}
