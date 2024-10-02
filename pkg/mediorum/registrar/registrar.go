package registrar

import "github.com/AudiusProject/audius-protocol/pkg/mediorum/server"

type PeerProvider interface {
	Peers() ([]server.Peer, error)
	Signers() ([]server.Peer, error)
}
