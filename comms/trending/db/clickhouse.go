package db

type ClickHouseDB struct{}

func NewClickHouseDB() *ClickHouseDB {
	return &ClickHouseDB{}
}

func (ch ClickHouseDB) CheckHealth() bool {
	return true
}

func (ch ClickHouseDB) QueryTrendingTracks() (string, error) {
	return "i checked and found nothing!", nil
}

func (ch ClickHouseDB) QueryTrendingPlaylists() (string, error) {
	return "i checked and also found nothing!", nil
}
