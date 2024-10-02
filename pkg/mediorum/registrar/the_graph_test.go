package registrar

import (
	"fmt"
	"testing"
)

func TestTheGraph(t *testing.T) {
	t.Skip()

	{
		p := NewGraphProd()
		fmt.Println(p.Peers())
		fmt.Println(p.Signers())
	}

	{
		p := NewGraphStaging()
		fmt.Println(p.Peers())
		fmt.Println(p.Signers())
	}

}
