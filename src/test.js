"use strict";
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));



var requestOptions = {
    "credentials": "include",
    "headers": {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.5",
        "platform": "3",
        "version": "1",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "cross-site",
        "Origin": "https://www.cricketlineguru.com",
        "Authorization": "Basic Y3JpYzM2MGRldmxpdmU6Y0g0YkhzZ3hubkNoODVKclVnOGo="
    },
    "referrer": "https://www.cricketlineguru.com/",
    "method": "GET",
    "mode": "cors"
}


// scorecard
// "https://api.commentaryapi.com/api/v1/match/sher_e_pun_t20_2023_g9/scorecard"

// ballByBall
// "https://api.commentaryapi.com/api/v1/match/sher_e_pun_t20_2023_g9/ballByBall"


// allMatchId
// "https://api.commentaryapi.com/api/v2/match/recent/web"

// soraredata
// "https://www.soraredata.com/apiv2/players/info/89240944596761531134566896149757073034320255261326660001468647382045364465624"

const TestController = {
    test: async (req, res) => {
        const requestOptions = {
            "credentials": "include",
            "headers": {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0",
                "Accept": "application/json, text/plain, */*",
                "Accept-Language": "en-US,en;q=0.5",
                "platform": "3",
                "version": "1",
                "Sec-Fetch-Dest": "empty",
                "Sec-Fetch-Mode": "cors",
                "Sec-Fetch-Site": "cross-site",
                "Origin": "https://www.cricketlineguru.com",
                "Authorization": "Basic Y3JpYzM2MGRldmxpdmU6Y0g0YkhzZ3hubkNoODVKclVnOGo="
            },
            "referrer": "https://www.cricketlineguru.com/",
            "method": "GET",
            "mode": "cors"
        }

        var score = {};
        var links = [];


        try {
            const response = await fetch(
                `https://api.commentaryapi.com/api/v2/match/recent/web`,
                requestOptions
            );
            const response_data = await response.json();
            // console.log(response_data);
            if (response_data && response_data.res.matches) {
                await Promise.allSettled(response_data.res.matches.map(async (val) => {
                    // console.log(val.key);
                    const scorecard_url = `https://api.commentaryapi.com/api/v1/match/${val.key}/scorecard`;
                    const match_response = await fetch(scorecard_url, requestOptions);
                    const scorecard = await match_response.json();
                    score[val.key.trim()] = scorecard
                }))

                res.status(200).json(score);
                }
        } catch (e) {
            console.log('err', e);
            res.status(400).json({ success: false, error: { message: error.message } });
        }

        
    },

    

    

}


module.exports = { TestController };



