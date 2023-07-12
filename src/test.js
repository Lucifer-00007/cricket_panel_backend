"use strict";
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));



const TestController = {
    espn: async (req, res) => {
        var requestOptions1 = {
            "credentials": "include",
            "headers": {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
                "Upgrade-Insecure-Requests": "1",
                "Sec-Fetch-Dest": "document",
                "Sec-Fetch-Mode": "navigate",
                "Sec-Fetch-Site": "cross-site"
            },
            "method": "GET",
            "mode": "cors"
        }

        var requestOptions2 = {
            "credentials": "include",
            "headers": {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
                "Upgrade-Insecure-Requests": "1",
                "Sec-Fetch-Dest": "document",
                "Sec-Fetch-Mode": "navigate",
                "Sec-Fetch-Site": "none",
                "Sec-Fetch-User": "?1"
            },
            "method": "GET",
            "mode": "cors"
        }

        var finall_result = {};

        try {
            const response = await fetch(
                "https://hs-consumer-api.espncricinfo.com/v1/pages/matches/current",
                requestOptions2
            )
            const response_data = await response.json()
            await Promise.allSettled(response_data.matches.map(async (val) => {
                var req_url = `https://hs-consumer-api.espncricinfo.com/v1/pages/match/scorecard?lang=en&seriesId=1&matchId=${val.objectId}`;
                // espn_match_url.push(req_url);

                const match_response = await fetch(req_url, requestOptions2)
                const score_data = await match_response.json();

                var match_details = score_data.match;
                var match_content = score_data.content;

                if (typeof match_content != "undefined") {
                    if (match_content.innings != null) {
                        console.log("test2")
                        
                        var current_inns = match_content.inning.inningNumber
                            ? match_content.inning.inningNumber * 1
                            : 0;
                        var batsmens = match_content
                            ? match_content.innings.length > 0
                                ? match_content.innings[current_inns - 1]
                                    .inningBatsmen
                                : ""
                            : "";
                        console.log('batsmens: ', batsmens);
                        var current_batsmen_onstrick = "";
                        var current_batsmen_nonstrick = "";
                        var batsmen_onstrick_details = [];
                        var batsmen_nonstrick_details = [];

                        if (batsmens !== "") {
                            batsmens.map(async (batsmen) =>{
                                if (
                                    batsmen.battedType === "yes" &&
                                    batsmen.isOut === false &&
                                    batsmen.currentType === 1
                                ) {
                                    current_batsmen_onstrick = batsmen.player.longName;
                                    batsmen_onstrick_details[0] = batsmen.runs
                                        ? batsmen.runs
                                        : "0";
                                    batsmen_onstrick_details[1] = batsmen.balls
                                        ? batsmen.balls
                                        : "0";
                                    batsmen_onstrick_details[2] = batsmen.fours
                                        ? batsmen.fours
                                        : "0";
                                    batsmen_onstrick_details[3] = batsmen.sixes
                                        ? batsmen.sixes
                                        : "0";
                                }

                                if (
                                    batsmen.battedType === "yes" &&
                                    batsmen.isOut === false &&
                                    batsmen.currentType === 2
                                ) {
                                    current_batsmen_nonstrick = batsmen.player.longName;
                                    batsmen_nonstrick_details[0] = batsmen.runs
                                        ? batsmen.runs
                                        : "0";
                                    batsmen_nonstrick_details[1] = batsmen.balls
                                        ? batsmen.balls
                                        : "0";
                                    batsmen_nonstrick_details[2] = batsmen.fours
                                        ? batsmen.fours
                                        : "0";
                                    batsmen_nonstrick_details[3] = batsmen.sixes
                                        ? batsmen.sixes
                                        : "0";
                                }
                            })
                        }
                    }

                    if (match_content.supportInfo.liveSummary != null) {
                        var ball_run = "";
                        var last_6_balls_req = [];

                        var last_6_balls_full =
                            match_content.supportInfo.liveSummary.recentBalls.slice(0, 6);

                        for (let ball of last_6_balls_full) {
                            // console.log(ball);

                            if (ball.isWicket === true) {
                                ball_run = ball.totalRuns + "W";
                            } else if (
                                ball.isWicket === false &&
                                ball.byes === 0 &&
                                ball.legbyes === 0 &&
                                ball.wides === 0 &&
                                ball.noballs === 0
                            ) {
                                ball_run = ball.totalRuns + "";
                            } else if (
                                ball.isWicket === false &&
                                ball.byes !== 0 &&
                                ball.legbyes === 0 &&
                                ball.wides === 0 &&
                                ball.noballs === 0
                            ) {
                                ball_run = ball.totalRuns + "b";
                            } else if (
                                ball.isWicket === false &&
                                ball.byes === 0 &&
                                ball.legbyes !== 0 &&
                                ball.wides === 0 &&
                                ball.noballs === 0
                            ) {
                                ball_run = ball.totalRuns + "lb";
                            } else if (
                                ball.isWicket === false &&
                                ball.byes === 0 &&
                                ball.legbyes === 0 &&
                                ball.wides !== 0 &&
                                ball.noballs === 0
                            ) {
                                ball_run = ball.totalRuns + "wd";
                            } else if (
                                ball.isWicket === false &&
                                ball.byes === 0 &&
                                ball.legbyes === 0 &&
                                ball.wides === 0 &&
                                ball.noballs !== 0
                            ) {
                                ball_run = ball.totalRuns + "nb";
                            }
                            last_6_balls_req.push(ball_run);
                        }
                    }

                    var obj = {
                        match_url: `https://www.espncricinfo.com/series/${match_details.series.slug
                            }-${match_details.series.objectId}/${match_details.slug}-${match_details.objectId
                            }/${match_details.stage === "SCHEDULED"
                                ? "match-preview"
                                : match_details.stage === "RUNNING"
                                    ? "live-cricket-score"
                                    : match_details.stage === "FINISHED"
                                        ? "full-scorecard"
                                        : ""
                            }`,

                        match_api_url: req_url,

                        match_status: match_details.state ? match_details.state : "",


                        t1: {
                            t_id: match_details.teams[0].team.id
                                ? match_details.teams[0].team.id
                                : "",

                            f: match_details.teams[0].team.longName
                                ? match_details.teams[0].team.longName
                                : "",

                            n: match_details.teams[0].team.abbreviation
                                ? match_details.teams[0].team.abbreviation
                                : "",
                        },

                        t2: {
                            t_id: match_details.teams[1].team.id
                                ? match_details.teams[1].team.id
                                : "",

                            f: match_details.teams[1].team.longName
                                ? match_details.teams[1].team.longName
                                : "",

                            n: match_details.teams[1].team.abbreviation
                                ? match_details.teams[1].team.abbreviation
                                : "",
                        },

                        i1: {
                            fsc: match_details.teams[0].score
                                ? match_details.teams[0].score
                                : "0",

                            sc:
                                match_content === null
                                    ? "0"
                                    : match_content.innings.length < 1
                                        ? "0"
                                        : match_content.innings[0].inningNumber === 1
                                            ? match_content.innings[0].runs.toString()
                                            : "0",

                            wk:
                                match_content === null
                                    ? "0"
                                    : match_content.innings.length < 1
                                        ? "0"
                                        : match_content.innings[0].inningNumber === 1
                                            ? match_content.innings[0].wickets.toString()
                                            : "0",

                            ov:
                                match_content === null
                                    ? "0"
                                    : match_content.innings.length < 1
                                        ? "0"
                                        : match_content.innings[0].inningNumber === 1
                                            ? match_content.innings[0].overs.toString()
                                            : "0",
                        },

                        i2: {
                            fsc: match_details.teams[1].score
                                ? match_details.teams[1].score
                                : "0",

                            sc:
                                match_content === null
                                    ? "0"
                                    : match_content.innings.length < 2
                                        ? "0"
                                        : match_content.innings[1].inningNumber === 2
                                            ? match_content.innings[1].runs.toString()
                                            : "0",

                            wk:
                                match_content === null
                                    ? "0"
                                    : match_content.innings.length < 2
                                        ? "0"
                                        : match_content.innings[1].inningNumber === 2
                                            ? match_content.innings[1].wickets.toString()
                                            : "0",

                            ov:
                                match_content === null
                                    ? "0"
                                    : match_content.innings.length < 2
                                        ? "0"
                                        : match_content.innings[1].inningNumber === 2
                                            ? match_content.innings[1].overs.toString()
                                            : "0",
                        },

                        i3: {
                            fsc: match_details.teams[0].score
                                ? match_details.teams[0].score
                                : "0",

                            sc:
                                match_content === null
                                    ? "0"
                                    : match_content.innings.length < 3
                                        ? "0"
                                        : match_content.innings[2].inningNumber === 3
                                            ? match_content.innings[2].runs.toString()
                                            : "0",

                            wk:
                                match_content === null
                                    ? "0"
                                    : match_content.innings.length < 3
                                        ? "0"
                                        : match_content.innings[2].inningNumber === 3
                                            ? match_content.innings[2].wickets.toString()
                                            : "0",

                            ov:
                                match_content === null
                                    ? "0"
                                    : match_content.innings.length < 3
                                        ? "0"
                                        : match_content.innings[2].inningNumber === 3
                                            ? match_content.innings[2].overs.toString()
                                            : "0",
                        },

                        i4: {
                            fsc: match_details.teams[1].score
                                ? match_details.teams[1].score
                                : "0",

                            sc:
                                match_content === null
                                    ? "0"
                                    : match_content.innings.length < 4
                                        ? "0"
                                        : match_content.innings[3].inningNumber === 4
                                            ? match_content.innings[3].runs.toString()
                                            : "0",

                            wk:
                                match_content === null
                                    ? "0"
                                    : match_content.innings.length < 4
                                        ? "0"
                                        : match_content.innings[3].inningNumber === 4
                                            ? match_content.innings[3].wickets.toString()
                                            : "0",

                            ov:
                                match_content === null
                                    ? "0"
                                    : match_content.innings.length < 4
                                        ? "0"
                                        : match_content.innings[3].inningNumber === 4
                                            ? match_content.innings[3].overs.toString()
                                            : "0",
                        },


                        bw:
                            match_content.supportInfo.liveSummary != null
                                ? match_content.supportInfo.liveSummary.bowlers.length > 0
                                    ? match_content.supportInfo.liveSummary.bowlers[0].player
                                        .longName
                                    : ""
                                : "",



                        iov:
                            match_details.format === "T20"
                                ? "20"
                                : match_details.format === "TEST"
                                    ? "90"
                                    : match_details.format === "ODI"
                                        ? "50"
                                        : "",

                        p1: current_batsmen_onstrick
                            ? current_batsmen_onstrick.trim()
                            : "",
                        p2: current_batsmen_nonstrick
                            ? current_batsmen_nonstrick.trim()
                            : "",
                        b1s: batsmen_onstrick_details
                            ? `${batsmen_onstrick_details[0]
                                ? batsmen_onstrick_details[0]
                                : "0"
                            },${batsmen_onstrick_details[1]
                                ? batsmen_onstrick_details[1]
                                : "0"
                            },${batsmen_onstrick_details[2]
                                ? batsmen_onstrick_details[2]
                                : "0"
                            },${batsmen_onstrick_details[3]
                                ? batsmen_onstrick_details[3]
                                : "0"
                            }`
                            : "",
                        b2s: batsmen_nonstrick_details
                            ? `${batsmen_nonstrick_details[0]
                                ? batsmen_nonstrick_details[0]
                                : "0"
                            },${batsmen_nonstrick_details[1]
                                ? batsmen_nonstrick_details[1]
                                : "0"
                            },${batsmen_nonstrick_details[2]
                                ? batsmen_nonstrick_details[2]
                                : "0"
                            },${batsmen_nonstrick_details[3]
                                ? batsmen_nonstrick_details[3]
                                : "0"
                            }`
                            : "",
                        pb: last_6_balls_req
                            ? `${last_6_balls_req[0]},${last_6_balls_req[1]},${last_6_balls_req[2]},${last_6_balls_req[3]},${last_6_balls_req[4]},${last_6_balls_req[5]}`
                            : "",


                        title: match_details.slug ? match_details.slug : "",

                        start_date_time: match_details.startTime
                            ? match_details.startTime
                            : "",

                        match_league: match_details.series.name
                            ? match_details.series.name
                            : "",


                        toss_winner_team:
                            match_details.tossWinnerTeamId === null
                                ? ""
                                : match_details.tossWinnerTeamId ===
                                    match_details.teams[0].team.id
                                    ? match_details.teams[0].team.abbreviation
                                    : match_details.tossWinnerTeamId ===
                                        match_details.teams[1].team.id
                                        ? match_details.teams[1].team.abbreviation
                                        : "",

                        winner_team:
                            match_details.winnerTeamId === null
                                ? ""
                                : match_details.winnerTeamId ===
                                    match_details.teams[0].team.id
                                    ? match_details.teams[0].team.abbreviation
                                    : match_details.winnerTeamId ===
                                        match_details.teams[1].team.id
                                        ? match_details.teams[1].team.abbreviation
                                        : "",

                        liveInning: match_details.liveInning
                            ? match_details.liveInning
                            : "",

                        match_no: match_details.title ? match_details.title : "",

                        venue: `${match_details.ground != null ? match_details.ground.name : ""
                            }, ${match_details.ground != null
                                ? match_details.ground.country.name
                                : ""
                            }`,

                        cs: {
                            msg: match_details.statusText,
                            ts: "",
                        },
                    };
                }
                finall_result[req_url.split("&matchId=")[1]] = obj;
            }));
            console.log('finall_result-->', finall_result);
            res.status(200).json(finall_result);
        } catch (error) {
            console.log('error -->', error);
            res.status(400).json({ success: false, error: { message: error.message } });
        }
    }
}


module.exports = { TestController };