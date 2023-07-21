"use strict";
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const cheerio = require('cheerio');

var requestOptions = {}



const localISOToUnix = (iso) => {
  var unix_dt = new Date(iso)
  unix_dt = Math.floor(unix_dt.getTime())
  return unix_dt
}




const TestController = {
  test: async (req, res) => {
    res.status(200).json({ status: true, res: 'This is a test message!' });
  }

}

module.exports = { TestController };

