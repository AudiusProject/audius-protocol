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
/**
 * 
 * @export
 * @interface UnclaimedIdResponse
 */
export interface UnclaimedIdResponse {
    /**
     * 
     * @type {string}
     * @memberof UnclaimedIdResponse
     */
    data?: string;
}

/**
 * Check if a given object implements the UnclaimedIdResponse interface.
 */
export function instanceOfUnclaimedIdResponse(value: object): value is UnclaimedIdResponse {
    let isInstance = true;

    return isInstance;
}

export function UnclaimedIdResponseFromJSON(json: any): UnclaimedIdResponse {
    return UnclaimedIdResponseFromJSONTyped(json, false);
}

export function UnclaimedIdResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): UnclaimedIdResponse {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'data': !exists(json, 'data') ? undefined : json['data'],
    };
}

export function UnclaimedIdResponseToJSON(value?: UnclaimedIdResponse | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'data': value.data,
    };
}

