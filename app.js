require('dotenv').config();
const Gt06 = require('gt06');
const Gps103 = require('gps103');
const Mqtt = require('mqtt');
const net = require('net');
const fs = require('fs');

const gt06ServerPort = process.env.GT06_SERVER_PORT || 64459;
const gps103ServerPort = process.env.GPS103_SERVER_PORT || 64460;
const rootTopic = process.env.MQTT_ROOT_TOPIC || 'tracker';
const brokerUrl = process.env.MQTT_BROKER_URL || 'localhost';
const brokerPort = process.env.MQTT_BROKER_PORT || 8883;
const mqttProtocol = process.env.MQTT_BROKER_PROTO || 'mqtt';
const brokerUser = process.env.MQTT_BROKER_USER || 'user';
const brokerPasswd = process.env.MQTT_BROKER_PASSWD || 'passwd';
const trustedCaPath = process.env.MQTT_BROKER_CA || '';
const TRUSTED_CA = fs.readFileSync(trustedCaPath);

var mqttClient = Mqtt.connect(
    {
        host: brokerUrl,
        port: brokerPort,
        protocol: mqttProtocol,
        ca: TRUSTED_CA,
        username: brokerUser,
        password: brokerPasswd
    }
);

mqttClient.on('error', (err) => {
    console.error('MQTT Error:', err);
});

var gt06Server = net.createServer((client) => {
    var gt06 = new Gt06();
    console.log('client connected');

    gt06Server.on('error', (err) => {
        console.error('gt06Server error', err);
    });

    client.on('error', (err) => {
        console.error('client error', err);
    });

    client.on('close', () => {
        console.log('client disconnected');
    });

    client.on('data', (data) => {
        try {
            gt06.parse(data);
        }
        catch (e) {
            console.log('err', e);
            return;
        }
        console.log(gt06);
        if (gt06.expectsResponse) {
            client.write(gt06.responseMsg);
        }
        gt06.msgBuffer.forEach(msg => {
            let fixDatetime = new Date(msg.fixTime);
            if(fixDatetime < msg.parseTime - 3600000) {
                console.log("Invalid Position!");
            } else {
                mqttClient.publish(rootTopic + '/' + gt06.imei +
                    '/pos', JSON.stringify(msg));
            }
        });
        gt06.clearMsgBuffer();
    });
});

var gps103Server = net.createServer((client) => {
    var gps103 = new Gps103();
    console.log('client connected');

    gps103Server.on('error', (err) => {
        console.error('gps103Server error', err);
    });

    client.on('error', (err) => {
        console.error('client error', err);
    });

    client.on('close', () => {
        console.log('client disconnected');
    });

    client.on('data', (data) => {
        try {
            gps103.parse(data);
        }
        catch (e) {
            console.log('err', e);
            return;
        }
        console.log(gps103);
        if (gps103.expectsResponse) {
            client.write(gps103.responseMsg);
        }
        gps103.msgBuffer.forEach(msg => {
            // only publish msg if GPS103 has a GPS fix
            if (msg.hasFix) {
                mqttClient.publish(rootTopic + '/' + gps103.imei +
                    '/pos', JSON.stringify(msg));
            }
        });
        gps103.clearMsgBuffer();
    });
});

gt06Server.listen(gt06ServerPort, () => {
    console.log('started GT06 server on port:', gt06ServerPort);
});

gps103Server.listen(gps103ServerPort, () => {
    console.log('started GPS103 server on port:', gps103ServerPort);
});
