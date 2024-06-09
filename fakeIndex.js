import express from 'express';

import mongoose from "mongoose";

import * as socketio from "socket.io";
import http from "http";

import FakeEventsModel from './Model/FakeEventsModel.js';

const app = express();


let dur = null;
let dateRangeStart = null;
let dateRangeEnd = null;

mongoose.connect("mongodb://127.0.0.1:27017/iot_demo_2024");
// Mongo connection status
mongoose.connection.on("connected", async () => {
  console.log("MongoDb Connected");
});

// save to database function

const saveData = async (data) => {
  try{
    data = new FakeEventsModel(data);
    data = await data.save();
    // console.log("Saved Data:", data);
  } catch (error) {
    console.error('Error saving data:', error);
  }

  // sensorData = data;
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
    // client.publish("Kaushal2024_CommandRequest", d)
  })

  cl.on("dateRange", (start, end) => {
    console.log("dateRange called",start,end);
    dateRangeStart = new Date(start);
    dateRangeEnd = new Date(end);
    dur = null

    console.log('dateRangeStart : ',dateRangeStart);
  })

  cl.on("duration", (dr) => {

    dateRangeStart = null;
    dateRangeEnd = null;

      // console.log("duration called",dr);
      // let dur = 60*60*24;
      if(dr == "sec") {
        dur = 1;
      } else if(dr === "min") {
        dur = 60;
      } else if(dr === "hour") {
        dur = 60*60;
      } else if(dr === "day") {
        dur = 60*60*24;
      } else if(dr === "week") {
        dur = 60*60*24*7;
      } else if(dr === "month") {
        dur = 60*60*24*30;
      } else if(dr === "quarter") {
        dur = 60*60*24*30*3;
      } else if(dr === "year") {
        dur = 60*60*24*365;
      }
  })
});



// Function to query and emit minute data continuosly
const queryAndEmitData = async () => {
  try {

      let data = null
      const offset = 5.5 * 60 * 60 * 1000;

      if(dur){
        console.log('dur : ',dur);
       
        const startTime = new Date(Date.now() + offset - dur*1000); // 60000 milliseconds = 1 minute ago
        data = await FakeEventsModel.find({ createdAt: { $gte: startTime } });
        // console.log('start time : ',startTime);
      }

      if(dateRangeStart && dateRangeEnd) {
        console.log('fetching data from dateRange');
        data = await FakeEventsModel.find({ createdAt: {
                                            $gte: dateRangeStart ,
                                            $lte: dateRangeEnd 
                                          }});

        if(!data) {
          dateRangeEnd = null
          dateRangeStart = null
        }
      }

      // console.log(data);
      io.emit("DataFromLastInterval", data);
      
  } catch (error) {
      console.error("Error fetching and emitting data:", error);
  }
};


// Emit data every second
setInterval(queryAndEmitData, 1000);




async function generateAndSaveDataEverySecond() {
  let count = 0;
  let truckCount = 0;
  
  // Initialize all variables in a dictionary
  let variables = {
      truck: {},
      hydrolysis: {},
      AnaerobicDig: {},
      bioGasBallon: {},
      compressor: {},
      liqSolSep: {},
  };

  let variableColl = [];

  while (true) {
    try{
      const randomNum = Math.floor(Math.random() * 10);

      count += 1;

      // Hydrolysis
      variables.hydrolysis.inputWaste = Math.floor(Math.random() * 10);
      variables.hydrolysis.outputVolume = Math.floor(Math.random() * 1000);

      // Anaerobic digestion
      variables.AnaerobicDig.inputWasteFluidVolume = Math.floor(Math.random() * 1000);
      variables.AnaerobicDig.outputMethane = Math.floor(Math.random() * 1000);
      variables.AnaerobicDig.outputCO2 = Math.floor(Math.random() * 1000);
      variables.AnaerobicDig.outputGas = variables.AnaerobicDig.outputMethane + variables.AnaerobicDig.outputCO2;
      variables.AnaerobicDig.pressure = Math.floor(Math.random() * 100);
      variables.AnaerobicDig.outputLiqSol = Math.floor(Math.random() * 1000);

      // BioGas Balloon
      variables.bioGasBallon.GasStorage = Math.floor(Math.random() * 10000);

      // Compressor
      variables.compressor.inputVol = Math.floor(Math.random() * 3000);
      variables.compressor.dispensedCont = Math.floor(variables.compressor.inputVol / 300);

      // Solid Liquid Sep
      variables.liqSolSep.outputLiqVol = Math.floor(Math.random() * 1000);
      variables.liqSolSep.outputSolWeight = Math.floor(Math.random() * 1000);

      // Set createdAt to currentDate
      const currentDate = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000; // Offset in milliseconds for IST (5.5 hours ahead of UTC)
      const istTime = new Date(currentDate.getTime() + istOffset);

      variables.createdAt = istTime.toISOString();;

      if (randomNum < 2) {
          truckCount += 1;
          // console.log("truck count : ", truckCount);
          variables.truck.truckWeight = Math.floor(Math.random() * 10);
          variables.truck.bunkerWeight = Math.floor(Math.random() * 10) + variables.truck.truckWeight;
      }

      io.emit("realTimeSensorData",variables)
      await saveData(variables);

      variableColl.push({ ...variables });

      // Wait for 1 second before the next iteration
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error('Error in generateAndSaveDataEverySecond loop:', error);
    }
  }
}


async function updateDateIfRandomIsFive(initialDate, totalDays)  {

  let count = 0
  let truckCount = 0
  let currentDate = new Date(initialDate);
  
  // Initialize all variables in a dictionary
  let variables = {
    truck:{},
    hydrolysis:{},
    AnaerobicDig:{},
    bioGasBallon:{},
    compressor:{},
    liqSolSep:{},
  };

  let variableColl = [];

  // Ensure totalDays is a positive integer
  totalDays = Math.max(0, Math.floor(totalDays));
  
  let endDate = new Date(currentDate);
  endDate.setDate(currentDate.getDate() + totalDays);

  while(currentDate < endDate) {
      const randomNum = Math.floor(Math.random() * 10);
      // console.log(randomNum);

      count += 1;

      // Hydrolysis
      variables.hydrolysis.inputWaste = Math.floor(Math.random() * 10);
      variables.hydrolysis.outputVolume = Math.floor(Math.random() * 1000);
      
      // Anaerobic digestion
      variables.AnaerobicDig.inputWasteFluidVolume = Math.floor(Math.random() * 1000);
      variables.AnaerobicDig.outputMethane =  Math.floor(Math.random() * 1000);
      variables.AnaerobicDig.outputCO2 =  Math.floor(Math.random() * 1000);

      variables.AnaerobicDig.outputGas = variables.AnaerobicDig.outputMethane + variables.AnaerobicDig.outputCO2;

      variables.AnaerobicDig.pressure = Math.floor(Math.random() * 100);

      variables.AnaerobicDig.outputLiqSol = Math.floor(Math.random() * 1000);


      // BioGas Balloon
      variables.bioGasBallon.GasStorage = Math.floor(Math.random() * 10000);

      // Compressor
      variables.compressor.inputVol = Math.floor(Math.random() * 3000);

      variables.compressor.dispensedCont = Math.floor(variables.compressor.inputVol / 300)

      // Solid Liquid Sep
      variables.liqSolSep.outputLiqVol = Math.floor(Math.random() * 1000);
      variables.liqSolSep.outputSolWeight = Math.floor(Math.random() * 1000);


      // Add 1 hour and random minutes (0-59) to currentDate
      let newDate = new Date(currentDate);
      // newDate.setHours(newDate.getHours() + 1);
      newDate.setMinutes(newDate.getMinutes() + Math.floor(Math.random() * 30));
      
      // Set createdAt to newDate and update currentDate
      variables.createdAt = newDate;
      currentDate = newDate;

      if (randomNum < 2) {
          truckCount += 1;

          variables.truck.truckWeight = Math.floor(Math.random() * 10);
          variables.truck.bunkerWeight = Math.floor(Math.random() * 10) + variables.truck.truckWeight;
      }

      await saveData(variables);

      variableColl.push({ ...variables });

      // saveData(variables);

      if(truckCount === 100) {
          // console.log(truckCount);
          currentDate.setDate(currentDate.getDate() + 1);
          truckCount = 0;
      }
  }
  return [endDate,variables,variableColl,count];
}


  
  // Example usage:
  // const initialDate = '2024-05-18'; // Can be any valid date string or Date object


  // Calculate the initial date 200 days before today
  // const initialDate = new Date();
  // initialDate.setDate(initialDate.getDate() - 200);
  // const initialDateString = initialDate.toISOString().split('T')[0];
  // const days = 200;

  // updateDateIfRandomIsFive(initialDate, days).then(updatedDate => {
  //   console.log(updatedDate[0].toISOString().split('T')[0]); // Outputs the final date in YYYY-MM-DD format
  //   console.log(updatedDate[3]);
  // });



// generateAndSaveDataEverySecond()

// Start the server first
httpServer.listen(8001, () => {
  console.log('Server listening at port 8001');
  
  // Then start the infinite loop
  generateAndSaveDataEverySecond();
});