package main

import (
	"fmt"
	"io"
	"os"
	"os/exec"

	"github.com/AudiusProject/audius-protocol/pkg/conf"
	"github.com/AudiusProject/audius-protocol/pkg/logger"
	"github.com/spf13/cobra"
)

var (
	configCmd = &cobra.Command{
		Use:   "config [command]",
		Short: "view/modify audius-d configuration",
		Args:  cobra.ExactArgs(0),
		RunE: func(cmd *cobra.Command, args []string) error {
			dumpCmd.RunE(cmd, args)
			return nil
		},
	}

	dumpOutfile string
	dumpCmd     = &cobra.Command{
		Use:   "dump [-o outfile]",
		Short: "dump current config to stdout or a file",
		RunE: func(cmd *cobra.Command, args []string) error {
			ctx_config, err := conf.ReadOrCreateContextConfig()
			if err != nil {
				return logger.Error("Failed to retrieve context. ", err)
			}
			if dumpOutfile != "" {
				err := conf.WriteConfigToFile(dumpOutfile, ctx_config)
				if err != nil {
					return logger.Error("Failed to write config to file:", err)
				}
			} else {
				str, err := conf.StringifyConfig(ctx_config)
				if err != nil {
					return logger.Error("Failed to dump config:", err)
				}
				fmt.Println(str)
			}
			return nil
		},
	}

	editCmd = &cobra.Command{
		Use:               "edit [context]",
		Short:             "edit the current or specified configuration in an external editor",
		Args:              cobra.MaximumNArgs(1),
		ValidArgsFunction: contextCompletionFunction,
		RunE: func(cmd *cobra.Command, args []string) error {
			var ctxName string
			if len(args) > 0 {
				ctxName = args[0]
				ctxs, err := conf.GetContexts()
				if err != nil {
					return logger.Error("Error getting available contexts:", err)
				}
				contains := false
				for _, ctx := range ctxs {
					if ctx == ctxName {
						contains = true
						break
					}
				}
				if !contains {
					return logger.Errorf("No context named '%s'. Use 'audius-ctl config create-context %s'", ctxName, ctxName)
				}
			} else {
				var err error
				ctxName, err = conf.GetCurrentContextName()
				if err != nil {
					return logger.Error(err)
				}
			}

			if err := EditConfig(ctxName); err != nil {
				return logger.Error(err)
			}
			return nil
		},
	}

	confFileTemplate string
	createContextCmd = &cobra.Command{
		Use:   "create-context <name>",
		Short: "create an audius-d configuration context, optionally from a template",
		Long: `
		Create an audius-d configuration context.
		Without any flags, creates a bare-bones context with the given name.
		Use '-f [filename]' to specify a template to copy.
		Use '-f -' to read from stdin. Useful for scripts or pipes.
		`,
		Args: cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			if confFileTemplate == "-" {
				input, err := io.ReadAll(os.Stdin)
				if err != nil {
					return logger.Error("Error reading from stdin:", err)
				}
				ctx := conf.NewContextConfig()
				if err := conf.ReadConfigFromBytes(input, ctx); err != nil {
					return logger.Error("Could not parse config:", err)
				}
				if err := conf.WriteConfigToContext(args[0], ctx); err != nil {
					return logger.Error("Failed to save config:", err)
				}
			} else {
				err := conf.CreateContextFromTemplate(args[0], confFileTemplate)
				if err != nil {
					return logger.Error("Failed to create context:", err)
				}
			}
			useContextCmd.RunE(cmd, args)
			return nil
		},
	}
	currentContextCmd = &cobra.Command{
		Use:   "current-context",
		Short: "Show the currently enabled context",
		RunE: func(cmd *cobra.Command, args []string) error {
			ctx, err := conf.GetCurrentContextName()
			if err != nil {
				return logger.Error("Failed to retrieve current context:", err)
			}
			fmt.Println(ctx)
			return nil
		},
	}
	getContextsCmd = &cobra.Command{
		Use:   "get-contexts",
		Short: "Show all available contexts",
		RunE: func(cmd *cobra.Command, args []string) error {
			ctxs, err := conf.GetContexts()
			if err != nil {
				return logger.Error("Failed to retrieve current context:", err)
			}
			for _, ctx := range ctxs {
				fmt.Println(ctx)
			}
			return nil
		},
	}
	useContextCmd = &cobra.Command{
		Use:               "use-context <context>",
		Short:             "Switch to a different context",
		Args:              cobra.ExactArgs(1),
		ValidArgsFunction: contextCompletionFunction,
		RunE: func(cmd *cobra.Command, args []string) error {
			err := conf.UseContext(args[0])
			if err != nil {
				return logger.Error("Failed to set context:", err)

			}
			fmt.Fprintf(os.Stderr, "Context set to %s\n", args[0])
			return nil
		},
	}
	deleteContextCmd = &cobra.Command{
		Use:               "delete-context <context>",
		Short:             "Delete a context",
		Args:              cobra.ExactArgs(1),
		ValidArgsFunction: contextCompletionFunction,
		RunE: func(cmd *cobra.Command, args []string) error {
			if err := conf.DeleteContext(args[0]); err != nil {
				return logger.Error("Failed to delete context:", err)
			}
			fmt.Fprintf(os.Stderr, "Context %s deleted.\n", args[0])
			return nil
		},
	}
)

func init() {
	createContextCmd.Flags().StringVarP(&confFileTemplate, "templatefile", "f", "", "'-f <filename>' to copy context from a template file or use '-f -' to read from stdin")
	dumpCmd.Flags().StringVarP(&dumpOutfile, "outfile", "o", "", "-o <outfile")
	configCmd.AddCommand(dumpCmd, createContextCmd, currentContextCmd, getContextsCmd, useContextCmd, deleteContextCmd, editCmd)
}

func EditConfig(contextName string) error {
	tempFile, err := os.CreateTemp("", contextName)
	if err != nil {
		return err
	}
	tempFile.Close()
	defer os.Remove(tempFile.Name())

	existingConfig, err := conf.GetContextConfig(contextName)
	if err != nil {
		return err
	}

	if err = conf.WriteConfigToFile(tempFile.Name(), existingConfig); err != nil {
		return err
	}

	editor := os.Getenv("EDITOR")
	if editor == "" {
		fmt.Fprintf(os.Stderr, "Please set $EDITOR in your shell profile to your preferred text editor.\n")
		fmt.Fprintf(os.Stderr, "Defaulting to nano\n")
		editor = "nano"
	}

	cmd := exec.Command(editor, tempFile.Name())
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err = cmd.Run(); err != nil {
		return err
	}

	var newConfig conf.ContextConfig
	if err = conf.ReadConfigFromFile(tempFile.Name(), &newConfig); err != nil {
		return err
	}

	if err = conf.WriteConfigToContext(contextName, &newConfig); err != nil {
		return err
	}

	return nil
}
