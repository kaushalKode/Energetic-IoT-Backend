import mqtt from 'mqtt';
import express from 'express';

import moment from 'moment';

import mongoose from "mongoose";

import * as socketio from "socket.io";
import http from "http";

import cors from "cors";

import Events from "./Model/EventsModel.js";


const app = express();
app.use(cors());

// mqtt broker
const client = mqtt.connect("mqtt://broker.hivemq.com:1883");

// Variables to store received data for each topic
const topicData = {};
const sensorData = [];

// Combine data from all topics into a master JSON object
const masterData = {};

let count = 0;
let dur = 60*60*24*3;



// mqtt subscrictions
const topics = [
    "Device_hx71_gps_moist_SensorData",
    "Device_mq135_us_ir_SensorData",
    "RFID_Servo_SensorData"
];

// mqtt client connection event
client.on("connect", async () => {
    // mongo connect
    await mongoose.connect("mongodb://127.0.0.1:27017/iot_demo_2024");

    console.log("MQTT Connected");

    topics.forEach(topic => {
        client.subscribe(topic);
        topicData[topic] = {};
    });

    console.log("Subscribed to:", topics.join(",\n"));
});

// Mongo connection status
mongoose.connection.on("connected", async () => {
    console.log("MongoDb Connected");
});

// Define a function to emit masterData to connected clients
const emitMasterData = (socket) => {
    if (masterData && Object.keys(masterData).length !== 0) {
        socket.emit("sensorData", masterData);
    }
};

// http server
const httpServer = http.createServer(app);

// web socket
const io = new socketio.Server(httpServer, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (cl) => {
    console.log("react client connected");
    console.log(cl.id);

    // Emit masterData to the newly connected client
    // emitMasterData(cl);


  
    cl.on("clientClick", (d)=>{
      console.log(d);
      client.publish("Kaushal2024_CommandRequest", d)
    })

    cl.on("3:11", (dr) => {

        console.log(dr);
        // let dur = 60*60*24;
        if(dr == "3:11") {
            dur = 60*60*17.2;
        } else if(dr === "2:11") {
            dur = 60*60*18.5;
        } else if(dr === "0:11") {
            dur = 60*60*32.5;
        }
    })
});


// Function to query and emit minute data continuosly
const queryAndEmitData = async () => {
    try {
        // Define the start time for the last 1 minute
        const startTime = new Date(Date.now() - dur*1000); // 60000 milliseconds = 1 minute ago

        // Query the Events collection for entries created in the last 1 minute
        const data = await Events.find({ createdAt: { $gte: startTime } });

        // console.log(data.length);
        // Emit data over WebSocket
        io.emit("DataFromLastInterval", data);
        // console.log("data sent", data["RFID"]["tempC"]);
        
    } catch (error) {
        console.error("Error fetching and emitting data:", error);
    }
};


// Emit data every second
setInterval(queryAndEmitData, 1000);


// receiving data from sensors over mqtt

client.on("message", async (topic, message) => {
    const data = JSON.parse(message.toString());
   
    topicData[topic] = data;


    Object.keys(topicData).forEach(topic => {
        Object.assign(masterData, topicData[topic]);
    });

    const currentDate = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // Offset in milliseconds for IST (5.5 hours ahead of UTC)
    const istTime = new Date(currentDate.getTime() + istOffset);
    const istTimeString = istTime.toISOString();

    // Add the current date and time to the masterData object
    masterData.createdAt = istTimeString;

    topicData["RFID_Servo_SensorData"] = {}

    sensorData.push(masterData);

    io.emit("realTimeSensorData",masterData)
    await saveData(masterData);

    console.log(count);
    count += 1;


    // console.log("Master JSON:", masterData);

    // console.log(typeof(masterData));

    
});

client.on("close", () => {
    console.log("MQTT Connection Closed.");
});


// save to database function

const saveData = async (data) => {
    data = new Events(data);
    data = await data.save();
    console.log("Saved Data:", data);
  
    // sensorData = data;
};

httpServer.listen(8001);

app.listen(8000, () => {
    console.log("Server listening at port 8000");
});
