import { CheckAccessArgs, CheckAccessResponse } from './types'

export class StubPremiumContentAccessChecker {
  accessCheckReturnsWith: CheckAccessResponse = {} as CheckAccessResponse
  checkPremiumContentAccess(_args: CheckAccessArgs) {
    return Promise.resolve(this.accessCheckReturnsWith)
  }
}
