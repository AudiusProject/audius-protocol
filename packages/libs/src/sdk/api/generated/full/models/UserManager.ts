/* tslint:disable */
/* eslint-disable */
// @ts-nocheck
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

import { exists, mapValues } from '../runtime';
import type { Grant } from './Grant';
import {
    GrantFromJSON,
    GrantFromJSONTyped,
    GrantToJSON,
} from './Grant';
import type { UserFull } from './UserFull';
import {
    UserFullFromJSON,
    UserFullFromJSONTyped,
    UserFullToJSON,
} from './UserFull';

/**
 * 
 * @export
 * @interface UserManager
 */
export interface UserManager {
    /**
     * 
     * @type {UserFull}
     * @memberof UserManager
     */
    manager: UserFull;
    /**
     * 
     * @type {Grant}
     * @memberof UserManager
     */
    grant: Grant;
}

/**
 * Check if a given object implements the UserManager interface.
 */
export function instanceOfUserManager(value: object): value is UserManager {
    let isInstance = true;
    isInstance = isInstance && "manager" in value && value["manager"] !== undefined;
    isInstance = isInstance && "grant" in value && value["grant"] !== undefined;

    return isInstance;
}

export function UserManagerFromJSON(json: any): UserManager {
    return UserManagerFromJSONTyped(json, false);
}

export function UserManagerFromJSONTyped(json: any, ignoreDiscriminator: boolean): UserManager {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'manager': UserFullFromJSON(json['manager']),
        'grant': GrantFromJSON(json['grant']),
    };
}

export function UserManagerToJSON(value?: UserManager | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'manager': UserFullToJSON(value.manager),
        'grant': GrantToJSON(value.grant),
    };
}

