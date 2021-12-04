#!/bin/bash

SCRIPTPATH="$( cd -- "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"
cd $SCRIPTPATH
cd ..
mkdir ~/.incryptoApp
cp -r Incrypto ~/.incryptoApp/
cd ~/.incryptoApp/Incrypto/
npm i
npm start
