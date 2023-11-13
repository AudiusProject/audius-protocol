import {
  AudiusQueryContextType,
  HandleCheckStatus,
  MAX_HANDLE_LENGTH,
  signUpFetch
} from '@audius/common'
import { z } from 'zod'

import restrictedHandles from 'utils/restrictedHandles'

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

export const generateHandleSchema = (
  audiusQueryContext: AudiusQueryContextType
) => {
  return z.object({
    handle: z
      .string()
      .max(MAX_HANDLE_LENGTH)
      .regex(/^[a-zA-Z0-9_.]*$/, errorMessages.badCharacterError)
      .refine(
        (h) => !restrictedHandles.has(h.toLowerCase()),
        errorMessages.handleTakenError
      )
      .superRefine(async (h, context) => {
        let isHandleInUse: boolean
        try {
          isHandleInUse = await signUpFetch.isHandleInUse(
            { handle: h },
            audiusQueryContext
          )
        } catch {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: errorMessages.unknownError
          })
          return
        }
        if (isHandleInUse) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: errorMessages.handleTakenError,
            fatal: true
          })
          return z.NEVER
        }
      })
      .superRefine(async (h, context) => {
        let handleReservedStatus: HandleCheckStatus
        try {
          handleReservedStatus = await signUpFetch.getHandleReservedStatus(
            { handle: h },
            audiusQueryContext
          )
        } catch {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: errorMessages.unknownError
          })
          return
        }
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
      })
  })
}
