#!/bin/bash

SERVER_HOST=$1
SERVER_PORT=55103

DAY=$(echo $(date +%d))
MONTH=$(echo $(date +%m))
YEAR=$(echo $(date +%y))

SECOND=$(echo $(date +%S))
MINUTE=$(echo $(date +%M))
HOUR=$(echo $(date +%H))

exec 3<>/dev/tcp/${SERVER_HOST}/${SERVER_PORT}

echo -n -e '##,imei:123456789012346,A;' >&3
sleep 1
echo -n -e "imei:123456789012346,ac alarm,${YEAR}${MONTH}${DAY}${HOUR}${MINUTE}${SECOND},,F,135623.000,A,4824.5933,N,00911.2830,E,0.00,0;" >&3
sleep 1
