package config

type Config struct {
	WebServerPort    string
	DatabaseAddress  string
	DatabaseUsername string
	DatabasePassword string
	DatabaseName     string
	Debug            bool
}

// TODO: pull a config from a .env or some other file
func DefaultConfig() *Config {
	return &Config{
		WebServerPort:    ":8927",
		DatabaseAddress:  "127.0.0.1:9000",
		DatabaseUsername: "admin",
		DatabasePassword: "pass",
		DatabaseName:     "default",
		Debug:            true,
	}
}
