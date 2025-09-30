import { FormikHelpers } from 'formik'
import { z } from 'zod'
import { toFormikValidationSchema } from 'zod-formik-adapter'

export type EditCoinDetailsFormValues = {
  description: string
  socialLinks: {
    platform: 'x' | 'instagram' | 'tiktok' | 'website'
    value: string
  }[]
}

const messages = {
  descriptionTooLong: 'Description must be 2500 characters or less',
  invalidXHandle: 'Invalid X handle format',
  invalidInstagramHandle: 'Invalid Instagram handle format',
  invalidTiktokHandle: 'Invalid TikTok handle format',
  invalidWebsiteUrl: 'Invalid website URL'
}

const initialValues: EditCoinDetailsFormValues = {
  description: '',
  socialLinks: []
}

const socialLinkSchema = z
  .object({
    platform: z.enum(['x', 'instagram', 'tiktok', 'website']),
    value: z.string().min(1, 'Link cannot be empty')
  })
  .refine(
    (data) => {
      switch (data.platform) {
        case 'x':
          return /^@?[a-zA-Z0-9_]+$/.test(data.value) || data.value === ''
        case 'instagram':
          return /^@?[a-zA-Z0-9_.]+$/.test(data.value) || data.value === ''
        case 'tiktok':
          return /^@?[a-zA-Z0-9_.]+$/.test(data.value) || data.value === ''
        case 'website':
          return (
            data.value === '' || z.string().url().safeParse(data.value).success
          )
        default:
          return false
      }
    },
    {
      message: 'Invalid format for this platform',
      path: ['value']
    }
  )

const validationSchema = z.object({
  description: z.string().max(2500, messages.descriptionTooLong),
  socialLinks: z
    .array(socialLinkSchema)
    .max(4, 'Maximum 4 social links allowed')
    .refine((links) => {
      const platforms = links.map((link) => link.platform)
      return platforms.length === new Set(platforms).size
    }, 'Each platform can only be used once')
})

export const useEditCoinDetailsFormConfiguration = (
  onSubmit: (
    values: EditCoinDetailsFormValues,
    helpers: FormikHelpers<EditCoinDetailsFormValues>
  ) => void | Promise<void>
) => {
  const formikValidationSchema = toFormikValidationSchema(validationSchema)

  return {
    initialValues,
    validateOnChange: false,
    validationSchema: formikValidationSchema,
    onSubmit
  }
}
