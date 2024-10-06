#!/usr/bin/env deno
import * as asciichart from "./asciichart.ts";
import process from "node:process";

const size = process.stdout.columns;
const data = new Array(3);

// initialize all data rows
for (let i = 0; i < data.length; i++) {
  data[i] = new Array(size - 8);
}
// calculate data[0] = sin(xs)
for (let x = 0; x < data[0].length; x++) {
  data[0][x] = Math.sin(x * ((Math.PI * 4) / data[0].length));
}
// calculate data[1] = cos(xs)
for (let x = 0; x < data[1].length; x++) {
  data[1][x] = Math.cos(x * ((Math.PI * 4) / data[1].length));
}
// calculate data[2] = 0 (constant line)
for (let x = 0; x < data[2].length; x++) {
  data[2][x] = 0;
}
// plot all data rows
console.log(asciichart.plot(data, {
  colors: ["lightred", "lightgreen", "lightblue"],
  height: 10,
}));
