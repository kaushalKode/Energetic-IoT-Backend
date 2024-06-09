import mqtt from "mqtt";
import mongoose from "mongoose";
import shortid from "shortid";
import * as socketio from "socket.io";
import http from "http";
import express from "express";

import cors from "cors";

import Events from "./Model/EventsModel.js";
// import { json } from 'react-router-dom';

const app = express();

app.use(cors());

// mqtt broker
const client = mqtt.connect("mqtt://broker.hivemq.com:1883");
// mqtt subscriction
const topic1 = "Device_hx71_gps_moist_SensorData";
const topic2 = "Device_mq135_us_ir_SensorData";
const topic3 = "RFID_Servo_SensorData";

// mqtt client connection, mongo connection and subscription
client.on("connect", async () => {
  // mongo connect
  await mongoose.connect("mongodb://127.0.0.1:27017/iot_demo");

  console.log("MQTT connected");

  //mqtt subscribe
  client.subscribe(topic1);
  client.subscribe(topic2);
  client.subscribe(topic3);
});

// let timeoutDuration = 5000; // 5 seconds

// Mongo connection status
mongoose.connection.on("connected", async () => {
  console.log("MongoDb Connected");
});

let sensorData;
// Handle MQTT connection loss
client.on("close", () => {
  console.log("MQTT Connection Closed");
  // Reset sensorData when MQTT connection is closed
  sensorData = null;
});

// http server
const httpServer = http.createServer(app);

// web socket
const io = new socketio.Server(httpServer, {
  cors: {
    origin: "*",
  },
});

// api

app.get("/api/history", async (req, res) => {
  let startDate = new Date(); // Specify the end date

  const { period } = req.query;

  startDate.setHours(startDate.getHours() + 5);
  startDate.setMinutes(startDate.getMinutes() + 30);

  const endDate = new Date(startDate);

  if (period === "lastmin") {
    endDate.setMinutes(endDate.getMinutes() - 1);
  } else if (period === "lasthour") {
    endDate.setHours(endDate.getHours() - 1);
  } else if (period === "lastday") {
    endDate.setHours(endDate.getHours() - 24);
  } else if (period === "lastweek") {
    endDate.setHours(endDate.getDay() - 7);
  } else if (period === "lastmonth") {
    endDate.setHours(endDate.getMonth() - 1);
  } else {
    endDate.setSeconds(endDate.getSeconds() - 5); // Specify the end date\
  }

  // Find documents where the 'created' field is within the specified range
  const result = await Events.find({
    created: {
      $lte: startDate,
      $gte: endDate,
    },
  });

  const last10Items =
    result.length === 0
      ? await Events.find({})
          .sort({ created: -1 }) // Sort in descending order based on 'created' field
          .limit(10)
      : {};

  console.log(result.length);
  // console.log(last10Items[0].created);
  console.log("period", period);
  res.send(result.length === 0 ? last10Items : result);
  // res.json(dataGet);
});

// client connectiion and emition and getting data from mqtt socket 
io.on("connection", (cl) => {
  console.log("react client connected");
  console.log(cl.id);

  cl.on("clientClick", (d)=>{
    console.log(d);
    client.publish("Kaushal2024_CommandRequest", d)
  })
  // if(timeChange) clearInterval(timeChange) 

  // mqtt data receive and save to database
  // client.on("message", async (topic, message) => {
  //   //data from mqtt broker
  //   // console.log(
  //   //   "MQTT Received Topic:",
  //   //   topic.toString(),
  //   //   ",Message:",
  //   //   message.toString()
  //   // );

  //   //convert data to json and save to Database
  //   if (message.toString() !== "hello world") {
  //     let data = message.toString();
  //     data = JSON.parse(data);
  //     data._id = shortid.generate();
  //     data.created = new Date();

  //     data.created.setHours(data.created.getHours() + 5);
  //     data.created.setMinutes(data.created.getMinutes() + 30);
  //     //save to Database
  //     cl.emit("Kaushal2024_SensorData", data);
  //     await saveData(data);
  //   }
  // });

});




// save to database function

const saveData = async (data) => {
  data = new Events(data);
  data = await data.save();
  console.log("Saved Data:", data);

  sensorData = data;
};

httpServer.listen(8000);

const HOST = "localhost";
const PORT = 8001;

app.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
});
