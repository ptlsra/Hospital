#!/bin/bash
# Script for single system setup
#ipAddress=$(ip route get 8.8.8.8 | awk '{print $NF; exit}')

#sleep for 145 sec 
#echo "Waiting for broker API to come up..."
#sleep 170

#ipAddress=$(ip route get 8.8.8.8 | awk '{print $7; exit}')
#get config data from main node and update contractConfig.json
ipAddress=$SYSTEM_IP
node getContractConfig.js $ipAddress |& tee -a /api-logs/hospital-api.log

node updateConfig $ipAddress 5001 $ipAddress 27017 9000 $ipAddress 23002 |& tee -a /api-logs/hospital-api.log
echo "config.js updated"


if [ -f "/data/contractConfig.json" ]
then
    echo "contractConfig.json found."
        
    echo "copying contractConfig.json to : `${pwd}`"
    cp /data/contractConfig.json .

    #Start API
    echo "Starting API"
    node app.js |& tee -a /api-logs/hospital-api.log
else

echo "contractConfig.json not found."

echo "dropping old databases"
node deleteDatabase.js |& tee -a /api-logs/hospital-api.log

# start app.js
echo "starting app.js"
node app.js |& tee -a /api-logs/hospital-api.log
fi
