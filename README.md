# GT06/GPS103 MQTT Gateway
This is a GT06 and GPS103 GPS Tracker server implementation  written in javascript.
It parses all messages received from the device and creates the response message, if needed.
Eventually it will send the received information to an MQTT broker.

So it acts as a server for GT06 and GPS103 trackers and a gateway to MQTT.

## Database
All position messages from the GPS trackers are send to a MYSQL DB and a MongoDB.
I'm planning to remove MYSQL at some point in time.

## Configuration
Run a `npm install` after you cloned it and start it via `node app.js`.

You can create a `.env` file to configure the behavior off the app.

The following environment variables are recognized. If not defined a default will be used.
- GT06_SERVER_PORT = 64459
- GPS103_SERVER_PORT = 64460;
- MQTT_ROOT_TOPIC = tracker
- MQTT_BROKER_URL = localhost
- MQTT_BROKER_PORT = 8883
- MQTT_BROKER_PROTO = mqtt
- MQTT_BROKER_CA = /etc/pki/ca-trust/extracted/pem/tls-ca-bundle.pem
- MQTT_BROKER_USER = user
- MQTT_BROKER_PASSWD = passwd
- MYSQL_HOST
- MYSQL_USER
- MYSQL_PASSWD
- MYSQL_DB
- MONGO_DB_USER
- MONGO_DB_PASSWD
- MONGO_DB_URL

## MQTT
Messages received on the TCP port will be transmitted via MQTT *MQTT_ROOT_TOPIC/IMEI/pos*

For example: *tracker/123456789012345/pos*
