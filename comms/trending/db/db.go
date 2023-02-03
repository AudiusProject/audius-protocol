package db

type DB interface {
	CheckHealth() bool
	QueryTrendingTracks() (string, error)
	QueryTrendingPlaylists() (string, error)
}
