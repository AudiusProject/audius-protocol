package conf

type ExecutionConfig struct {
	ConfigVersion  string
	CurrentContext string
}

type ContextConfig struct {
	Network NetworkConfig         `yaml:"network"`
	Nodes   map[string]NodeConfig `yaml:"nodes"`
}

func NewContextConfig() *ContextConfig {
	return &ContextConfig{
		Network: NetworkConfig{
			DeployOn: Mainnet,
		},
		Nodes: make(map[string]NodeConfig),
	}
}

// base structure that all server types need
type NodeConfig struct {
	// *** Required fields ***

	Type NodeType `yaml:"type"`
	// The delegate owner key can either be directly specified or an
	// absolute path to a file on the HOST machine (not your local machine) containing the key
	PrivateKey    string `yaml:"privateKey"`
	Wallet        string `yaml:"wallet"`
	RewardsWallet string `yaml:"rewardsWallet"`

	// *** Optional fields ***

	// Whether this node is launched on the local machine.
	IsLocalhost bool `yaml:"isLocalhost"`

	// The version of the audius protocol to run (defaults to "current" behavior if omitted)
	// "current"  - Run the latest tested release
	// "edge"     - Run the latest release
	// "prelease" - Run the most recent unreleased build
	// "x.x.x"    - Run the specified version, e.g. "0.6.87"
	// <other>    - (For development) run using the specified audius-docker-compose branch
	Version string `yaml:"version,omitempty"`

	// Specify non-standard ports for http traffic
	HttpPort  uint `yaml:"httpPort,omitempty"`
	HttpsPort uint `yaml:"httpsPort,omitempty"`

	// Specify non-standard ports for core traffic
	CorePortP2P uint `yaml:"corePortP2P,omitempty"`
	CorePortRPC uint `yaml:"corePortRPC,omitempty"`

	// A string of additional port bindings to allow exposing docker-in-docker containers to the host
	// e.g. "5433:5432,9201:9200" would expose the postgres and elastic search dind containers
	//      on the host ports 5433 and 9201 respectively
	HostPorts string `yaml:"hostPorts,omitempty"`

	// Configure remote blob storage (S3, GCS, Azure)
	Storage StorageConfig `yaml:"storage,omitempty"`

	// Postgres db url for remote db and/or custom password
	DbUrl string `yaml:"dbUrl,omitempty"`

	// Stores any as-yet unstructured configuration
	// (for compatibility with audius-docker-compose migrations)
	OverrideConfig map[string]string `yaml:"overrideConfig,omitempty"`

	// (EXPERIMENTAL) Path on host machine to env file containing additional private configuration
	RemoteConfigFile string `yaml:"remoteConfigFile,omitempty"`

	PluginsConfig map[PluginName]map[string]string `yaml:"plugins,omitempty"`
}

type StorageConfig struct {
	/* Format:
	s3://<your_bucket_name>      (AWS)
	gs://<your_bucket_name>      (GCS)
	azblob://<your_bucket_name>  (AZURE)
	*/
	StorageUrl string `yaml:"storageUrl,omitempty"`

	// S3
	AwsAccessKeyId     string `yaml:"awsAccessKeyId,omitempty"`
	AwsSecretAccessKey string `yaml:"awsSecretAccessKey,omitempty"`
	AwsRegion          string `yaml:"awsRegion,omitempty"`

	// Azure
	AzureStorageAccount string `yaml:"azureStorageAccount,omitempty"`
	AzureStorageKey     string `yaml:"azureStorageKey,omitempty"`

	// GCS
	// The name of the json file containing your google application credentials,
	// e.g. 'google-application-credentials.json' (exclude the path)
	// Put this file in /var/k8s/mediorum/ on the host machine
	GoogleApplicationCredentials string `yaml:"googleApplicationCredentials,omitempty"`
}

func NewNodeConfig(nodeType NodeType) NodeConfig {
	return NodeConfig{
		Type:        nodeType,
		HttpPort:    80,
		HttpsPort:   443,
		CorePortP2P: 26656,
		CorePortRPC: 26657,
		Version:     "current",
	}
}

type NetworkType string

const (
	Devnet  NetworkType = "devnet"
	Testnet NetworkType = "testnet"
	Mainnet NetworkType = "mainnet"
)

type NodeType string

const (
	Content   NodeType = "content"
	Discovery NodeType = "discovery"
	Identity  NodeType = "identity"
)

type NetworkConfig struct {
	// Network that the node should be configured to deploy on.
	// Choose "devnet", "testnet", or "mainnet"
	// "devnet" will automatically spin up local chains and identity service
	DeployOn NetworkType `yaml:"deployOn"`

	// Optional Infrastructure API credentials
	Infra *Infra `yaml:"infra,omitempty"`
}

type Infra struct {
	CloudflareAPIKey string `yaml:"cloudflareAPIKey,omitempty"`
	CloudflareZoneId string `yaml:"cloudflareZoneId,omitempty"`
	CloudflareTLD    string `yaml:"cloudflareTld,omitempty"`

	AWSAccessKeyID     string `yaml:"awsAccessKeyID,omitempty"`
	AWSSecretAccessKey string `yaml:"awsSecretAccessKey,omitempty"`
	AWSRegion          string `yaml:"awsRegion,omitempty"`
}

// name of the plugin that should match with it's docker profile
// this will be used with the REGISTER_PLUGINS env var
type PluginName = string
