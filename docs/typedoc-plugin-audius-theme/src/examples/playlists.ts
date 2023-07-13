export const getPlaylist = `
const playlistResponse = await audiusSdk.playlists.getPlaylist({
    playlistId: "AxRP0",
});

const playlist = playlistReponse.data?.[0];
`;

export const getPlaylistTracks = `
const playlistResponse = await audiusSdk.playlists.getPlaylistTracks({
    playlistId: "AxRP0",
});

const playlistTracks = playlistResponse.data;
`;

export const getTrendingPlaylists = `
const playlistsResponse = await audiusSdk.playlists.getTrendingPlaylists();

const trendingPlaylists = playlistsResponse?.data;
`;

export const searchPlaylists = `
const playlistsResponse = await audiusSdk.playlists.searchPlaylists({
    query: 'lo-fi',
});

const playlists = playlistsResponse?.data;
`;
