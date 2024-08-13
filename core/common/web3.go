package common

// for parity with the web3.js web3.utils.utf8ToHex() call
func Utf8ToHex(s string) [32]byte {
	hex := [32]byte{}
	copy(hex[:], s)
	return hex
}
