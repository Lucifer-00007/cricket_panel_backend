"use strict";
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

// allmatches
// https://cricketnext.nw18.com/sports/csr/feed/recent_matches_en.json

// each match details
// https://cricketnext.nw18.com/sports/csr/feed/match_bwinw07132023228335_en.json


// `nw18${matchid.substring(15)}`;

// `https://www.news18.com/cricketnext/live-score/${luxembourg}-vs-${switzerland}-live-score-${lxswz07142023228657}.html`


// https://www.news18.com/cricketnext/live-score/thailand-women-vs-scotland-women-live-score-thwscw07132023226997.html
// https://www.news18.com/cricketnext/live-score/Thailand-Women-vs-Scotland-Women-live-score-thwscw07132023226997.html

const TestController = {
    test: async (req, res) => {
        var score = {};

        const requestOptions1 = {
            "credentials": "include",
            "headers": {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
                "Upgrade-Insecure-Requests": "1",
                "Sec-Fetch-Dest": "document",
                "Sec-Fetch-Mode": "navigate",
                "Sec-Fetch-Site": "cross-site",
                "If-Modified-Since": "Fri, 14 Jul 2023 09:46:07 GMT",
                "If-None-Match": "\"0x8DB844F25C6B4E6\""
            },
            "method": "GET",
            "mode": "cors"
        }

        const requestOptions2 = {
            "credentials": "include",
            "headers": {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
                "Upgrade-Insecure-Requests": "1",
                "Sec-Fetch-Dest": "document",
                "Sec-Fetch-Mode": "navigate",
                "Sec-Fetch-Site": "none",
                "Sec-Fetch-User": "?1",
                "If-Modified-Since": "Thu, 13 Jul 2023 13:39:54 GMT",
                "If-None-Match": "\"0x8DB83A6A3F98385\""
            },
            "method": "GET",
            "mode": "cors"
        }

        try {
            const response = await fetch(
                "https://cricketnext.nw18.com/sports/csr/feed/recent_matches_en.json",
                requestOptions1
            );

            const response_data = await response.json();

            await Promise.allSettled(response_data.map(async (val) => {

                const req_url = `https://cricketnext.nw18.com/sports/csr/feed/match_${val.matchid}_en.json`;
                const match_response = await fetch(req_url, requestOptions2);
                const sc = await match_response.json();
                // console.log(sc);

                // Get_Live_Innings
                var live_innings = '';
                if(sc.fourthInnings.status === 1){
                    live_innings = sc.fourthInnings;
                }else if(sc.thirdInnings.status === 1){
                    live_innings = sc.thirdInnings;
                }else if(sc.secondInnings.status === 1){
                    live_innings = sc.secondInnings;
                }else if(sc.firstInnings.status === 1){  
                    live_innings = sc.firstInnings;
                }    

                // Get Live_Batsmens & Live_Bowler
                var batsmen_onstrick = '';
                var batsmen_nonstrick = '';
                var live_bowler = '';
                if(live_innings != '' && live_innings.status === 1){
                    // For Batsmen
                    if(live_innings.livePlayers.BatsMan[0].Striker === "yes"){
                        batsmen_onstrick = live_innings.livePlayers.BatsMan[0];
                        batsmen_nonstrick = live_innings.livePlayers.BatsMan[1];
                    }else {
                        batsmen_onstrick = live_innings.livePlayers.BatsMan[1];
                        batsmen_nonstrick = live_innings.livePlayers.BatsMan[0];

                    }
                    // For Bowler
                    if(live_innings.livePlayers.Bowler[0].Bowling === "yes"){
                        live_bowler = live_innings.livePlayers.Bowler[0].name;
                    }else {
                        live_bowler = live_innings.livePlayers.Bowler[1].name;
                    }

                }


                // console.log({
                //     matchCode: sc.matchCode,
                //     status: sc.status,
                //     live_innings: live_innings,
                //     batsmen_onstricker: batsmen_onstrick,
                //     batsmen_nonstrick: batsmen_nonstrick,
                //     live_bowler: live_bowler,

                // });

                // Getting_Last_6_Balls                
                // if (sc.commentary && sc.commentary.length > 0) {
                //     var last_six_balls = [];
                //     var ball_run = '---'

                //     for (let scr of sc.commentary) {
                //         if (scr.opta_ball_type != undefined && scr.opta_ball_type != 'end of over') {

                //             var scr_runs = (scr.runs != undefined ? scr.runs : '')

                //             switch (scr.opta_ball_type) {
                //                 case 'normal':
                //                     ball_run = (scr.runs != undefined ? scr.runs : '0');
                //                     break;

                //                 case 'one':
                //                     ball_run = "1";
                //                     break;

                //                 case 'two':
                //                     ball_run = "2";
                //                     break;

                //                 case 'three':
                //                     ball_run = "3";
                //                     break;

                //                 case 'four':
                //                     ball_run = "4";
                //                     break;

                //                 case 'five':
                //                     ball_run = "5";
                //                     break;

                //                 case 'six':
                //                     ball_run = "6";
                //                     break;

                //                 case 'wicket':
                //                 case 'catch':
                //                 case 'run out':
                //                     ball_run = scr_runs + "W";
                //                     break;

                //                 case 'wide':
                //                     ball_run = scr_runs + "wd";
                //                     break;

                //                 case 'no_ball':
                //                     ball_run = scr_runs + "nb";
                //                     break;

                //                 case 'leg_bye':
                //                     ball_run = scr_runs + "lb";
                //                     break;

                //                 case 'bye':
                //                     ball_run = scr_runs + "b";
                //                     break;
                //             }

                //             if (last_six_balls.length < 7) {
                //                 last_six_balls.push(ball_run)
                //             }
                //         }
                //     }
                // }

                const score_obj = {
                    match_url: `https://www.news18.com/cricketnext/live-score/${sc.teamfa}-vs-${sc.teamfb}-live-score-${sc.matchCode}.html`.replace(/\s/gm, "-"),

                    match_api_url: req_url,

                    match_status: (sc.status ? sc.status : ''),

                    t1: {
                        f: (sc.teamfa ? sc.teamfa : ""),
                        n: (sc.teama ? sc.teama : ""),
                    },

                    t2: {
                        f: (sc.teamfb ? sc.teamfb : ""),
                        n: (sc.teamb ? sc.teamb : ""),
                    },

                    i1: {
                        sc:
                            sc.firstInnings && sc.firstInnings.Equation
                                ? sc.firstInnings.Equation.Total
                                : "0",
                        wk:
                            sc.firstInnings && sc.firstInnings.Equation
                                ? sc.firstInnings.Equation.Wickets
                                : "0",
                        ov:
                            sc.firstInnings && sc.firstInnings.Equation
                                ? sc.firstInnings.Equation.Overs
                                : "0",
                    },

                    i2: {
                        sc:
                            sc.secondInnings && sc.secondInnings.Equation
                                ? sc.secondInnings.Equation.Total
                                : "0",
                        wk:
                            sc.secondInnings && sc.secondInnings.Equation
                                ? sc.secondInnings.Equation.Wickets
                                : "0",
                        ov:
                            sc.secondInnings && sc.secondInnings.Equation
                                ? sc.secondInnings.Equation.Overs
                                : "0",
                    },

                    i3: {
                        sc:
                            sc.thirdInnings && sc.thirdInnings.Equation
                                ? sc.thirdInnings.Equation.Total
                                : "0",
                        wk:
                            sc.thirdInnings && sc.thirdInnings.Equation
                                ? sc.thirdInnings.Equation.Wickets
                                : "0",
                        ov:
                            sc.thirdInnings && sc.thirdInnings.Equation
                                ? sc.thirdInnings.Equation.Overs
                                : "0",
                    },

                    i4: {
                        sc:
                            sc.fourthInnings && sc.fourthInnings.Equation
                                ? sc.fourthInnings.Equation.Total
                                : "0",
                        wk:
                            sc.fourthInnings && sc.fourthInnings.Equation
                                ? sc.fourthInnings.Equation.Wickets
                                : "0",
                        ov:
                            sc.fourthInnings && sc.fourthInnings.Equation
                                ? sc.fourthInnings.Equation.Overs
                                : "0",
                    },

                    cs: {
                        msg: sc.matchresult != null ? sc.matchresult : sc.Toss_mov,
                    },

                    iov: "",

                    p1: batsmen_onstrick.name ? batsmen_onstrick.name : '',

                    p2: batsmen_nonstrick.name ? batsmen_nonstrick.name : '',

                    os: "p1",

                    b1s: `${batsmen_onstrick.Runs},${batsmen_onstrick.BallsFaced},${batsmen_onstrick.four},${batsmen_onstrick.six}`,

                    b2s: `${batsmen_nonstrick.Runs},${batsmen_nonstrick.BallsFaced},${batsmen_nonstrick.four},${batsmen_nonstrick.six}`,

                    bw: live_bowler,

                    pb: "",
                };


                score[`nw18${sc.matchCode.substring(15)}`] = score_obj;
                // console.log(score_obj);

            }));

            res.status(200).json(score);;

        } catch (error) {
            console.log('error -->', error);
            res.status(400).json({ success: false, error: { message: error.message } });
        }

    },
}


module.exports = { TestController };