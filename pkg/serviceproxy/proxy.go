package serviceproxy

type LocationData struct {
	City    string `json:"city"`
	Region  string `json:"region"`
	Country string `json:"country_name"`
}

type ServiceProxy interface {
	GetIPData(string) (*LocationData, error)
}
