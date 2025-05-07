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

  const addDeveloperApp = useAddDeveloperApp()
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (addDeveloperApp.isSuccess && addDeveloperApp.data) {
      setPage(CreateAppsPages.APP_DETAILS, addDeveloperApp.data)
      record(
        make(Name.DEVELOPER_APP_CREATE_SUCCESS, {
          name: addDeveloperApp.data.name,
          apiKey: addDeveloperApp.data.apiKey
        })
      )
    }
  }, [addDeveloperApp.isSuccess, addDeveloperApp.data, record, setPage])

  useEffect(() => {
    if (addDeveloperApp.isError) {
      setSubmitError(messages.miscError)
      record(
        make(Name.DEVELOPER_APP_CREATE_ERROR, {
          error: addDeveloperApp.error?.message
        })
      )
    }
  }, [addDeveloperApp.isError, record, addDeveloperApp.error?.message])

  const handleSubmit = useCallback(
    (values: DeveloperAppValues) => {
      setSubmitError(null)
      record(
        make(Name.DEVELOPER_APP_CREATE_SUBMIT, {
          name: values.name,
          description: values.description
        })
      )
      addDeveloperApp.mutate(values)
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

  const isSubmitting = addDeveloperApp.isPending
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
            disabled={isSubmitting}
            maxLength={DEVELOPER_APP_NAME_MAX_LENGTH}
          />
          <TextField
            name='imageUrl'
            label={messages.imageUrlLabel}
            disabled={isSubmitting}
            maxLength={DEVELOPER_APP_IMAGE_URL_MAX_LENGTH}
          />
          <TextAreaField
            name='description'
            placeholder={messages.descriptionLabel}
            showMaxLength
            maxLength={DEVELOPER_APP_DESCRIPTION_MAX_LENGTH}
            disabled={isSubmitting}
          />
          <div className={styles.actionsContainer}>
            <Button
              variant='secondary'
              type='button'
              fullWidth
              disabled={isSubmitting}
              onClick={() => setPage(CreateAppsPages.YOUR_APPS)}
            >
              {messages.cancel}
            </Button>
            <Button
              variant='primary'
              type='submit'
              fullWidth
              isLoading={isSubmitting}
            >
              {isSubmitting ? messages.creating : messages.create}
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
