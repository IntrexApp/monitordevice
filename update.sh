#!/bin/bash
git reset --hard
git fetch origin master
git pull origin master
chmod +x ./install.sh
chmod +x ./update.sh
chmod +x ./index.js
chown -R monitordevice:monitordevice /home/monitordevice/bin
chmod -R +777 /home/monitordevice
npm install
systemctl restart monitordevice.service