package db

type DB interface {
	CheckHealth() bool
	QueryTrendingTracks() ([]TrackEntity, error)
	QueryTrendingPlaylists() ([]PlaylistEntity, error)
}
