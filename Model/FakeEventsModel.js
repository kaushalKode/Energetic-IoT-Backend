import mongoose from 'mongoose';
import moment from 'moment';

const Schema = mongoose.Schema;

const fakeEventsSchema = new Schema({
    truck: {
        truckWeight: Number,
        bunkerWeight: Number
    },
    hydrolysis: {
        inputWaste: Number,
        outputVolume: Number
    },
    AnaerobicDig: {
        inputWasteFluidVolume: Number,
        outputMethane: Number,
        outputCO2: Number,
        outputGas: Number,
        pressure: Number,
        outputLiqSol: Number,
    },
    bioGasBallon: {
        GasStorage: Number,
    },
    compressor: {
        inputVol: Number,
        dispensedCont: Number
    },
    liqSolSep: {
        outputLiqVol: Number,
        outputSolWeight: Number
    },
    createdAt: {
        type: Date, // Change the type to Date
        // default: moment().utc().add(5.5, 'hours').toDate(), // Convert to Date object
    },
}, {
    strict: false
});

export default mongoose.model('cng_delhiburari_collection', fakeEventsSchema);
