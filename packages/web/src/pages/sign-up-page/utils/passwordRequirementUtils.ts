import { commonPasswordCheck } from 'utils/commonPasswordCheck'

export const MIN_PASSWORD_LEN = 8

export const getMatchRequirementStatus = ({
  password,
  confirmPassword,
  ignoreError,
  enforceConfirmPasswordNotEmpty
}: {
  password: string
  confirmPassword: string
  ignoreError?: boolean
  enforceConfirmPasswordNotEmpty?: boolean
}) => {
  if (!password) return 'incomplete'
  if (!confirmPassword) {
    if (enforceConfirmPasswordNotEmpty && !ignoreError) {
      return 'error'
    } else {
      return 'incomplete'
    }
  }
  if (password !== confirmPassword) {
    return ignoreError ? 'incomplete' : 'error'
  }
  return 'complete'
}

export const getNumberRequirementStatus = ({
  password,
  ignoreError
}: {
  password: string
  ignoreError?: boolean
}) => {
  if (password.length === 0) return 'incomplete'
  if (!/\d/.test(password)) {
    return ignoreError ? 'incomplete' : 'error'
  }

  return 'complete'
}

export const getLengthRequirementStatus = ({
  password,
  ignoreError
}: {
  password: string
  ignoreError?: boolean
}) => {
  if (password.length === 0) return 'incomplete'
  if (password.length < MIN_PASSWORD_LEN) {
    return ignoreError ? 'incomplete' : 'error'
  }

  return 'complete'
}

export const getNotCommonRequirementStatus = async ({
  password,
  ignoreError
}: {
  password: string
  ignoreError?: boolean
}) => {
  if (password.length < MIN_PASSWORD_LEN) return 'incomplete'
  if (await commonPasswordCheck(password)) {
    return ignoreError ? 'incomplete' : 'error'
  }

  return 'complete'
}

const REQUIREMENTS_VALIDATORS = {
  hasNumber: getNumberRequirementStatus,
  matches: getMatchRequirementStatus,
  minLength: getLengthRequirementStatus,
  notCommon: getNotCommonRequirementStatus
}

export type PasswordRequirementKey = keyof typeof REQUIREMENTS_VALIDATORS

export const isRequirementsFulfilled = async ({
  password,
  confirmPassword
}: {
  password: string
  confirmPassword: string
}) => {
  for (const key in REQUIREMENTS_VALIDATORS) {
    const status = await REQUIREMENTS_VALIDATORS[key as PasswordRequirementKey](
      {
        password,
        confirmPassword
      }
    )
    if (status !== 'complete') {
      return false
    }
  }
  return true
}
