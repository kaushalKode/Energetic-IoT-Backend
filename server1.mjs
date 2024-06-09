import express from "express";
import http from "http";
import * as socketio from "socket.io";


const port = 4001;
const app = express();

const httpServer = http.createServer(app)

const data = [
    { name: 1, x: Math.random() * 10, y: Math.random() * 10 },
    { name: 2, x: Math.random() * 10, y: Math.random() * 10 },
    { name: 3, X: Math.random() * 10, y: Math.random() * 10 },
    { name: 4, x: Math.random() * 10, y: Math.random() * 10 },
    { name: 5, x: Math.random() * 10, y: Math.random() * 10 },
    ];



const server = new socketio.Server(httpServer, {
  cors: {
    origin: "*",
  },
});

let timeChange = true;
server.on("connection", (socket) => {
  console.log("connected");

if(timeChange) clearInterval(timeChange)

setInterval(()=>{
  if(data. length > 20) {
      data.reverse().pop()
      data.reverse()
  }
  data.push( { name: data [data. length - 1].name + 1, x: Math.random() * 10, y: Math.random() * 10,})
  socket.emit("message", data);
  // console.log("data sent",data);
}, 1000)
})

//   if (timeChange) setInterval(() => socket.emit("message", new Date()), 1000);
// });

httpServer.listen(port)
