package unixfs

import (
	cmds "gx/ipfs/QmatUACvrFK3xYg1nd2iLAKfz7Yy5YB56tnzBYHpqiUuhn/go-ipfs/commands"
	e "gx/ipfs/QmatUACvrFK3xYg1nd2iLAKfz7Yy5YB56tnzBYHpqiUuhn/go-ipfs/core/commands/e"

	"gx/ipfs/QmceUdzxkimdYsgtX733uNgzf1DLHyBKN6ehGSp85ayppM/go-ipfs-cmdkit"
)

var UnixFSCmd = &cmds.Command{
	Helptext: cmdkit.HelpText{
		Tagline: "Interact with IPFS objects representing Unix filesystems.",
		ShortDescription: `
'ipfs file' provides a familiar interface to file systems represented
by IPFS objects, which hides ipfs implementation details like layout
objects (e.g. fanout and chunking).
`,
		LongDescription: `
'ipfs file' provides a familiar interface to file systems represented
by IPFS objects, which hides ipfs implementation details like layout
objects (e.g. fanout and chunking).
`,
	},

	Subcommands: map[string]*cmds.Command{
		"ls": LsCmd,
	},
}

// copy+pasted from ../commands.go
func unwrapOutput(i interface{}) (interface{}, error) {
	var (
		ch <-chan interface{}
		ok bool
	)

	if ch, ok = i.(<-chan interface{}); !ok {
		return nil, e.TypeErr(ch, i)
	}

	return <-ch, nil
}