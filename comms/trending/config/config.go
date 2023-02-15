package config

type Config struct {
	TrendingEchoPort string
	Debug            bool
	HideBanner       bool
}

// TODO: read from a .env file
// https://linear.app/audius/issue/PLAT-682/[trending-server]-read-config-from-env-file
func Default() (*Config, error) {
	return &Config{
		TrendingEchoPort: "9876",
		Debug:            true,
		HideBanner:       false,
	}, nil
}

func TestDefault() (*Config, error) {
	return &Config{
		TrendingEchoPort: "9876",
		Debug:            true,
		HideBanner:       true,
	}, nil
}

// Echo requires the ':' so thought i'd put a helper here
func (conf *Config) FormatEchoPort() string {
	return ":" + conf.TrendingEchoPort
}
