"use strict";
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));



const TestController = {

}


module.exports = { TestController };