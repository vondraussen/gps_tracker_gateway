require('dotenv').config();
const Gt06 = require('gt06');
const Gps103 = require('gps103');
const Mqtt = require('mqtt');
const net = require('net');
const fs = require('fs');
const mysql = require('mysql2');
const mongoose = require('mongoose');
const Position = require('./model/Position');

// gps tracker vars
const gt06ServerPort = process.env.GT06_SERVER_PORT || 64459;
const gps103ServerPort = process.env.GPS103_SERVER_PORT || 64460;

// mqtt vars
const rootTopic = process.env.MQTT_ROOT_TOPIC || 'tracker';
const brokerUrl = process.env.MQTT_BROKER_URL || 'localhost';
const brokerPort = process.env.MQTT_BROKER_PORT || 8883;
const mqttProtocol = process.env.MQTT_BROKER_PROTO || 'mqtt';
const brokerUser = process.env.MQTT_BROKER_USER || 'user';
const brokerPasswd = process.env.MQTT_BROKER_PASSWD || 'passwd';
const trustedCaPath = process.env.MQTT_BROKER_CA || '';
const TRUSTED_CA = fs.readFileSync(trustedCaPath);

// mysql vars
const mysqlHost = process.env.MYSQL_HOST || 'localhost';
const mysqlUser = process.env.MYSQL_USER || 'user';
const mysqlPasswd = process.env.MYSQL_PASSWD || 'passwd';
const mysqlDb = process.env.MYSQL_DB || 'database';

// mongodb vars
const mongoUser = process.env.MONGO_DB_USER || 'user';
const mongoPw = process.env.MONGO_DB_PASSWD || 'password';
const mongoUrl = process.env.MONGO_DB_URL || 'url';

// connect to MYSQL DB
var db = mysql.createConnection({
    host: mysqlHost,
    user: mysqlUser,
    password: mysqlPasswd,
    database: mysqlDb
});

// connect to mongodb
mongoose.connect(
    `mongodb+srv://${mongoUser}:${mongoPw}@${mongoUrl}`,
    { useNewUrlParser: true, useUnifiedTopology: true },
    (err) => {
        if (err) {
           console.log('connection error to mongodb');
            exit(1);
        }
        console.log('connected to mongodb');
    }
);

var mqttClient = Mqtt.connect({
    host: brokerUrl,
    port: brokerPort,
    protocol: mqttProtocol,
    ca: TRUSTED_CA,
    username: brokerUser,
    password: brokerPasswd
});

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
        // console.log(gt06);
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

                if(msg.event.string === 'location') {
                    write2mysql(msg);
                    write2mongo(msg);
                }
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
        // console.log(gps103);
        if (gps103.expectsResponse) {
            client.write(gps103.responseMsg);
        }
        gps103.msgBuffer.forEach(msg => {
            // only publish msg if GPS103 has a GPS fix
            if (msg.hasFix) {
                mqttClient.publish(rootTopic + '/' + gps103.imei +
                '/pos', JSON.stringify(msg));
            }
            if (msg.hasFix && msg.event.string === 'location') {
                write2mysql(msg);
                write2mongo(msg);
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

function write2mysql(posMsg) {
    let sql = `INSERT INTO positions(\
        deviceId, position, latitude, longitude, fixTime, speed, heading)\
        VALUES(\
            ${posMsg.imei},"${posMsg.lat},${posMsg.lon}",${posMsg.lat},\
            ${posMsg.lon},${posMsg.fixTimestamp},${posMsg.speed},\
            ${posMsg.course}\
        )`
    // console.log(sql)
    db.query(
        sql,
        function(err, results, fields) {
            if(err) console.error(err);
    });
}

async function write2mongo(posMsg) {
    // create the message object to store
    const pos = new Position({
        deviceId: posMsg.imei,
        fixTime: new Date(posMsg.fixTimestamp * 1000),
        position: {type: "Point", coordinates: [posMsg.lon, posMsg.lat]},
        speed: posMsg.speed,
        course: posMsg.course
    });

    try {
        await pos.save();
    } catch (err) {
        console.log('mongodb write err:', err);
    }
}
