export const getPlaylist = `
const playlist = await audiusSdk.playlists.getPlaylist({
    playlistId: "AxRP0",
});
`;

export const getPlaylistTracks = `
const tracks = await audiusSdk.playlists.getPlaylistTracks({
    playlistId: "AxRP0",
});
`;

export const getTrendingPlaylists = `
const playlists = await audiusSdk.playlists.getTrendingPlaylists();
`;

export const searchPlaylists = `
const playlists = await audiusSdk.playlists.searchPlaylists({
    query: 'lo-fi',
});
`;
