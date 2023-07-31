export const getConnectedWallets = `
const walletsResponse = await audiusSdk.users.getConnectedWallets({
    id: "eAZl3"
});

const wallets = walletsResponse.data;
`;

export const getFavorites = `
const favoritesResponse = await audiusSdk.users.getFavorites({
    id: "eAZl3"
});

const favorites = favoritesResponse.data;
`;

export const getReposts = `
const repostsResponse = await audiusSdk.users.getReposts({
    id: "eAZl3"
});

const resposts = repostsResponse.data;
`;

export const getSupporters = `
const supportersResponse = await audiusSdk.users.getSupporters({
    id: "eAZl3"
});

const supporters = supportersResponse.data;
`;

export const getSupportings = `
const supportingsResponse = await audiusSdk.users.getSupportings({
    id: "eAZl3"
});

const supportings = supportingsResponse.data;
`;

export const getTopTrackTags = `
const tagsResponse = await audiusSdk.users.getTopTrackTags({
    id: "eAZl3"
});

const tags = tagsResponse.data;
`;

export const getTracksByUser = `
const tracksResponse = await audiusSdk.users.getTracksByUser({
    id: "eAZl3"
});

const tracks = tracksResponse.data;
`;

export const getUser = `
const userResponse = await audiusSdk.users.getUser({
    id: "eAZl3"
});

const user = userResponse.data;
`;

export const getUserIdFromWallet = `
const idResponse = await audiusSdk.users.getUserIDFromWallet({
    associatedWallet: '0x10c16c7B8b1DDCFE65990ec822DE4379dd8a86dE'
});

const userId = idResponse.data;
`;

export const searchUsers = `
const usersResponse = await audiusSdk.users.searchUsers({
    query: 'skrillex'
})

const users = usersResponse.data;
`;
