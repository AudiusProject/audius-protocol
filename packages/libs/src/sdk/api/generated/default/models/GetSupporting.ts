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
import type { Supporting } from './Supporting';
import {
    SupportingFromJSON,
    SupportingFromJSONTyped,
    SupportingToJSON,
} from './Supporting';

/**
 * 
 * @export
 * @interface GetSupporting
 */
export interface GetSupporting {
    /**
     * 
     * @type {Array<Supporting>}
     * @memberof GetSupporting
     */
    data?: Array<Supporting>;
}

/**
 * Check if a given object implements the GetSupporting interface.
 */
export function instanceOfGetSupporting(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function GetSupportingFromJSON(json: any): GetSupporting {
    return GetSupportingFromJSONTyped(json, false);
}

export function GetSupportingFromJSONTyped(json: any, ignoreDiscriminator: boolean): GetSupporting {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'data': !exists(json, 'data') ? undefined : ((json['data'] as Array<any>).map(SupportingFromJSON)),
    };
}

export function GetSupportingToJSON(value?: GetSupporting | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'data': value.data === undefined ? undefined : ((value.data as Array<any>).map(SupportingToJSON)),
    };
}

