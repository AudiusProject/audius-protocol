export const getConnectedWallets = `
const wallets = await audiusSdk.users.getConnectedWallets({
    id: "eAZl3"
})
`;

export const getFavorites = `
const favorites = await audiusSdk.users.getFavorites({
    id: "eAZl3"
})
`;

export const getReposts = `
const reposts = await audiusSdk.users.getReposts({
    id: "eAZl3"
})
`;

export const getSupporters = `
const supporters = await audiusSdk.users.getSupporters({
    id: "eAZl3"
})
`;

export const getSupportings = `
const supportings = await audiusSdk.users.getSupportings({
    id: "eAZl3"
})
`;

export const getTopTrackTags = `
const tags = await audiusSdk.users.getTopTrackTags({
    id: "eAZl3"
})
`;

export const getTracksByUser = `
const tracks = await audiusSdk.users.getTracksByUser({
    id: "eAZl3"
})
`;

export const getUser = `
const user = await audiusSdk.users.getUser({
    id: "eAZl3"
})
`;

export const getUserIdFromWallet = `
const id = await audiusSdk.users.getUserIDFromWallet({
    associatedWallet: '0x10c16c7B8b1DDCFE65990ec822DE4379dd8a86dE'
})
`;

export const searchUsers = `
const users = await audiusSdk.users.searchUsers({
    query: 'skrillex'
})
`;
