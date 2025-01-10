#!/bin/bash

curl https://sh.rustup.rs -sSf | sh -s -- -y
. "$HOME/.cargo/env" 
echo `which cargo`
