package registrar

import (
	"fmt"
	"testing"
)

func TestTheGraph(t *testing.T) {
	t.Skip()

	{
		p := NewGraphProd()
		fmt.Println(p.Peers("all"))
	}

	{
		p := NewGraphStaging()
		fmt.Println(p.Peers("all"))
	}

}
