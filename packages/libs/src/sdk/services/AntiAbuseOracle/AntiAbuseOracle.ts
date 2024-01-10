import { BaseAPI, JSONApiResponse, exists } from '../../api/generated/default'
import { parseParams } from '../../utils/parseParams'
import {
  AntiAbuseOracleService,
  AttestationRequest,
  AttestationResponse,
  GetAttestationSchema
} from './types'

export class AntiAbuseOracle extends BaseAPI implements AntiAbuseOracleService {
  public async getChallengeAttestation(args: AttestationRequest) {
    const { handle, challengeId, specifier, amount } = await parseParams(
      'getChallengeAttestation',
      GetAttestationSchema
    )(args)
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
    return await new JSONApiResponse<AttestationResponse>(response, (json) => ({
      signature: exists(json, 'result') ? json.result : false,
      errorCode: exists(json, 'errorCode') ? json.errorCode : undefined
    })).value()
  }
}
