"use strict";
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));



var requestOptions = {}


// scorecard
// "https://api.commentaryapi.com/api/v1/match/sher_e_pun_t20_2023_g9/scorecard"

// ballByBall
// "https://api.commentaryapi.com/api/v1/match/sher_e_pun_t20_2023_g9/ballByBall"


// allMatchId
// "https://api.commentaryapi.com/api/v2/match/recent/web"

// soraredata
// "https://www.soraredata.com/apiv2/players/info/89240944596761531134566896149757073034320255261326660001468647382045364465624"

const TestController = {
                
}


module.exports = { TestController };



