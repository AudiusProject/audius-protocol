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
  TransactionHistoryCountResponse,
  TransactionHistoryResponse,
} from '../models';
import {
    TransactionHistoryCountResponseFromJSON,
    TransactionHistoryCountResponseToJSON,
    TransactionHistoryResponseFromJSON,
    TransactionHistoryResponseToJSON,
} from '../models';

export interface GetAudioTransactionHistoryRequest {
    offset?: number;
    limit?: number;
    sortMethod?: GetAudioTransactionHistorySortMethodEnum;
    sortDirection?: GetAudioTransactionHistorySortDirectionEnum;
    encodedDataMessage?: string;
    encodedDataSignature?: string;
}

export interface GetAudioTransactionHistoryCountRequest {
    encodedDataMessage?: string;
    encodedDataSignature?: string;
}

/**
 * 
 */
export class TransactionsApi extends runtime.BaseAPI {

    /**
     * @hidden
     * @deprecated
     * Deprecated: Use `/users/{id}/transactions/audio` or `sdk.full.users.getAudioTransactions()` instead.
     * Gets the user\'s $AUDIO transaction history within the App
     */
    async getAudioTransactionHistoryRaw(params: GetAudioTransactionHistoryRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<TransactionHistoryResponse>> {
        const queryParameters: any = {};

        if (params.offset !== undefined) {
            queryParameters['offset'] = params.offset;
        }

        if (params.limit !== undefined) {
            queryParameters['limit'] = params.limit;
        }

        if (params.sortMethod !== undefined) {
            queryParameters['sort_method'] = params.sortMethod;
        }

        if (params.sortDirection !== undefined) {
            queryParameters['sort_direction'] = params.sortDirection;
        }

        const headerParameters: runtime.HTTPHeaders = {};

        if (params.encodedDataMessage !== undefined && params.encodedDataMessage !== null) {
            headerParameters['Encoded-Data-Message'] = String(params.encodedDataMessage);
        }

        if (params.encodedDataSignature !== undefined && params.encodedDataSignature !== null) {
            headerParameters['Encoded-Data-Signature'] = String(params.encodedDataSignature);
        }

        const response = await this.request({
            path: `/transactions`,
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => TransactionHistoryResponseFromJSON(jsonValue));
    }

    /**
     * @deprecated
     * Deprecated: Use `/users/{id}/transactions/audio` or `sdk.full.users.getAudioTransactions()` instead.
     * Gets the user\'s $AUDIO transaction history within the App
     */
    async getAudioTransactionHistory(params: GetAudioTransactionHistoryRequest = {}, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<TransactionHistoryResponse> {
        const response = await this.getAudioTransactionHistoryRaw(params, initOverrides);
        return await response.value();
    }

    /**
     * @hidden
     * @deprecated
     * Deprecated: Use `/users/{id}/transactions/audio/count` or `sdk.full.users.getAudioTransactionCount()` instead.
     * Gets the count of the user\'s $AUDIO transaction history within the App
     */
    async getAudioTransactionHistoryCountRaw(params: GetAudioTransactionHistoryCountRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<TransactionHistoryCountResponse>> {
        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        if (params.encodedDataMessage !== undefined && params.encodedDataMessage !== null) {
            headerParameters['Encoded-Data-Message'] = String(params.encodedDataMessage);
        }

        if (params.encodedDataSignature !== undefined && params.encodedDataSignature !== null) {
            headerParameters['Encoded-Data-Signature'] = String(params.encodedDataSignature);
        }

        const response = await this.request({
            path: `/transactions/count`,
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => TransactionHistoryCountResponseFromJSON(jsonValue));
    }

    /**
     * @deprecated
     * Deprecated: Use `/users/{id}/transactions/audio/count` or `sdk.full.users.getAudioTransactionCount()` instead.
     * Gets the count of the user\'s $AUDIO transaction history within the App
     */
    async getAudioTransactionHistoryCount(params: GetAudioTransactionHistoryCountRequest = {}, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<TransactionHistoryCountResponse> {
        const response = await this.getAudioTransactionHistoryCountRaw(params, initOverrides);
        return await response.value();
    }

}

/**
 * @export
 */
export const GetAudioTransactionHistorySortMethodEnum = {
    Date: 'date',
    TransactionType: 'transaction_type'
} as const;
export type GetAudioTransactionHistorySortMethodEnum = typeof GetAudioTransactionHistorySortMethodEnum[keyof typeof GetAudioTransactionHistorySortMethodEnum];
/**
 * @export
 */
export const GetAudioTransactionHistorySortDirectionEnum = {
    Asc: 'asc',
    Desc: 'desc'
} as const;
export type GetAudioTransactionHistorySortDirectionEnum = typeof GetAudioTransactionHistorySortDirectionEnum[keyof typeof GetAudioTransactionHistorySortDirectionEnum];