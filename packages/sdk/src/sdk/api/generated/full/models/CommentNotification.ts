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
import type { CommentNotificationAction } from './CommentNotificationAction';
import {
    CommentNotificationActionFromJSON,
    CommentNotificationActionFromJSONTyped,
    CommentNotificationActionToJSON,
} from './CommentNotificationAction';

/**
 * 
 * @export
 * @interface CommentNotification
 */
export interface CommentNotification {
    /**
     * 
     * @type {string}
     * @memberof CommentNotification
     */
    type: string;
    /**
     * 
     * @type {string}
     * @memberof CommentNotification
     */
    groupId: string;
    /**
     * 
     * @type {boolean}
     * @memberof CommentNotification
     */
    isSeen: boolean;
    /**
     * 
     * @type {number}
     * @memberof CommentNotification
     */
    seenAt?: number;
    /**
     * 
     * @type {Array<CommentNotificationAction>}
     * @memberof CommentNotification
     */
    actions: Array<CommentNotificationAction>;
}

/**
 * Check if a given object implements the CommentNotification interface.
 */
export function instanceOfCommentNotification(value: object): value is CommentNotification {
    let isInstance = true;
    isInstance = isInstance && "type" in value && value["type"] !== undefined;
    isInstance = isInstance && "groupId" in value && value["groupId"] !== undefined;
    isInstance = isInstance && "isSeen" in value && value["isSeen"] !== undefined;
    isInstance = isInstance && "actions" in value && value["actions"] !== undefined;

    return isInstance;
}

export function CommentNotificationFromJSON(json: any): CommentNotification {
    return CommentNotificationFromJSONTyped(json, false);
}

export function CommentNotificationFromJSONTyped(json: any, ignoreDiscriminator: boolean): CommentNotification {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'type': json['type'],
        'groupId': json['group_id'],
        'isSeen': json['is_seen'],
        'seenAt': !exists(json, 'seen_at') ? undefined : json['seen_at'],
        'actions': ((json['actions'] as Array<any>).map(CommentNotificationActionFromJSON)),
    };
}

export function CommentNotificationToJSON(value?: CommentNotification | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'type': value.type,
        'group_id': value.groupId,
        'is_seen': value.isSeen,
        'seen_at': value.seenAt,
        'actions': ((value.actions as Array<any>).map(CommentNotificationActionToJSON)),
    };
}
