require("dotenv").config();
const http = require("http");
const cors = require("cors");
const logger = require("morgan");
const cookieParser = require("cookie-parser");
const socket = require("socket.io");
const express = require("express");
const { normalizePort } = require("./jumk");
const { Message, messages } = require("./game");

const port = normalizePort(process.env.PORT || 3001);
const token = process.env.SOCKET_TOKEN || "faketoken";
const app = express();
app.set("port", port);

app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(express.static("./public"));

app.post("/send", (req, res) => {
  const name = req.body?.name;
  const text = req.body?.text;
  console.log(">> POST", name, text);

  if (!name || !text) return;

  messages.emit("m", [name, text]);
  res.redirect("/");
});

var debugActive = false;

app.get("/debug/true", (req, res) => {
  debugActive = true;
});

app.get("/debug/false", (req, res) => {
  debugActive = false;
});

const server = http.createServer(app);
const io = new socket.Server(server, {
  cors: {
    origin: "http://localhost:3001",
    methods: ["GET", "POST"],
  },
});

io.on("connect", (socket) => {
  console.log(">> IO", "connect");
  const messageHandler = (message) => {
    console.log(">> MESSAGE", message);
    socket.emit("m", message);
  };

  messages.on("m", messageHandler);
  socket.once("disconnect", () => {
    messages.off("m", messageHandler);
  });

  if (socket.handshake.auth.token !== token) {
    console.log(">> IO", "bad token");
    socket.disconnect();
    return;
  }
});

server.listen(port);
server.on("error", (error) => {
  const bind = typeof port === "string" ? "Pipe " + port : "Port " + port;
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      return process.exit(1);
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      return process.exit(1);
    default:
      throw error;
  }
});
server.on("listening", () => {
  const addr = server.address();
  const bind = typeof addr === "string" ? "pipe " + addr : ":" + addr?.port;
  console.log("server listening on http://localhost" + bind);
});
console.log(server.address());

function auto() {
  setTimeout(function () {
    if (debugActive) {
      messages.emit("m", [getThingie(peeps), getThingie(compliments)]);
    }
    auto();
  }, 1000);
}

auto();

function getThingie(list) {
  const index = Math.floor(Math.random() * list.length);
  return list[index];
}

const peeps = ["abby", "fugue", "kevinrpb", "snare"];
const compliments = [
  "you have a lovely smile",
  "you look strong",
  "you carry yourself with a sense of purpose",
  "you look really good today",
  "your ascii art is 10/10",
  `Not the worst human I've met`,
  `you're really good at making the keyboard go clicky clack`,
];
