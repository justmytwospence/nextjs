#!/bin/bash

ldd /opt/build/repo/pathfinder/pathfinder.linux-x64-gnu.node | grep '=>' | awk '{print $4}' | while read -r lib; do
    cp "$lib" /opt/build/repo/dylibs/
done

