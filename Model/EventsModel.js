import mongoose from 'mongoose';
import moment from 'moment';

const Schema = mongoose.Schema;

const EventsSchema = new Schema({
    HX71: {
        weight: Number,
        calValue: Number
    },
    GPS: {
        lat: Number,
        lng: Number
    },
    Moisture: {
        Data: Number
    },
    MQ135: {
        rZero: Number,
        PPM: Number
    },
    UltraSonic: {
        distance: Number
    },
    IR: {
        data: Number
    },
    DHT11: {
        tempC: Number,
        tempF: Number,
        humidity: Number
    },
    RFID: {
        Id: String,
        firstName: String,
        lastName: String,
        company: String,
        DOB: String,
        Phone: String
    },
    createdAt: {
        type: Date, // Change the type to Date
        default: moment().utc().add(5.5, 'hours').toDate(), // Convert to Date object
    },
}, {
    strict: false
});

export default mongoose.model('SensorEvents', EventsSchema);
