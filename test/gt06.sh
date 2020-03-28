#!/bin/bash

SERVER_HOST=$1
SERVER_PORT=55006

DAY=$(echo $(date +%d) | awk '{printf "%02x\n", $0}')
MONTH=$(echo $(date +%m) | awk '{printf "%02x\n", $0}')
YEAR=$(echo $(date +%y) | awk '{printf "%02x\n", $0}')

SECOND=$(echo $(date +%S) | awk '{printf "%02x\n", $0}')
MINUTE=$(echo $(date +%M) | awk '{printf "%02x\n", $0}')
HOUR=$(echo $(date +%H) | awk '{printf "%02x\n", $0}')

exec 3<>/dev/tcp/${SERVER_HOST}/${SERVER_PORT}

echo -n -e '\x78\x78\x0d\x01\x01\x23\x45\x67\x89\x01\x23\x45\x00\x01\x8c\xdd\x0d\x0a' >&3
sleep 1
echo -n -e "\x78\x78\x1f\x12\x${YEAR}\x${MONTH}\x${DAY}\x${HOUR}\x${MINUTE}\x${SECOND}\xca\x05\x43\xec\x4f\x00\xff\x97\x6e\x02\x15\x49\x01\x06\x03\xe6\xb5\x00\xe7\x59\x00\x74\x76\x3d\x0d\x0a" >&3
sleep 1
