package server

import (
	"fmt"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestRendezvous256(t *testing.T) {
	var nodeList = "https://creatornode.audius.prod-eks-ap-northeast-1.staked.cloud,https://creatornode.audius1.prod-eks-ap-northeast-1.staked.cloud,https://creatornode.audius2.prod-eks-ap-northeast-1.staked.cloud,https://creatornode.audius3.prod-eks-ap-northeast-1.staked.cloud,https://creatornode.audius8.prod-eks-ap-northeast-1.staked.cloud,https://creatornode.audius.co,https://creatornode2.audius.co,https://creatornode3.audius.co,https://usermetadata.audius.co,https://audius-content-1.cultur3stake.com,https://audius-content-10.cultur3stake.com,https://audius-content-11.cultur3stake.com,https://audius-content-12.cultur3stake.com,https://audius-content-13.cultur3stake.com,https://audius-content-14.cultur3stake.com,https://audius-content-15.cultur3stake.com,https://audius-content-16.cultur3stake.com,https://audius-content-17.cultur3stake.com,https://audius-content-18.cultur3stake.com,https://audius-content-2.cultur3stake.com,https://audius-content-3.cultur3stake.com,https://audius-content-4.cultur3stake.com,https://audius-content-5.cultur3stake.com,https://audius-content-6.cultur3stake.com,https://audius-content-7.cultur3stake.com,https://audius-content-8.cultur3stake.com,https://audius-content-9.cultur3stake.com,https://cn1.stuffisup.com,https://audius-cn1.tikilabs.com,https://audius.prod.capturealpha.io,https://audius-content-1.figment.io,https://audius-content-10.figment.io,https://audius-content-11.figment.io,https://audius-content-12.figment.io,https://audius-content-13.figment.io,https://audius-content-14.figment.io,https://audius-content-2.figment.io,https://audius-content-3.figment.io,https://audius-content-4.figment.io,https://audius-content-5.figment.io,https://audius-content-6.figment.io,https://audius-content-7.figment.io,https://audius-content-8.figment.io,https://audius-content-9.figment.io,https://blockchange-audius-content-01.bdnodes.net,https://blockchange-audius-content-02.bdnodes.net,https://blockchange-audius-content-03.bdnodes.net,https://blockdaemon-audius-content-01.bdnodes.net,https://blockdaemon-audius-content-02.bdnodes.net,https://blockdaemon-audius-content-03.bdnodes.net,https://blockdaemon-audius-content-04.bdnodes.net,https://blockdaemon-audius-content-05.bdnodes.net,https://blockdaemon-audius-content-06.bdnodes.net,https://blockdaemon-audius-content-07.bdnodes.net,https://blockdaemon-audius-content-08.bdnodes.net,https://blockdaemon-audius-content-09.bdnodes.net,https://content.grassfed.network,https://cn0.mainnet.audiusindex.org,https://cn1.mainnet.audiusindex.org,https://cn2.mainnet.audiusindex.org,https://cn3.mainnet.audiusindex.org,https://cn4.mainnet.audiusindex.org,https://audius-content-1.jollyworld.xyz,https://audius-creator-1.theblueprint.xyz,https://audius-creator-2.theblueprint.xyz,https://audius-creator-3.theblueprint.xyz,https://audius-creator-4.theblueprint.xyz,https://audius-creator-5.theblueprint.xyz,https://audius-creator-6.theblueprint.xyz"
	nodes := strings.Split(nodeList, ",")

	testCid := "baeaaaiqsedziwknj44jsl5fak6vcbszzjlnl7pqtw2ipnyg7rsh5a2xnql2p2"

	rh := NewRendezvousHasher(nodes)

	// sha256 ordering
	{
		ordered := rh.Rank(testCid)
		expected := []string{
			"https://blockdaemon-audius-content-09.bdnodes.net",
			"https://cn4.mainnet.audiusindex.org",
			"https://audius-content-4.figment.io",
			"https://cn0.mainnet.audiusindex.org",
			"https://creatornode.audius3.prod-eks-ap-northeast-1.staked.cloud",
			"https://blockdaemon-audius-content-07.bdnodes.net",
		}
		for idx, exp := range expected {
			assert.Equal(t, exp, ordered[idx], fmt.Sprintf("expected rank %d to be %s got %s", idx, exp, ordered[idx]))
		}
	}
}
