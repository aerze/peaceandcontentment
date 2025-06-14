const EventEmitter = require("node:events");

var id = 0;

function Message(name, text) {
  this.id = ++id;
  this.name = name;
  this.text = text;
  this.position = [0, 0];
  this.time = Date.now();
}

const messages = new EventEmitter();

module.exports = {
  Message,
  messages,
};
