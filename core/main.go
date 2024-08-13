package main

import (
	"context"
	"net"
	"os"
	"os/signal"
	"syscall"

	"github.com/AudiusProject/audius-protocol/core/chain"
	"github.com/AudiusProject/audius-protocol/core/common"
	"github.com/AudiusProject/audius-protocol/core/config"
	"github.com/AudiusProject/audius-protocol/core/db"
	"github.com/AudiusProject/audius-protocol/core/grpc"
	"github.com/cometbft/cometbft/rpc/client/local"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/sync/errgroup"
)

func main() {
	logger := common.NewLogger(nil)

	logger.Info("good morning!")

	// core config
	config, err := config.ReadConfig(logger)
	if err != nil {
		logger.Errorf("reading in config: %v", err)
		return
	}

	// db migrations
	if err := db.RunMigrations(logger, config.PSQLConn, config.RunDownMigration); err != nil {
		logger.Errorf("running migrations: %v", err)
		return
	}

	pool, err := pgxpool.New(context.Background(), config.PSQLConn)
	if err != nil {
		logger.Errorf("couldn't create pgx pool: %v", err)
		return
	}
	defer pool.Close()

	node, err := chain.NewNode(logger, config, pool)
	if err != nil {
		logger.Errorf("node init error: %v", err)
		return
	}

	rpc := local.New(node)

	server, err := grpc.NewGRPCServer(logger, config, rpc, pool)
	if err != nil {
		logger.Errorf("grpc init error: %v", err)
		return
	}

	eg, ctx := errgroup.WithContext(context.Background())

	eg.Go(func() error {
		nodeStarted := make(chan struct{})
		go func() {
			node.Start()
			close(nodeStarted)
		}()

		select {
		case <-nodeStarted:
			defer func() {
				node.Stop()
				node.Wait()
			}()
		case <-ctx.Done():
			return ctx.Err()
		}

		// Listen for OS signals to gracefully shut down the node
		c := make(chan os.Signal, 1)
		signal.Notify(c, os.Interrupt, syscall.SIGTERM)
		select {
		case <-c:
			return nil
		case <-ctx.Done():
			return ctx.Err()
		}
	})

	eg.Go(func() error {
		lis, err := net.Listen("tcp", "0.0.0.0:50051")
		if err != nil {
			return err
		}
		defer lis.Close()

		go func() {
			<-ctx.Done()
			lis.Close()
		}()

		return server.Serve(lis)
	})

	if err := eg.Wait(); err != nil {
		logger.Errorf("error in errgroup: %v", err)
		return
	}
}
