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
import type { UserReplicaSet } from './UserReplicaSet';
import {
    UserReplicaSetFromJSON,
    UserReplicaSetFromJSONTyped,
    UserReplicaSetToJSON,
} from './UserReplicaSet';

/**
 * 
 * @export
 * @interface UsersByContentNode
 */
export interface UsersByContentNode {
    /**
     * 
     * @type {UserReplicaSet}
     * @memberof UsersByContentNode
     */
    data?: UserReplicaSet;
}

/**
 * Check if a given object implements the UsersByContentNode interface.
 */
export function instanceOfUsersByContentNode(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function UsersByContentNodeFromJSON(json: any): UsersByContentNode {
    return UsersByContentNodeFromJSONTyped(json, false);
}

export function UsersByContentNodeFromJSONTyped(json: any, ignoreDiscriminator: boolean): UsersByContentNode {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'data': !exists(json, 'data') ? undefined : UserReplicaSetFromJSON(json['data']),
    };
}

export function UsersByContentNodeToJSON(value?: UsersByContentNode | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'data': UserReplicaSetToJSON(value.data),
    };
}

