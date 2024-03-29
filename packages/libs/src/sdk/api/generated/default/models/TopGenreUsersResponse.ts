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
import type { User } from './User';
import {
    UserFromJSON,
    UserFromJSONTyped,
    UserToJSON,
} from './User';

/**
 * 
 * @export
 * @interface TopGenreUsersResponse
 */
export interface TopGenreUsersResponse {
    /**
     * 
     * @type {Array<User>}
     * @memberof TopGenreUsersResponse
     */
    data?: Array<User>;
}

/**
 * Check if a given object implements the TopGenreUsersResponse interface.
 */
export function instanceOfTopGenreUsersResponse(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function TopGenreUsersResponseFromJSON(json: any): TopGenreUsersResponse {
    return TopGenreUsersResponseFromJSONTyped(json, false);
}

export function TopGenreUsersResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): TopGenreUsersResponse {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'data': !exists(json, 'data') ? undefined : ((json['data'] as Array<any>).map(UserFromJSON)),
    };
}

export function TopGenreUsersResponseToJSON(value?: TopGenreUsersResponse | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'data': value.data === undefined ? undefined : ((value.data as Array<any>).map(UserToJSON)),
    };
}

