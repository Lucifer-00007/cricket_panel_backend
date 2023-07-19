"use strict";
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const cheerio = require('cheerio');

var requestOptions = {}

//-Fix t1.f & t1.n in cricbuzz
//-Change "Completed" to "Post" in "match_status" of cricbuzz
//-Match_url and match_api_url in cricbuzz
//Add "start_date_time" for all other than cricbuzz and espn
//Fix "match_status" in espn to longformat
//convert "start_date_time" to unix format in espn
//Change "Match Yet To Begin" to "Preview" in "match_status" of nw18
//Add "match_status.toLowerCase()" for all 

// Match_status filter
const statusFilter = (val) => {
  if (val == 'H') {
    return "Hello World!";
  } else if (val == 'I') {
    return "I am Luffy!"
  } else {
    return "The End!"
  }
}

// Capitalize First Letter
const capitalize = (txt) => {
  return txt.charAt(0).toUpperCase() + txt.slice(1);
}

const TestController = {
  test: async (req, res) => {
    res.status(200).json({ status: true, res: 'This is a test message!' });
  }

}

module.exports = { TestController };

