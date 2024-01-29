const ROUTE_PREFIX = import.meta.env.BASE_URL

export const ID_ROUTE = `${ROUTE_PREFIX}:type`
export const HASH_ID_ROUTE = `${ROUTE_PREFIX}:type/:hashId`

export const AUDIO_NFT_PLAYLIST_ROUTE = `${ROUTE_PREFIX}:handle/audio-nft-playlist`
export const COLLECTIBLES_ROUTE = `${ROUTE_PREFIX}:handle/collectibles`
export const COLLECTIBLE_ID_ROUTE = `${ROUTE_PREFIX}:handle/collectibles/:collectibleId`

// Note: Discord only respects audius.co embed players at a prefix of
// audius.co/track, audius.co/album, audius.co/playlist
// We add support for Discord by offering a an alternative route "hack"
// These URLs are *never* to be shared more broadly than in the
// general-admission response to a Discordbot.
export const AUDIO_NFT_PLAYLIST_DISCORD_ROUTE = `${ROUTE_PREFIX}track/:handle/audio-nft-playlist`
export const COLLECTIBLES_DISCORD_ROUTE = `${ROUTE_PREFIX}track/:handle/collectibles`
export const COLLECTIBLE_ID_DISCORD_ROUTE = `${ROUTE_PREFIX}track/:handle/collectibles/:collectibleId`
