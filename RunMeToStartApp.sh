#!/bin/bash

SCRIPTPATH="$( cd -- "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"
cd $SCRIPTPATH
cd ..
cp -r Incrypto ~/.local/share/
cd ~/.local/share/Incrypto/
npm start
