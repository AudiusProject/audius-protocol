package geoip

import (
	_ "embed"
	"errors"
	"net"

	"github.com/oschwald/maxminddb-golang"
)

type GeoLocation struct {
	Country struct {
		ISOCode string            `maxminddb:"iso_code"`
		Names   map[string]string `maxminddb:"names"`
	} `maxminddb:"country"`
	City struct {
		Names map[string]string `maxminddb:"names"`
	} `maxminddb:"city"`
	Location struct {
		Latitude  float64 `maxminddb:"latitude"`
		Longitude float64 `maxminddb:"longitude"`
	} `maxminddb:"location"`
	Subdivisions []struct {
		ISOCode string            `maxminddb:"iso_code"`
		Names   map[string]string `maxminddb:"names"`
	} `maxminddb:"subdivisions"`
}

type GeoResult struct {
	Country     string  `json:"country"`
	CountryCode string  `json:"country_code"`
	City        string  `json:"city"`
	Region      string  `json:"region"`
	RegionCode  string  `json:"region_code"`
	Latitude    float64 `json:"latitude"`
	Longitude   float64 `json:"longitude"`
}

//go:embed GeoLite2-City.mmdb
var geoLiteDB []byte

func GetGeoFromIP(ip string) (*GeoResult, error) {
	// Open the embedded MaxMind database
	db, err := maxminddb.FromBytes(geoLiteDB)
	if err != nil {
		return nil, errors.New("failed to open database: " + err.Error())
	}
	defer db.Close()

	// Parse the IP address
	parsedIP := net.ParseIP(ip)
	if parsedIP == nil {
		return nil, errors.New("invalid IP address: " + ip)
	}

	// Lookup the IP in the database
	record := GeoLocation{}
	err = db.Lookup(parsedIP, &record)
	if err != nil {
		return nil, errors.New("failed to lookup IP: " + err.Error())
	}

	// Extract subdivision (region/state) information
	regionName := ""
	regionCode := ""
	if len(record.Subdivisions) > 0 {
		regionName = record.Subdivisions[0].Names["en"]
		regionCode = record.Subdivisions[0].ISOCode
	}

	// Build the result
	result := &GeoResult{
		Country:     record.Country.Names["en"],
		CountryCode: record.Country.ISOCode,
		City:        record.City.Names["en"],
		Region:      regionName,
		RegionCode:  regionCode,
		Latitude:    record.Location.Latitude,
		Longitude:   record.Location.Longitude,
	}

	return result, nil
}
