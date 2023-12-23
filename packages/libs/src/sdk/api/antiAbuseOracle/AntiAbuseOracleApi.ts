import { BaseAPI, JSONApiResponse, exists } from '../generated/default'

export class AntiAbuseOracleApi extends BaseAPI {
  public async getChallengeAttestation({
    handle,
    challengeId,
    specifier,
    amount
  }: {
    handle: string
    challengeId: string
    specifier: string
    amount: number
  }) {
    const response = await this.request({
      path: `/attestation/${handle}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        challengeId,
        challengeSpecifier: specifier,
        amount
      }
    })
    return await new JSONApiResponse<{
      signature: string | false
      errorCode?: number
    }>(response, (json) => ({
      signature: exists(json, 'result') ? json.result : false,
      errorCode: exists(json, 'errorCode') ? json.errorCode : undefined
    })).value()
  }
}
