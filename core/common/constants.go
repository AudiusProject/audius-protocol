package common

// contract addresses
var (
	MainnetRegistryAddress = "0xd976d3b4f4e22a238c1A736b6612D22f17b6f64C"
	TestnetRegistryAddress = "0xF27A9c44d7d5DDdA29bC1eeaD94718EeAC1775e3"

	MainnetAcdcAddress = "0x1Cd8a543596D499B9b6E7a6eC15ECd2B7857Fd64"
	TestnetAcdcAddress = "0x1Cd8a543596D499B9b6E7a6eC15ECd2B7857Fd64"
)

// contract keys
var (
	RegistryKey               = Utf8ToHex("Registry")
	GovernanceKey             = Utf8ToHex("Governance")
	StakingKey                = Utf8ToHex("StakingProxy")
	ServiceProviderFactoryKey = Utf8ToHex("ServiceProviderFactory")
	ClaimsManagerKey          = Utf8ToHex("ClaimsManagerProxy")
	DelegateManagerKey        = Utf8ToHex("DelegateManager")
	AudiusTokenKey            = Utf8ToHex("Token")
	RewardsManagerKey         = Utf8ToHex("EthRewardsManagerProxy")
)
