"use strict";
const followNotifsPreRead = [
    { blocknumber: 48, initiator: 2, metadata: { followee_user_id: 1, follower_user_id: 2 }, timestamp: '2019-12-26T05:37:56 Z', type: 'Follow' },
    { blocknumber: 136, initiator: 4, metadata: { followee_user_id: 3, follower_user_id: 4 }, timestamp: '2019-12-27T00:15:24 Z', type: 'Follow' },
    { blocknumber: 137, initiator: 5, metadata: { followee_user_id: 3, follower_user_id: 5 }, timestamp: '2019-12-27T00:15:24 Z', type: 'Follow' },
    { blocknumber: 138, initiator: 6, metadata: { followee_user_id: 3, follower_user_id: 6 }, timestamp: '2019-12-27T00:15:24 Z', type: 'Follow' },
    { blocknumber: 139, initiator: 7, metadata: { followee_user_id: 3, follower_user_id: 7 }, timestamp: '2019-12-27T00:15:24 Z', type: 'Follow' },
    { blocknumber: 140, initiator: 8, metadata: { followee_user_id: 3, follower_user_id: 8 }, timestamp: '2019-12-27T00:15:24 Z', type: 'Follow' },
    { blocknumber: 141, initiator: 9, metadata: { followee_user_id: 3, follower_user_id: 9 }, timestamp: '2019-12-27T00:15:24 Z', type: 'Follow' }
];
const followNotifsPostRead = [
    { blocknumber: 142, initiator: 2, metadata: { followee_user_id: 1, follower_user_id: 10 }, timestamp: '2019-12-26T05:37:56 Z', type: 'Follow' },
    { blocknumber: 143, initiator: 4, metadata: { followee_user_id: 3, follower_user_id: 11 }, timestamp: '2019-12-27T00:15:24 Z', type: 'Follow' },
    { blocknumber: 144, initiator: 5, metadata: { followee_user_id: 3, follower_user_id: 12 }, timestamp: '2019-12-27T00:15:24 Z', type: 'Follow' }
];
module.exports = {
    followNotifsPreRead,
    followNotifsPostRead
};
