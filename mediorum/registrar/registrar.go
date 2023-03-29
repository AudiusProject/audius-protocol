package registrar

import "mediorum/server"

type PeerProvider interface {
	Peers() ([]server.Peer, error)
	Signers() ([]server.Peer, error)
}
