package db

import "time"

// fields must match name and casing in clickhouse
type TrackEntity struct {
	TrackID       uint32    `ch:"track_id"`
	OwnerID       uint32    `ch:"owner_id"`
	RouteID       string    `ch:"route_id"`
	IsUnlisted    bool      `ch:"is_unlisted"`
	Title         string    `ch:"title"`
	Tags          string    `ch:"tags"`
	Genre         string    `ch:"genre"`
	Mood          string    `ch:"mood"`
	TrackSegments string    `ch:"track_segments"`
	CreatedAt     time.Time `ch:"created_at"`
	UpdatedAt     time.Time `ch:"updated_at"`
}

type PlaylistEntity struct {
	PlaylistID       uint32     `ch:"playlist_id"`
	PlaylistOwnerID  uint32     `ch:"playlist_owner_id"`
	PlaylistName     string     `ch:"playlist_name"`
	PlaylistContents string     `ch:"playlist_contents"`
	IsAlbum          bool       `ch:"is_album"`
	CreatedAt        time.Time  `ch:"created_at"`
	UpdatedAt        time.Time  `ch:"updated_at"`
	LastAddedTo      *time.Time `ch:"last_added_to"` // nullable
}
