import { z } from 'zod'

import { signUpFetch } from '~/api'
import { AudiusQueryContextType } from '~/audius-query'
import { MAX_HANDLE_LENGTH } from '~/services/oauth'
import { restrictedHandles as commonRestrictedHandles } from '~/utils/restrictedHandles'

export const pickHandleErrorMessages = {
  badCharacterError: 'Please only use A-Z, 0-9, . and _',
  twitterReservedError: 'This verified Twitter handle is reserved.',
  instagramReservedError: 'This verified Instagram handle is reserved.',
  tiktokReservedError: 'This verified TikTok handle is reserved.',
  genericReservedError: 'This verified handle is reserved.',
  unknownError: 'An unknown error occurred.',
  handleTakenError: 'That handle has already been taken.',
  handleTooLong: 'That handle is too long.',
  missingHandleError: 'Please enter a handle.'
}

/**
 * Restricted handles set includes route paths which are defined at the client level and passed in
 * @param restrictedHandles
 */
export const pickHandleSchema = ({
  audiusQueryContext,
  skipReservedHandleCheck = false,
  restrictedHandles = commonRestrictedHandles
}: {
  audiusQueryContext: AudiusQueryContextType
  skipReservedHandleCheck?: boolean
  restrictedHandles?: Set<string>
}) => {
  return z.object({
    handle: z
      .string({ required_error: '' })
      .max(MAX_HANDLE_LENGTH, pickHandleErrorMessages.handleTooLong)
      .regex(/^[a-zA-Z0-9_.]*$/, pickHandleErrorMessages.badCharacterError)
      .refine(
        (handle) => !restrictedHandles.has(handle.toLowerCase()),
        pickHandleErrorMessages.handleTakenError
      )
      .superRefine(async (handle, context) => {
        try {
          const isHandleInUse = await signUpFetch.isHandleInUse(
            { handle },
            audiusQueryContext
          )

          if (isHandleInUse) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              message: pickHandleErrorMessages.handleTakenError,
              fatal: true
            })
            return z.NEVER
          }
        } catch {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: pickHandleErrorMessages.unknownError
          })
          return z.NEVER
        }
        return z.NEVER
      })
      .superRefine(async (handle, context) => {
        if (skipReservedHandleCheck) return
        try {
          const handleReservedStatus =
            await signUpFetch.getHandleReservedStatus(
              { handle },
              audiusQueryContext
            )

          if (handleReservedStatus === 'twitterReserved') {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              message: pickHandleErrorMessages.twitterReservedError
            })
          } else if (handleReservedStatus === 'instagramReserved') {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              message: pickHandleErrorMessages.instagramReservedError
            })
          } else if (handleReservedStatus === 'tikTokReserved') {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              message: pickHandleErrorMessages.tiktokReservedError
            })
          }
        } catch {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: pickHandleErrorMessages.unknownError
          })
        }
      })
  })
}
