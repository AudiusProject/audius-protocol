import { z } from 'zod'

import { AudiusQueryContextType } from 'audius-query'
import { MAX_HANDLE_LENGTH } from 'services/oauth'
import { signUpFetch } from 'src/api'
import { restrictedHandles as commonRestrictedHandles } from 'utils/restrictedHandles'

export const errorMessages = {
  badCharacterError: 'Please only use A-Z, 0-9, . and _',
  twitterReservedError: 'This verified Twitter handle is reserved.',
  instagramReservedError: 'This verified Instagram handle is reserved.',
  tiktokReservedError: 'This verified TikTok handle is reserved.',
  genericReservedError: 'This verified handle is reserved.',
  unknownError: 'An unknown error occurred.',
  handleTakenError: 'That handle has already been taken.',
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
      .string()
      .max(MAX_HANDLE_LENGTH)
      .regex(/^[a-zA-Z0-9_.]*$/, errorMessages.badCharacterError)
      .refine(
        (handle) => !restrictedHandles.has(handle.toLowerCase()),
        errorMessages.handleTakenError
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
              message: errorMessages.handleTakenError,
              fatal: true
            })
            return z.NEVER
          }
        } catch {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: errorMessages.unknownError
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
              message: errorMessages.twitterReservedError
            })
          } else if (handleReservedStatus === 'instagramReserved') {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              message: errorMessages.instagramReservedError
            })
          } else if (handleReservedStatus === 'tikTokReserved') {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              message: errorMessages.tiktokReservedError
            })
          }
        } catch {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: errorMessages.unknownError
          })
        }
      })
  })
}
