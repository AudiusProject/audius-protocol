/* tslint:disable */
/* eslint-disable */
// @ts-nocheck
/**
 * API
 * Audius V1 API
 *
 * The version of the OpenAPI document: 1.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { exists, mapValues } from '../runtime';
import type { Coin } from './Coin';
import {
    CoinFromJSON,
    CoinFromJSONTyped,
    CoinToJSON,
} from './Coin';

/**
 * 
 * @export
 * @interface CoinsResponse
 */
export interface CoinsResponse {
    /**
     * 
     * @type {Array<Coin>}
     * @memberof CoinsResponse
     */
    data: Array<Coin>;
}

/**
 * Check if a given object implements the CoinsResponse interface.
 */
export function instanceOfCoinsResponse(value: object): value is CoinsResponse {
    let isInstance = true;
    isInstance = isInstance && "data" in value && value["data"] !== undefined;

    return isInstance;
}

export function CoinsResponseFromJSON(json: any): CoinsResponse {
    return CoinsResponseFromJSONTyped(json, false);
}

export function CoinsResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): CoinsResponse {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'data': ((json['data'] as Array<any>).map(CoinFromJSON)),
    };
}

export function CoinsResponseToJSON(value?: CoinsResponse | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'data': ((value.data as Array<any>).map(CoinToJSON)),
    };
}

