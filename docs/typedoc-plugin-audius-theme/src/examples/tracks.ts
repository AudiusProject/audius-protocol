export const getBulkTracks = `
const tracks = await audiusSdk.tracks.getBulkTracks();
`;

export const getTrack = `
const track = await audiusSdk.tracks.getTrack({
    trackId: "D7KyD",
});
`;

export const getTrendingTracks = `
const tracks = await audiusSdk.tracks.getTrendingTracks();
`;

export const searchTracks = `
const searchResult = await audiusSdk.tracks.searchTracks({
    query: "skrillex",
});
`;

export const streamTrack = `
const url = await audiusSdk.tracks.streamTrack({
    trackId: "PjdWN",
});
const audio = new Audio(url);
audio.play();
`;
