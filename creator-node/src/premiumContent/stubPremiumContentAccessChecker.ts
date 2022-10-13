import { CheckAccessArgs, CheckAccessResponse } from './types'

export class StubPremiumContentAccessChecker {
  accessCheckReturnsWith: CheckAccessResponse = {} as CheckAccessResponse
  checkPremiumContentAccess(args: CheckAccessArgs) {
    return Promise.resolve(this.accessCheckReturnsWith)
  }
}
