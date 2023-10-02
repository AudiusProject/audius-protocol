const {
  handleResponse,
  successResponse,
  errorResponseForbidden,
  errorResponseServerError
} = require('../apiHelpers')
const { logger } = require('../logging')
const models = require('../models')
const authMiddleware = require('../authMiddleware')
const {
  cognitoFlowMiddleware,
  MAX_TIME_DRIFT_MILLISECONDS
} = require('../cognitoFlowMiddleware')
const {
  sign,
  createCognitoHeaders,
  createMaskedCognitoIdentity
} = require('../utils/cognitoHelpers')
const axios = require('axios')
const axiosHttpAdapter = require('axios/lib/adapters/http')
const config = require('../config')

module.exports = function (app) {
  app.get(
    '/cognito_signature',
    authMiddleware,
    handleResponse(async (req) => {
      const { walletAddress, handle } = req.user
      logger.info(
        `cognito_signature | Creating signature for: wallet '${walletAddress}', handle '${handle}'`
      )
      try {
        const signature = sign(handle)
        return successResponse({ signature })
      } catch (e) {
        logger.error(e)
        return errorResponseServerError({
          message: e.message
        })
      }
    })
  )

  /**
   * doc for webhook receiver implementation: https://docs.cognitohq.com/guides
   * cognito's webhook post request body will have the following format
   *
   * {
   *     "id": "some-id",
   *     "timestamp": "some-timestamp",
   *     "event": "flow_session.status.updated", // could be another event but we mostly care about flow_session.status.updated
   *     "data": {
   *         "object": "flow_session",
   *         "id": "some-session-id",
   *         "status": "failed", // or 'success'
   *         "step": null, // or some step if event is flow_session.step.updated
   *         "customer_reference": "some-customer-unique-persistent-id-eg-handle",
   *         "_meta": "This API format is not v1.0 and is subject to change."
   *     },
   *     "environment": "live" // or 'sandbox'
   * }
   */
  app.post(
    '/cognito_webhook/flow',
    cognitoFlowMiddleware,
    handleResponse(async (req) => {
      const { id, event, data } = req.body

      // if event is not of type status, meaning the event denotes of a step in the flow, but not the completion
      // then return 200 without further processing
      if (event !== 'flow_session.status.updated') return successResponse({})

      const { id: sessionId, customer_reference: handle, status } = data

      const transaction = await models.sequelize.transaction()

      try {
        // check that this identity has not already been used by another account before proceeding to save the score
        let cognitoIdentityAlreadyExists = false
        if (status === 'success') {
          const baseUrl = config.get('cognitoBaseUrl')
          const path = `/flow_sessions/${sessionId}`
          const method = 'GET'
          const body = ''
          const headers = createCognitoHeaders({ path, method, body })
          const url = `${baseUrl}${path}`
          const flowSessionResponse = await axios({
            adapter: axiosHttpAdapter,
            url,
            method,
            headers
          })

          // https://cognitohq.com/docs/reference#flow_get_flow_session
          // user is always present
          // documentary_verification is nullable but always present
          const {
            user: userInfo,
            documentary_verification: documentaryVerification
          } = flowSessionResponse.data

          // id_number is always present but nullable
          // phone is always present but nullable
          // date_of_birth is always present but nullable
          // address is always present but nullable
          // name is always present but nullable
          const {
            id_number: idNumber,
            phone,
            date_of_birth: dob,
            address,
            name
          } = userInfo
          const nameLowercased = name
            ? // if name is not null, then first and last are always present according to api
              {
                first: (name.first && name.first.toLowerCase()) || '',
                last: (name.last && name.last.toLowerCase()) || ''
              }
            : null

          // make cognito identities unique on:
          // - phone number, or
          // - combination of date of birth and name, or
          // - id number
          //    - if no id number, then we assume some sort of combination of phone, dob, address, and name
          const identities = []
          if (phone) {
            identities.push(phone)
          }
          if (dob && name) {
            // legacy check against dob and name
            identities.push(JSON.stringify({ dob, name }))
            // deduping against lowercased names
            identities.push(JSON.stringify({ dob, name: nameLowercased }))
          }
          if (
            documentaryVerification &&
            documentaryVerification.status === 'success'
          ) {
            // if document verification is not null, then status and documents are always present
            // within each document, the status is always present, and the extracted_data is always present but nullable
            const successfullyExtractedIdNumbers =
              documentaryVerification.documents
                .filter(
                  (document) =>
                    document.status === 'success' &&
                    document.extracted_data &&
                    document.extracted_data.id_number
                )
                .map((document) => document.extracted_data.id_number)
            successfullyExtractedIdNumbers.forEach((item) =>
              identities.push(item)
            )
          }
          if (idNumber) {
            const { value, category, type } = idNumber
            // reason why we did not JSON.stringify here is because
            // there are already users whose masked identities were based on this format
            identities.push(`${value}::${category}::${type}`)
          } else {
            // if webhook does not include id number, then we are expecting a few of the items below.
            // this is left here for backwards compatibility as it was the original lightning check
            // before we checked for dob and name
            identities.push(JSON.stringify({ phone, dob, address, name }))
          }

          const identitySet = new Set(identities)
          const maskedIdentities = [...identitySet].map(
            createMaskedCognitoIdentity
          )
          const records = await models.CognitoFlowIdentities.findAll({
            where: {
              maskedIdentity: { [models.Sequelize.Op.in]: maskedIdentities }
            }
          })

          if (records.length) {
            logger.info(
              `cognito_webhook flow | this identity has already been used previously | sessionId: ${sessionId}, handle: ${handle}`
            )
            cognitoIdentityAlreadyExists = true
          } else {
            const now = Date.now()
            const toCreate = maskedIdentities.map((maskedIdentity) => ({
              maskedIdentity,
              createdAt: now,
              updatedAt: now
            }))
            await models.CognitoFlowIdentities.bulkCreate(toCreate, {
              transaction
            })
          }
        }

        // only save cognito flow for user if status is 'success' or 'failed'
        // otherwise when e.g. a flow session retry is requested for a user, then
        // the 'canceled' webhook will be consumed and saved unintentionally
        if (['success', 'failed'].includes(status)) {
          await models.CognitoFlows.create(
            {
              id,
              sessionId,
              handle,
              status,
              // score of 1 if 'success' and no other account has previously used this same cognito identiy, otherwise 0
              // so it is possible to get a status of success yet a score of 0 because this identity has already been associated to another account
              score: Number(
                !cognitoIdentityAlreadyExists && status === 'success'
              )
            },
            { transaction }
          )
        }

        await transaction.commit()

        // cognito flow requires the receiver to respond with 200, otherwise it'll retry with exponential backoff
        return successResponse({})
      } catch (err) {
        await transaction.rollback()
        logger.error(
          `Failed to consume cognito flow webhook for user handle ${handle} for session id ${sessionId}`
        )
        logger.error(
          `The full webhook error payload for user handle ${handle} is: ${JSON.stringify(
            err
          )}`
        )
        return errorResponseServerError(err.message)
      }
    })
  )

  /**
   * This endpoint is not programatically called.
   * It exists in case we want to request a flow session retry for a handle
   * in case our webhook receiver runs into an issue
   */
  app.post(
    '/cognito_retry/:handle',
    handleResponse(async (req) => {
      const handle = req.params.handle

      if (req.headers['x-cognito-retry'] !== config.get('cognitoRetrySecret')) {
        return errorResponseForbidden(
          `Not permissioned to retry flow session for user handle ${handle}`
        )
      }

      try {
        const record = await models.CognitoFlows.findOne({ where: { handle } })
        // only request flow retry if no current passing score for handle
        // because there should be no need to redo the flow if score is already passing
        // also, it would otherwise be possible that the new flow will pass but the unique identity check will have a collision
        if (record && record.score === 1) {
          logger.info(
            `cognito_retry | Not requesting flow session retry for handle ${handle} because user already passed cognito`
          )
          return successResponse({})
        }

        const baseUrl = config.get('cognitoBaseUrl')
        const templateId = config.get('cognitoTemplateId')
        const path = '/flow_sessions/retry'
        const method = 'POST'
        const body = JSON.stringify({
          customer_reference: handle,
          template_id: templateId,
          strategy: 'reset'
        })
        const headers = createCognitoHeaders({ path, method, body })
        const url = `${baseUrl}${path}`

        await axios({
          adapter: axiosHttpAdapter,
          url,
          method,
          headers,
          data: body
        })

        // remove record if failing flow record exists
        // otherwise the existing record will be the one taken into account before even hitting the flow
        if (record) {
          await models.CognitoFlows.destroy({ where: { handle } })
        }

        logger.info(
          `cognito_retry | Successfully requested a flow session retry for user handle ${handle}`
        )
        return successResponse({})
      } catch (err) {
        logger.error(
          `cognito_retry | Failed request to retry flow session for user handle ${handle} with error message: ${err.message}`
        )
        logger.error(
          `cognito_retry | The full retry error payload for user handle ${handle} is: ${JSON.stringify(
            err
          )}`
        )
        return errorResponseServerError(err.message)
      }
    })
  )

  /**
   * Returns whether a recent cognito entry exists for a given handle.
   * This is so that the client can poll this endpoint to check whether
   * or not to proceed with a reward claim retry.
   */
  app.get(
    '/cognito_recent_exists/:handle',
    handleResponse(async (req) => {
      const handle = req.params.handle
      const records = await models.CognitoFlows.findAll({
        where: { handle },
        order: [['updatedAt', 'DESC']],
        limit: 1
      })
      if (records.length) {
        const timeDifferenceMilliseconds =
          Date.now() - new Date(records[0].updatedAt).getTime()
        return successResponse({
          exists: timeDifferenceMilliseconds <= MAX_TIME_DRIFT_MILLISECONDS
        })
      }
      return successResponse({ exists: false })
    })
  )

  /**
   * Gets the shareable_url for a Flow, for use with a webview on mobile
   * https://cognitohq.com/docs/flow/mobile-integration
   */
  app.post(
    '/cognito_flow',
    authMiddleware,
    handleResponse(async (req) => {
      const baseUrl = config.get('cognitoBaseUrl')
      const templateId = config.get('cognitoTemplateId')
      const {
        user: { handle }
      } = req
      const path = '/flow_sessions?idempotent=true'
      const method = 'POST'
      const body = JSON.stringify({
        shareable: true,
        template_id: templateId,
        user: {
          customer_reference: handle
        }
      })
      const headers = createCognitoHeaders({ path, method, body })
      const url = `${baseUrl}${path}`
      try {
        const response = await axios({
          adapter: axiosHttpAdapter,
          url,
          method,
          headers,
          data: body
        })
        return successResponse({ shareable_url: response.data.shareable_url })
      } catch (err) {
        logger.error(
          `Request failed to Cognito. Request=${JSON.stringify({
            url,
            method,
            headers,
            body
          })} Error=${err.message}`
        )
        if (
          err &&
          err.response &&
          err.response.data &&
          err.response.data.errors
        ) {
          logger.error(
            `Cognito returned errors: ${JSON.stringify(
              err.response.data.errors
            )}`
          )
        }
        return errorResponseServerError(err.message)
      }
    })
  )
}
