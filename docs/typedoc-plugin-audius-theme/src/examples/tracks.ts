export const getBulkTracks = `
const tracksResponse = await audiusSdk.tracks.getBulkTracks({ id: ['D7KyD', 'PjdWN', 'Jwo2A'] });
const tracks = tracksResponse.data;
`;

export const getTrack = `
const trackResponse = await audiusSdk.tracks.getTrack({
    trackId: "D7KyD",
});

const track = trackResponse.data;
`;

export const getTrendingTracks = `
const tracksResponse = await audiusSdk.tracks.getTrendingTracks();
const tracks = tracksResponse.data;
`;

export const searchTracks = `
const searchResponse = await audiusSdk.tracks.searchTracks({
    query: "skrillex",
});
const searchResults = searchResponse.data;
`;

export const streamTrack = `
const url = await audiusSdk.tracks.streamTrack({
    trackId: "PjdWN",
});
const audio = new Audio(url);
audio.play();
`;
