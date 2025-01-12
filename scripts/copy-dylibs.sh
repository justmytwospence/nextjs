#!/bin/bash

mkdir dylibs
ldd pathfinder/pathfinder.linux-x64-gnu.node | tee >(cat) | grep '=>' | awk '{print $3}' | while read -r lib; do
  cp "$lib" /opt/build/repo/dylibs/
done
