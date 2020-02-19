#!/bin/bash

git reset --hard
git fetch origin master
git pull origin master
chown -R monitordevice:monitordevice ./
chmod +x ./install.sh
chmod +x ./update.sh
chmod +x ./index.js