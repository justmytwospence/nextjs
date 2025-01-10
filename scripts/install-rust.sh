#!/bin/bash

curl https://sh.rustup.rs -sSf | sh -s -- -y
export PATH="$HOME/.cargo/bin:$PATH"
mkdir -p /tmp/apt/lists/partial
APT_CONFIG=/tmp/apt/apt.conf apt-get update
apt-get install -y libclang-dev