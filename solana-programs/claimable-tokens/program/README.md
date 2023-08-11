# Claimable-tokens programs

You may experience issues on Rust >=1.6x:

```
rustup install 1.59
rustup default 1.59
```

### Build and test for program compiled natively

```
$ cargo build
$ cargo test
```

### Build and test the program compiled for BPF

```
$ cargo build-bpf
$ cargo test-bpf
```

If the tests hang, install solana 1.10.x (e.g. 1.10.4) by doing:
```
solana-install init 1.10.4
```

Retry building and testing. It should work now.
