"use strict";
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

var requestOptions = {}

//Fix t1.f & t1.n in cricbuzz
//Fix "match_status" in espn to longformat
//Change "Match Yet To Begin" to "preview" in "match_status" of nw18
//Change "Completed" to "post" in "match_status" of cricbuzz
//Add "start_date_time" for all other than cricbuzz and espn
//convert "start_date_time" to unix format in espn
//Add "match_status.toLowerCase()" for all 



const TestController = {
  test: async (req, res) => {
    res.status(200).json({ status: true, res: 'This is a test message!' });
  }
}

module.exports = { TestController };

