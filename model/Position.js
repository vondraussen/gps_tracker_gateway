const mongoose = require('mongoose');

const positionSchema = new mongoose.Schema({
    deviceId: Number,
    fixTime: {type: Date, default: Date.now},
    position: {
        type: {type: String, enum: ['Point']},
        coordinates: {type: [Number]}
    },
    alt: Number,
    acc: Number,
    speed: Number,
    course: Number
});

module.exports = mongoose.model('Position', positionSchema);
