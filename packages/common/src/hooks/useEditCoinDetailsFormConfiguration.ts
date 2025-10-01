import { FormikHelpers } from 'formik'
import { z } from 'zod'
import { toFormikValidationSchema } from 'zod-formik-adapter'

export type EditCoinDetailsFormValues = {
  description: string
  socialLinks: string[]
}

const messages = {
  descriptionTooLong: 'Description must be 2500 characters or less',
  invalidUrl: 'Invalid URL format'
}

const validationSchema = z.object({
  description: z.string().max(2500, messages.descriptionTooLong),
  socialLinks: z
    .array(
      z
        .string()
        .refine(
          (value) => value === '' || z.string().url().safeParse(value).success,
          {
            message: messages.invalidUrl
          }
        )
    )
    .max(4, 'Maximum 4 social links allowed')
})

export const useEditCoinDetailsFormConfiguration = (
  onSubmit: (
    values: EditCoinDetailsFormValues,
    helpers: FormikHelpers<EditCoinDetailsFormValues>
  ) => void | Promise<void>,
  initialValues: EditCoinDetailsFormValues
) => {
  const formikValidationSchema = toFormikValidationSchema(validationSchema)

  return {
    initialValues,
    validateOnChange: false,
    validationSchema: formikValidationSchema,
    onSubmit
  }
}
