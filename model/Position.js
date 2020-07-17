const mongoose = require('mongoose');

const positionSchema = new mongoose.Schema({
    deviceId: Number,
    fixTime: Number,
    lat: Number,
    lon: Number,
    alt: Number,
    acc: Number,
    speed: Number,
    course: Number
});

module.exports = mongoose.model('Position', positionSchema);
