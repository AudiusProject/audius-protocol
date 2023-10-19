import { z } from 'zod'

export const REMIX_OF = 'remix_of'
export const SHOW_REMIXES_BASE = `remixes`
export const SHOW_REMIXES = `field_visibility.remixes`
export const IS_REMIX = 'is_remix'
export const REMIX_LINK = 'remix_of_link'
export const CAN_REMIX_PARENT = 'can_remix_parent'

const messages = {
  remixLinkError: 'Must provide valid remix link',
  remixAccessError: 'Must have access to parent track to remix'
}

export const RemixSettingsFieldSchema = z
  .object({
    [SHOW_REMIXES]: z.optional(z.boolean()),
    [IS_REMIX]: z.boolean(),
    [REMIX_LINK]: z.optional(z.string()),
    [CAN_REMIX_PARENT]: z.optional(z.boolean()),
    parentTrackId: z.optional(z.number())
  })
  .refine((form) => !form[IS_REMIX] || form.parentTrackId, {
    message: messages.remixLinkError,
    path: [REMIX_LINK]
  })
  .refine(
    (form) => {
      return form[CAN_REMIX_PARENT]
    },
    {
      message: messages.remixAccessError,
      path: [REMIX_LINK]
    }
  )

export type RemixSettingsFormValues = z.input<typeof RemixSettingsFieldSchema>
