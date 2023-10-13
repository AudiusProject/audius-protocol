import { z } from 'zod'

export const REMIX_OF = 'remix_of'
export const SHOW_REMIXES_BASE = `remixes`
export const SHOW_REMIXES = `field_visibility.remixes`
export const IS_REMIX = 'is_remix'
export const REMIX_LINK = 'remix_of_link'

const messages = {
  remixLinkError: 'Must provide valid remix link'
}

export const RemixSettingsFieldSchema = z
  .object({
    [SHOW_REMIXES]: z.optional(z.boolean()),
    [IS_REMIX]: z.boolean(),
    [REMIX_LINK]: z.optional(z.string()),
    parentTrackId: z.optional(z.number())
  })
  .refine((form) => !form[IS_REMIX] || form.parentTrackId, {
    message: messages.remixLinkError,
    path: [REMIX_LINK]
  })

export type RemixSettingsFormValues = z.input<typeof RemixSettingsFieldSchema>
