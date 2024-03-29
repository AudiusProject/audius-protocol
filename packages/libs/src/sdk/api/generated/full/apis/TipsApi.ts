/* tslint:disable */
// @ts-nocheck
/* eslint-disable */
/**
 * API
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: 1.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */


import * as runtime from '../runtime';
import type {
  GetTipsResponse,
} from '../models';
import {
    GetTipsResponseFromJSON,
    GetTipsResponseToJSON,
} from '../models';

export interface GetTipsRequest {
    offset?: number;
    limit?: number;
    userId?: string;
    receiverMinFollowers?: number;
    receiverIsVerified?: boolean;
    currentUserFollows?: GetTipsCurrentUserFollowsEnum;
    uniqueBy?: GetTipsUniqueByEnum;
    minSlot?: number;
    maxSlot?: number;
    txSignatures?: Array<string>;
}

/**
 * 
 */
export class TipsApi extends runtime.BaseAPI {

    /**
     * @hidden
     * Gets the most recent tips on the network
     */
    async getTipsRaw(params: GetTipsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<GetTipsResponse>> {
        const queryParameters: any = {};

        if (params.offset !== undefined) {
            queryParameters['offset'] = params.offset;
        }

        if (params.limit !== undefined) {
            queryParameters['limit'] = params.limit;
        }

        if (params.userId !== undefined) {
            queryParameters['user_id'] = params.userId;
        }

        if (params.receiverMinFollowers !== undefined) {
            queryParameters['receiver_min_followers'] = params.receiverMinFollowers;
        }

        if (params.receiverIsVerified !== undefined) {
            queryParameters['receiver_is_verified'] = params.receiverIsVerified;
        }

        if (params.currentUserFollows !== undefined) {
            queryParameters['current_user_follows'] = params.currentUserFollows;
        }

        if (params.uniqueBy !== undefined) {
            queryParameters['unique_by'] = params.uniqueBy;
        }

        if (params.minSlot !== undefined) {
            queryParameters['min_slot'] = params.minSlot;
        }

        if (params.maxSlot !== undefined) {
            queryParameters['max_slot'] = params.maxSlot;
        }

        if (params.txSignatures) {
            queryParameters['tx_signatures'] = params.txSignatures.join(runtime.COLLECTION_FORMATS["csv"]);
        }

        const headerParameters: runtime.HTTPHeaders = {};

        const response = await this.request({
            path: `/tips`,
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => GetTipsResponseFromJSON(jsonValue));
    }

    /**
     * Gets the most recent tips on the network
     */
    async getTips(params: GetTipsRequest = {}, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<GetTipsResponse> {
        const response = await this.getTipsRaw(params, initOverrides);
        return await response.value();
    }

}

/**
 * @export
 */
export const GetTipsCurrentUserFollowsEnum = {
    Sender: 'sender',
    Receiver: 'receiver',
    SenderOrReceiver: 'sender_or_receiver'
} as const;
export type GetTipsCurrentUserFollowsEnum = typeof GetTipsCurrentUserFollowsEnum[keyof typeof GetTipsCurrentUserFollowsEnum];
/**
 * @export
 */
export const GetTipsUniqueByEnum = {
    Sender: 'sender',
    Receiver: 'receiver'
} as const;
export type GetTipsUniqueByEnum = typeof GetTipsUniqueByEnum[keyof typeof GetTipsUniqueByEnum];
