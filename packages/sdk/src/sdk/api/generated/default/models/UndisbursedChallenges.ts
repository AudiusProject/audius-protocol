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
import type { UndisbursedChallenge } from './UndisbursedChallenge';
import {
    UndisbursedChallengeFromJSON,
    UndisbursedChallengeFromJSONTyped,
    UndisbursedChallengeToJSON,
} from './UndisbursedChallenge';

/**
 * 
 * @export
 * @interface UndisbursedChallenges
 */
export interface UndisbursedChallenges {
    /**
     * 
     * @type {Array<UndisbursedChallenge>}
     * @memberof UndisbursedChallenges
     */
    data?: Array<UndisbursedChallenge>;
}

/**
 * Check if a given object implements the UndisbursedChallenges interface.
 */
export function instanceOfUndisbursedChallenges(value: object): value is UndisbursedChallenges {
    let isInstance = true;

    return isInstance;
}

export function UndisbursedChallengesFromJSON(json: any): UndisbursedChallenges {
    return UndisbursedChallengesFromJSONTyped(json, false);
}

export function UndisbursedChallengesFromJSONTyped(json: any, ignoreDiscriminator: boolean): UndisbursedChallenges {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'data': !exists(json, 'data') ? undefined : ((json['data'] as Array<any>).map(UndisbursedChallengeFromJSON)),
    };
}

export function UndisbursedChallengesToJSON(value?: UndisbursedChallenges | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'data': value.data === undefined ? undefined : ((value.data as Array<any>).map(UndisbursedChallengeToJSON)),
    };
}

