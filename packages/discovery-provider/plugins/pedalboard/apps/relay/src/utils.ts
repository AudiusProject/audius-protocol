import { DeveloperApps, Users } from '@pedalboard/storage'
import { decodeAbi } from './abi'

export const isUserCreate = (encodedABI: string): boolean => {
  const decodedAbi = decodeAbi(encodedABI)
  return decodedAbi.action === 'Create' && decodedAbi.entityType === 'User'
}

export const isUserDeactivate = (
  isDeactivated: boolean,
  encodedABI: string
): boolean => {
  const decodedAbi = decodeAbi(encodedABI)
  return (
    isDeactivated === false &&
    decodedAbi.action === 'Update' &&
    decodedAbi.entityType === 'User' &&
    JSON.parse(decodedAbi.metadata).data.is_deactivated === true
  )
}

export const coerceErrorToString = (e: unknown): string => {
  if (isString(e)) return e as string
  return e instanceof Error ? e.message : String(e)
}

export const isString = (value: unknown): value is string => {
  return typeof value === 'string';
}
