package db

import "database/sql"

type AuthTokens struct {
	AuthToken string `db:"auth_token"`
	CreatedAt sql.NullTime `db:"created_at"`
	UpdatedAt sql.NullTime `db:"updated_at"`
}

type DelistEmails struct {
	Id int `db:"id"`
	Sender string `db:"sender"`
	Recipient string `db:"recipient"`
	Subject string `db:"subject"`
	EmailBody string `db:"email_body"`
	Signature string `db:"signature"`
	MessageId string `db:"message_id"`
	AutoReplied string `db:"auto_replied"`
	DateSent string `db:"data_sent"`
	CreatedAt sql.NullTime `db:"created_at"`
	UpdatedAt sql.NullTime `db:"updated_at"`
}

type ParsedEmails struct {
    Id int `db:"id"`
	Sender string `db:"sender"`
	MessageId string `db:"message_id"`
	Cid string `db:"cid"`
	EncodedTrackId string `db:"encoded_track_id"`
	TrackId string `db:"track_id"`
	UserId string `db:"user_id"`
	ReplicaSet string `db:"replica_set"`
	Link string `db:"link"`
	Origin string `db:"origin"`
	DateSent string `db:"date_sent"`
	Processed string `db:"processed"` 
	IsCurrent bool `db:"is_current"`
	CreatedAt sql.NullTime `db:"created_at"`
	UpdatedAt sql.NullTime `db:"updated_at"`
}

type ProcessedTracks struct {
	Id int `db:"id"` 
	Cid string `db:"cid"`
	TrackId string `db:"track_id"`
	UserId string `db:"user_id"`
	MessageId string `db:"message_id"`
	Processed string `db:"processed"`
	Match bool `db:"match"`
	MatchResponse string `db:"match_response"`
	CreatedAt sql.NullTime `db:"created_at"`
	UpdatedAt sql.NullTime `db:"updated_at"`
}

type UserStrikes struct {
	UserId string `db:"user_id"`
	Strikes	int `db:"strikes"`
	Delisted bool `db:"delisted"`
	CreatedAt sql.NullTime `db:"created_at"`
	UpdatedAt sql.NullTime `db:"updated_at"`
}