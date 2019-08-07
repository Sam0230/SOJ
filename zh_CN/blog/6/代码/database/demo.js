#!/usr/bin/env node

require("database").write("TEST", "OK");
console.log(require("database").read("TEST").result);