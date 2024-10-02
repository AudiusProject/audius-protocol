package registrar

import "github.com/AudiusProject/audius-protocol/mediorum/server"

type PeerProvider interface {
	Peers() ([]server.Peer, error)
	Signers() ([]server.Peer, error)
}
