"use strict";
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

var requestOptions = {}

// soraredata
// "https://www.soraredata.com/apiv2/players/info/89240944596761531134566896149757073034320255261326660001468647382045364465624"

const TestController = {
      test: async (req, res) => {
        res.status(200).json({status: true, msg:"This is a test msg!"});
      }          
}


module.exports = { TestController };



