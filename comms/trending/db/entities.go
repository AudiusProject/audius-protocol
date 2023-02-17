package db

import "time"

type TrackEntity struct {
	TrackID       uint32
	OwnerID       uint32
	RouteID       string
	IsUnlisted    bool
	Title         string
	Tags          string
	Genre         string
	Mood          string
	TrackSegments string
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

type PlaylistEntity struct {
	PlaylistID       uint32
	PlaylistOwnerID  uint32
	PlaylistName     string
	PlaylistContents string
	IsAlbum          bool
	CreatedAt        time.Time
	UpdatedAt        time.Time
	LastAddedTo      *time.Time // nullable
}
