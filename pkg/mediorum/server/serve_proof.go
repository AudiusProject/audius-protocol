package server

import (
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"io"
	"strings"
	"time"

	"github.com/AudiusProject/audius-protocol/pkg/mediorum/server/signature"

	"github.com/AudiusProject/audius-protocol/pkg/mediorum/cidutil"

	"github.com/labstack/echo/v4"
	"gocloud.dev/gcerrors"
	"golang.org/x/exp/slices"
)

// Returns a hash of file content + wallet + provided nonce
func (ss *MediorumServer) serveProofOfBlobStorage(c echo.Context) error {
	ctx := c.Request().Context()
	cid := c.Param("cid")
	nonce := c.Param("nonce")

	key := cidutil.ShardCID(cid)

	blob, err := ss.bucket.NewReader(ctx, key, nil)
	if err != nil {
		if gcerrors.Code(err) == gcerrors.NotFound {
			return c.String(404, "blob not found")
		}
		return err
	}
	defer func() {
		if blob != nil {
			blob.Close()
		}
	}()

	blobData, err := io.ReadAll(blob)
	if err != nil {
		ss.logger.Error("unable to read blob for proof of storage", "cid", cid, "error", err)
		return err
	}
	nonceBytes, err := hex.DecodeString(nonce)
	if err != nil {
		ss.logger.Error("unable to decode nonce for proof of storage", "nonce", nonce, "error", err)
		return err
	}

	walletBytes, err := hex.DecodeString(ss.Config.Self.Wallet)
	if err != nil {
		ss.logger.Error("unable to decode wallet for proof of storage", "wallet", ss.Config.Self.Wallet)
		return err
	}

	augmentedDataBytes := make([]byte, 0, len(blobData)+len(nonceBytes)+len(walletBytes))
	augmentedDataBytes = append(blobData, nonceBytes...)
	augmentedDataBytes = append(augmentedDataBytes, walletBytes...)
	proofHash := md5.Sum(augmentedDataBytes)

	result := map[string]string{
		"nonce":  nonce,
		"wallet": ss.Config.Self.Wallet,
		"proof":  hex.EncodeToString(proofHash[:]),
	}

	go ss.recordMetric(ServeProof)
	return c.JSON(200, result)
}

// checks Proof of Storage request signature from any registered node
func (s *MediorumServer) requireRegisteredPoSSignature(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		cid := c.Param("cid")
		nonce := c.Param("nonce")
		sig, err := signature.ParsePoSSignatureFromQueryString(c.QueryParam("signature"))
		if err != nil {
			return c.JSON(401, map[string]string{
				"error":  "invalid signature",
				"detail": err.Error(),
			})
		} else {
			// check it was signed by a registered node
			allNodes := make([]Peer, 0, len(s.Config.Peers)+len(s.Config.Signers))
			allNodes = append(allNodes, s.Config.Peers...)
			allNodes = append(allNodes, s.Config.Signers...)
			isRegistered := slices.ContainsFunc(allNodes, func(peer Peer) bool {
				return strings.EqualFold(peer.Wallet, sig.SignerWallet)
			})
			if !isRegistered {
				s.logger.Debug("sig no match", "signed by", sig.SignerWallet)
				return c.JSON(401, map[string]string{
					"error":  "signer not in list of registered nodes",
					"detail": "signed by: " + sig.SignerWallet,
				})
			}

			// check signature not too old
			age := time.Since(time.Unix(sig.Data.Timestamp/1000, 0))
			if age > (time.Second * 5) {
				return c.JSON(401, map[string]string{
					"error":  "signature too old",
					"detail": age.String(),
				})
			}

			// check it is for this cid
			if sig.Data.Cid != cid {
				return c.JSON(401, map[string]string{
					"error":  "signature contains incorrect CID",
					"detail": fmt.Sprintf("url: %s, signature %s", cid, sig.Data.Cid),
				})
			}

			// check nonce
			if sig.Data.Nonce != nonce {
				return c.JSON(401, map[string]string{
					"error":  "signature contains incorrect nonce",
					"detail": fmt.Sprintf("url: %s, signature %s", nonce, sig.Data.Nonce),
				})
			}

			// OK
			c.Response().Header().Set("x-signature-debug", sig.String())
		}

		return next(c)
	}
}
