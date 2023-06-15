import { useCallback, useEffect } from 'react'

import {
  Status,
  accountSelectors,
  developerAppSchema,
  useAddDeveloperApp
} from '@audius/common'
import { Button, ButtonType } from '@audius/stems'
import { Form, Formik } from 'formik'
import { z } from 'zod'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { InputV2Variant } from 'components/data-entry/InputV2'
import { TextAreaField } from 'components/form-fields/TextAreaField'
import { TextField } from 'components/form-fields/TextField'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { useSelector } from 'utils/reducer'

import styles from './CreateNewAppPage.module.css'
import { CreateAppPageProps, CreateAppsPages } from './types'
const { getUserId } = accountSelectors

type DeveloperAppValues = z.input<typeof developerAppSchema>

const messages = {
  appNameLabel: 'App Name',
  descriptionLabel: 'Short Description',
  cancel: 'Cancel',
  create: 'Create Key',
  creating: 'Creating Key'
}

type CreateNewAppPageProps = CreateAppPageProps

export const CreateNewAppPage = (props: CreateNewAppPageProps) => {
  const { setPage } = props
  const userId = useSelector(getUserId) as number

  const [addDeveloperApp, result] = useAddDeveloperApp()

  const { status, data } = result

  useEffect(() => {
    if (status === Status.SUCCESS && data) {
      setPage(CreateAppsPages.APP_DETAILS, data)
    }
  })

  const handleSubmit = useCallback(
    (values: DeveloperAppValues) => {
      addDeveloperApp(values)
    },
    [addDeveloperApp]
  )

  const initialValues: DeveloperAppValues = {
    userId,
    name: '',
    description: ''
  }

  const isSubmitting = status !== Status.IDLE

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
            variant={InputV2Variant.ELEVATED_PLACEHOLDER}
            label={messages.appNameLabel}
          />
          <TextAreaField
            name='description'
            placeholder={messages.descriptionLabel}
            showMaxLength
            maxLength={developerAppSchema.shape.description.unwrap().maxLength!}
          />
          <div className={styles.footer}>
            <Button
              text={messages.cancel}
              fullWidth
              type={ButtonType.COMMON_ALT}
              disabled={isSubmitting}
              onClick={() => setPage(CreateAppsPages.YOUR_APPS)}
            />
            <Button
              buttonType='submit'
              text={isSubmitting ? messages.creating : messages.create}
              fullWidth
              rightIcon={
                isSubmitting ? (
                  <LoadingSpinner className={styles.creatingSpinner} />
                ) : undefined
              }
              disabled={isSubmitting}
            />
          </div>
        </Form>
      )}
    </Formik>
  )
}
