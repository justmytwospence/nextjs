#!/bin/bash

curl https://sh.rustup.rs -sSf | sh -s -- -y
apt install -y libclang-dev
export PATH="$HOME/.cargo/bin:$PATH"
