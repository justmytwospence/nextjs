#!/bin/bash

curl https://sh.rustup.rs -sSf | sh -s -- -y
export PATH="$HOME/.cargo/bin:$PATH"
apt-get update && apt-get install -y libclang-dev