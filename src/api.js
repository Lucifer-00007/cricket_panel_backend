"use strict";
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const cheerio = require('cheerio');

//Convert unix to local_date_time_obj
const formatDateTime = (unix) => {
    const local_dt = new Date(unix);
    return local_dt.toLocaleString()
}

//Convert ISO_date_time to unix
const localISOToUnix = (iso) => {
    var unix_dt = new Date(iso)
    unix_dt = Math.floor(unix_dt.getTime())
    return unix_dt
}


//Match_status filter and capitalize
const statusFilter = (val) => {
    if (val == 'Complete') {
        return 'Post';
    } else if (val == 'Preview' || val == 'Match Yet To Begin') {
        return "Pre"
    } else if (val == 'In Progress' || val == 'Play In Progress') {
        return "Live"
    } else {
        return val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
    }
}


function createCbzInnList(inningsScoreList) {
    const result = {};

    // First, initialize all 4 innings with default values
    for (let i = 1; i <= 4; i++) {
        result[`i${i}`] = {
            sc: '0',
            wk: '0',
            ov: '0',
            inningsId: i,
        };
    }

    // Then, update with actual data if available
    inningsScoreList.forEach((innings) => {
        const key = `i${innings.inningsId}`;

        result[key] = {
            sc: innings.score.toString() || '0',
            wk: innings.wickets.toString() || '0',
            ov: innings.overs.toString() || '0',
            inningsId: innings.inningsId,
        };
    });
    return result;
}

function CbzTeamNameOrder(team1, team2, checkTeam) {
    let t1 = {
        f: team2.name,
        n: team2.shortName
    };

    let t2 = {
        f: team1.name,
        n: team1.shortName
    };

    if (checkTeam && team1.id === checkTeam.battingTeamId) {
        t1 = {
            f: team1.name,
            n: team1.shortName
        };
        t2 = {
            f: team2.name,
            n: team2.shortName
        };
    }

    return { t1, t2 };
}

const ScoreController = {
    // cricbuzz
    cricbuzz: async (req, res) => {
        let innerReturnFunction = ({ crickbuzzurls }) => {
            return { crickbuzzurls };
        }

        var requestOptions = {
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
        };

        try {
            var result = {};
            var crickbuzzurls = [];
            fetch(`https://www.cricbuzz.com`, requestOptions).then(res => res.text()).then(chtml => {
                const $ = cheerio.load(chtml);

                // Getting match_ids from carousal                
                var TotalMatch = 0
                const listItems = $("#match_menu_container div div ul li");
                listItems.each((idx, el) => {
                    var id = $(el).children('a').attr('href').split("/")[2];
                    crickbuzzurls.push(`https://www.cricbuzz.com/api/cricket-match/commentary/${id}`);
                    TotalMatch = TotalMatch + 1;
                });

                // Getting match_ids from dropdown
                var OtherTotalMatch = 0
                const newListItems = $(".cb-scg-drp-dwn-ul li div");
                newListItems.each((idx, el) => {
                    var match = $(el).children('a').attr('href');
                    var match_title = $(el).children('a').attr('title');
                    if (typeof (match) != 'undefined') {
                        // Filtering only live match_ids 
                        if (match_title.split('-')[1] == ' Live') {
                            const match_id = match.split("/")[2]
                            const match_api_url = `https://www.cricbuzz.com/api/cricket-match/commentary/${match_id}`;
                            if (!crickbuzzurls.includes(match_api_url)) {
                                crickbuzzurls.push(match_api_url);
                                OtherTotalMatch = OtherTotalMatch + 1;
                            }
                        }
                    }
                });

                return innerReturnFunction({ crickbuzzurls });
            }).then(({ crickbuzzurls }) => {
                if (crickbuzzurls && crickbuzzurls.length > 0) {
                    Promise.all(crickbuzzurls.map(u => fetch(u))).then(responses =>
                        Promise.all(responses.map(res => res.json()))
                    )
                        .then(innerhtmls => {
                            innerhtmls.forEach(innerhtml => {
                                if (innerhtml && innerhtml.miniscore) {
                                    //This score_obj will contain live, upcoming and completed matches
                                    const { i1, i2, i3, i4 } = createCbzInnList(innerhtml.miniscore.matchScoreDetails.inningsScoreList);
                                    const { t1, t2 } = CbzTeamNameOrder(innerhtml.matchHeader.team1, innerhtml.matchHeader.team2, innerhtml.miniscore.matchScoreDetails.matchTeamInfo[0])

                                    const score_obj = {
                                        match_url: `https://www.cricbuzz.com/live-cricket-scorecard/${innerhtml.matchHeader.matchId}/${innerhtml.matchHeader.team1.shortName.toLowerCase()}-vs-${innerhtml.matchHeader.team2.shortName.toLowerCase()}-${innerhtml.matchHeader.matchDescription.replace(/\s/gm, "-").toLowerCase()}-${innerhtml.matchHeader.seriesName.replace(/(\s)|(,\s)/gm, "-").toLowerCase()}`,

                                        match_api_url: innerhtml.matchHeader.matchId ? `https://www.cricbuzz.com/api/cricket-match/commentary/${innerhtml.matchHeader.matchId}` : '',

                                        start_date_time: innerhtml.matchHeader.matchStartTimestamp ? innerhtml.matchHeader.matchStartTimestamp : '',

                                        match_league: innerhtml.matchHeader.seriesDesc ? innerhtml.matchHeader.seriesDesc : '',

                                        completed: innerhtml.matchHeader.complete ? innerhtml.matchHeader.complete : '',

                                        runrate: innerhtml.miniscore.currentRunRate ? innerhtml.miniscore.currentRunRate : '',

                                        requiredRunRate: innerhtml.miniscore.requiredRunRate ? innerhtml.miniscore.requiredRunRate : '',

                                        match_status: innerhtml.matchHeader.state ? statusFilter(innerhtml.matchHeader.state) : '',

                                        current_inns: (innerhtml.miniscore.inningsId ? innerhtml.miniscore.inningsId : ''),

                                        t1,

                                        t2,

                                        i1,

                                        i2,

                                        i3,

                                        i4,

                                        cs: {
                                            msg: innerhtml.miniscore.status ? innerhtml.miniscore.status : '',
                                        },
                                        iov: '',
                                        p1: innerhtml.miniscore.batsmanStriker
                                            ? innerhtml.miniscore.batsmanStriker.batName
                                            : '',
                                        p2: innerhtml.miniscore.batsmanNonStriker
                                            ? innerhtml.miniscore.batsmanNonStriker.batName
                                            : '',
                                        os: 'p1',
                                        b1s: `${innerhtml.miniscore.batsmanStriker
                                            ? innerhtml.miniscore.batsmanStriker.batRuns
                                            : 0
                                            },${innerhtml.miniscore.batsmanStriker
                                                ? innerhtml.miniscore.batsmanStriker.batBalls
                                                : 0
                                            },${innerhtml.miniscore.batsmanStriker
                                                ? innerhtml.miniscore.batsmanStriker.batFours
                                                : 0
                                            },${innerhtml.miniscore.batsmanStriker
                                                ? innerhtml.miniscore.batsmanStriker.batSixes
                                                : 0
                                            }`,
                                        b2s: `${innerhtml.miniscore.batsmanNonStriker
                                            ? innerhtml.miniscore.batsmanNonStriker.batRuns
                                            : 0
                                            },${innerhtml.miniscore.batsmanNonStriker
                                                ? innerhtml.miniscore.batsmanNonStriker.batBalls
                                                : 0
                                            },${innerhtml.miniscore.batsmanNonStriker
                                                ? innerhtml.miniscore.batsmanNonStriker.batFours
                                                : 0
                                            },${innerhtml.miniscore.batsmanNonStriker
                                                ? innerhtml.miniscore.batsmanNonStriker.batSixes
                                                : 0
                                            }`,
                                        bw: innerhtml.miniscore.bowlerStriker
                                            ? innerhtml.miniscore.bowlerStriker.bowlName
                                            : '',

                                        bws: {
                                            bw1_id: innerhtml.miniscore.bowlerStriker ? innerhtml.miniscore.bowlerStriker.bowlId : '',
                                            bw1_n: innerhtml.miniscore.bowlerStriker ? innerhtml.miniscore.bowlerStriker.bowlName : '',
                                            bw1_r: innerhtml.miniscore.bowlerStriker ? innerhtml.miniscore.bowlerStriker.bowlRuns : '',
                                            bw1_w: innerhtml.miniscore.bowlerStriker ? innerhtml.miniscore.bowlerStriker.bowlWkts : '',
                                            bw1_o: innerhtml.miniscore.bowlerStriker ? innerhtml.miniscore.bowlerStriker.bowlOvs : '',
                                            bw1_e: innerhtml.miniscore.bowlerStriker ? innerhtml.miniscore.bowlerStriker.bowlEcon : '',
                                            bw1_m: innerhtml.miniscore.bowlerStriker ? innerhtml.miniscore.bowlerStriker.bowlMaidens : '',
                                            bw1_nb: innerhtml.miniscore.bowlerStriker ? innerhtml.miniscore.bowlerStriker.bowlNoballs : '',
                                            bw1_w: innerhtml.miniscore.bowlerStriker ? innerhtml.miniscore.bowlerStriker.bowlWides : '',

                                            bw2_id: innerhtml.miniscore.bowlerNonStriker ? innerhtml.miniscore.bowlerNonStriker.bowlId : '',
                                            bw2_n: innerhtml.miniscore.bowlerNonStriker ? innerhtml.miniscore.bowlerNonStriker.bowlName : '',
                                            bw2_r: innerhtml.miniscore.bowlerNonStriker ? innerhtml.miniscore.bowlerNonStriker.bowlRuns : '',
                                            bw2_w: innerhtml.miniscore.bowlerNonStriker ? innerhtml.miniscore.bowlerNonStriker.bowlWkts : '',
                                            bw2_o: innerhtml.miniscore.bowlerNonStriker ? innerhtml.miniscore.bowlerNonStriker.bowlOvs : '',
                                            bw2_e: innerhtml.miniscore.bowlerNonStriker ? innerhtml.miniscore.bowlerNonStriker.bowlEcon : '',
                                            bw2_m: innerhtml.miniscore.bowlerNonStriker ? innerhtml.miniscore.bowlerNonStriker.bowlMaidens : '',
                                            bw2_nb: innerhtml.miniscore.bowlerNonStriker ? innerhtml.miniscore.bowlerNonStriker.bowlNoballs : '',
                                            bw2_w: innerhtml.miniscore.bowlerNonStriker ? innerhtml.miniscore.bowlerNonStriker.bowlWides : '',
                                        },

                                        pb: innerhtml.miniscore.recentOvsStats
                                            .replace(/\|/g, '')
                                            .replace(/  /g, '')
                                            .split(' ')
                                            .toString(),

                                        playersOfTheMatch: {
                                            id: (typeof innerhtml.matchHeader.playersOfTheMatch[0] != 'undefined' ? innerhtml.matchHeader.playersOfTheMatch[0].id : ''),
                                            fullName: (typeof innerhtml.matchHeader.playersOfTheMatch[0] != 'undefined' ? innerhtml.matchHeader.playersOfTheMatch[0].fullName : ''),
                                            captain: (typeof innerhtml.matchHeader.playersOfTheMatch[0] != 'undefined' ? innerhtml.matchHeader.playersOfTheMatch[0].captain : ''),
                                            keeper: (typeof innerhtml.matchHeader.playersOfTheMatch[0] != 'undefined' ? innerhtml.matchHeader.playersOfTheMatch[0].keeper : ''),
                                        },

                                    }
                                    result[innerhtml.matchHeader.matchId] = score_obj;

                                } else if (innerhtml && !innerhtml.miniscore) {
                                    //This score_obj will contain only upcoming matches
                                    const score_obj = {
                                        match_url: `https://www.cricbuzz.com/live-cricket-scorecard/${innerhtml.matchHeader.matchId}/${innerhtml.matchHeader.team1.shortName.toLowerCase()}-vs-${innerhtml.matchHeader.team2.shortName.toLowerCase()}-${innerhtml.matchHeader.matchDescription.replace(/\s/gm, "-").toLowerCase()}-${innerhtml.matchHeader.seriesName.replace(/(\s)|(,\s)/gm, "-").toLowerCase()}`,

                                        match_api_url: innerhtml.matchHeader.matchId ? `https://www.cricbuzz.com/api/cricket-match/commentary/${innerhtml.matchHeader.matchId}` : '',

                                        start_date_time: innerhtml.matchHeader.matchStartTimestamp ? innerhtml.matchHeader.matchStartTimestamp : '',

                                        match_league: innerhtml.matchHeader.seriesDesc ? innerhtml.matchHeader.seriesDesc : '',

                                        completed: innerhtml.matchHeader.complete ? (innerhtml.matchHeader.state != 'Complete' ? innerhtml.matchHeader.state : 'Post') : '',

                                        runrate: '',

                                        requiredRunRate: '',

                                        match_status: innerhtml.matchHeader.state ? statusFilter(innerhtml.matchHeader.state) : '',

                                        current_inns: '',

                                        t1: {
                                            f: innerhtml.matchHeader.team1.name ? innerhtml.matchHeader.team1.name : '',
                                            n: innerhtml.matchHeader.team1.shortName ? innerhtml.matchHeader.team1.shortName : '',
                                        },

                                        t2: {
                                            f: innerhtml.matchHeader.team2.name ? innerhtml.matchHeader.team2.name : '',
                                            n: innerhtml.matchHeader.team2.shortName ? innerhtml.matchHeader.team2.shortName : '',
                                        },

                                        i1: {
                                            sc: '0',

                                            wk: '0',

                                            ov: '0',
                                        },

                                        i2: {
                                            sc: '0',

                                            wk: '0',

                                            ov: '0',

                                            tr: '0',
                                        },

                                        i3: {
                                            sc: '0',

                                            wk: '0',

                                            ov: '0',
                                        },

                                        i4: {
                                            sc: '0',

                                            wk: '0',

                                            ov: '0',
                                        },

                                        cs: {
                                            msg: `Match will start at ${formatDateTime(innerhtml.matchHeader.matchStartTimestamp)}`,
                                        },
                                        iov: '',
                                        p1: '',
                                        p2: '',
                                        os: '',
                                        b1s: `${0, 0, 0, 0}`,
                                        b2s: `${0, 0, 0, 0}`,
                                        bw: '',

                                        bws: {
                                            bw1_id: '',
                                            bw1_n: '',
                                            bw1_r: '',
                                            bw1_w: '',
                                            bw1_o: '',
                                            bw1_e: '',
                                            bw1_m: '',
                                            bw1_nb: '',
                                            bw1_w: '',

                                            bw2_id: '',
                                            bw2_n: '',
                                            bw2_r: '',
                                            bw2_w: '',
                                            bw2_o: '',
                                            bw2_e: '',
                                            bw2_m: '',
                                            bw2_nb: '',
                                            bw2_w: '',
                                        },

                                        pb: '',

                                        playersOfTheMatch: {
                                            id: (typeof innerhtml.matchHeader.playersOfTheMatch[0] != 'undefined' ? innerhtml.matchHeader.playersOfTheMatch[0].id : ''),
                                            fullName: (typeof innerhtml.matchHeader.playersOfTheMatch[0] != 'undefined' ? innerhtml.matchHeader.playersOfTheMatch[0].fullName : ''),
                                            captain: (typeof innerhtml.matchHeader.playersOfTheMatch[0] != 'undefined' ? innerhtml.matchHeader.playersOfTheMatch[0].captain : ''),
                                            keeper: (typeof innerhtml.matchHeader.playersOfTheMatch[0] != 'undefined' ? innerhtml.matchHeader.playersOfTheMatch[0].keeper : ''),
                                        },

                                    }
                                    result[innerhtml.matchHeader.matchId] = score_obj;
                                }
                            });
                            res.status(200).json(result);
                        })
                }
            });
        } catch (error) {
            console.log('error ----->', error);
            res.status(400).json({ success: false, error: { message: error.message } });

        }

        // res.status(200).json({ status: true, res: 'This is a test message!' });
    },

    // sportskeeda
    sportskeeda: async (req, res) => {
        var score = {};

        const requestOptions = {
            "credentials": "omit",
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

        try {
            const response = await fetch(
                "https://push.sportskeeda.com/get-cricket-matches/featured",
                requestOptions
            );

            const response_data = await response.json();
            await Promise.allSettled(response_data.matches.map(async (data, key) => {
                var converted = data.link.replace(
                    "www.sportskeeda.com",
                    "cmc.sportskeeda.com"
                );

                converted = `${converted}/ajax?lang=en`
                const match_response = await fetch(converted);
                const sc = await match_response.json();
                if (sc.commentary && sc.commentary.length > 0) {
                    var last_six_balls = [];
                    var ball_run = '---'

                    for (let scr of sc.commentary) {
                        if (scr.opta_ball_type != undefined && scr.opta_ball_type != 'end of over') {

                            var scr_runs = (scr.runs != undefined ? scr.runs : '')

                            switch (scr.opta_ball_type) {
                                case 'normal':
                                    ball_run = (scr.runs != undefined ? scr.runs : '0');
                                    break;

                                case 'one':
                                    ball_run = "1";
                                    break;

                                case 'two':
                                    ball_run = "2";
                                    break;

                                case 'three':
                                    ball_run = "3";
                                    break;

                                case 'four':
                                    ball_run = "4";
                                    break;

                                case 'five':
                                    ball_run = "5";
                                    break;

                                case 'six':
                                    ball_run = "6";
                                    break;

                                case 'wicket':
                                case 'catch':
                                case 'run out':
                                    ball_run = scr_runs + "W";
                                    break;

                                case 'wide':
                                    ball_run = scr_runs + "wd";
                                    break;

                                case 'no_ball':
                                    ball_run = scr_runs + "nb";
                                    break;

                                case 'leg_bye':
                                    ball_run = scr_runs + "lb";
                                    break;

                                case 'bye':
                                    ball_run = scr_runs + "b";
                                    break;
                            }

                            if (last_six_balls.length < 7) {
                                last_six_balls.push(ball_run)
                            }
                        }
                    }
                }

                const score_obj = {
                    match_url: `https://www.sportskeeda.com/live-cricket-score/${sc.topic_slug}`,

                    match_api_url: converted ? converted : '',

                    start_date_time: sc.datetime ? sc.datetime : '',

                    match_status: (sc.match_status ? statusFilter(sc.match_status) : ''),

                    t1: {
                        f: sc.score_strip[0].name ? sc.score_strip[0].name : '',
                        n: sc.score_strip[0].short_name ? sc.score_strip[0].short_name : '',
                    },

                    t2: {
                        f: sc.score_strip[1].name ? sc.score_strip[1].name : '',
                        n: sc.score_strip[1].short_name ? sc.score_strip[1].short_name : '',
                    },
                    i1: {
                        sc:
                            sc.score_strip && sc.score_strip[0].score != ""
                                ? sc.score_strip[0].score.split("(")[0].split("/")[0].trim()
                                : "0",
                        wk:
                            sc.score_strip && sc.score_strip[0].score != ""
                                ? sc.score_strip[0].score.split("(")[0].split("/")[1].trim()
                                : "0",
                        ov:
                            sc.score_strip && sc.score_strip[0].score != ""
                                ? sc.score_strip[0].score.split("(")[1].split(" ")[0].trim()
                                : "0",
                    },

                    i2: {
                        sc:
                            sc.score_strip && sc.score_strip[1].score != ""
                                ? sc.score_strip[1].score.split("(")[0].split("/")[0].trim()
                                : "0",
                        wk:
                            sc.score_strip && sc.score_strip[1].score != ""
                                ? sc.score_strip[1].score.split("(")[0].split("/")[1].trim()
                                : "0",
                        ov:
                            sc.score_strip && sc.score_strip[1].score != ""
                                ? sc.score_strip[1].score.split("(")[1].split(" ")[0].trim()
                                : "0",
                    },

                    i3: {
                        sc: "0",
                        wk: "0",
                        ov: "0",
                    },

                    i4: {
                        sc: "0",
                        wk: "0",
                        ov: "0",
                    },

                    cs: {
                        msg: sc.info && sc.info != ''
                            ? sc.info
                            : (sc.secondary_info ? sc.secondary_info : ""),
                    },

                    iov: "",

                    p1:
                        sc.now_batting && sc.now_batting.b1 && sc.now_batting.b1.name
                            ? sc.now_batting.b1.name
                            : "",

                    p2:
                        sc.now_batting && sc.now_batting.b2 && sc.now_batting.b2.name
                            ? sc.now_batting.b2.name
                            : "",

                    os: "p1",

                    b1s: `${sc.now_batting && sc.now_batting.b1 && sc.now_batting.b1.stats
                        ? (sc.now_batting.b1.stats.runs === '' ? '0' : sc.now_batting.b1.stats.runs)
                        : "0"
                        },${sc.now_batting && sc.now_batting.b1 && sc.now_batting.b1.stats
                            ? (sc.now_batting.b1.stats.balls === '' ? '0' : sc.now_batting.b1.stats.balls)
                            : "0"
                        },${sc.now_batting && sc.now_batting.b1 && sc.now_batting.b1.stats
                            ? (sc.now_batting.b1.stats.fours === '' ? '0' : sc.now_batting.b1.stats.fours)
                            : "0"
                        },${sc.now_batting && sc.now_batting.b1 && sc.now_batting.b1.stats
                            ? (sc.now_batting.b1.stats.sixes === '' ? '0' : sc.now_batting.b1.stats.sixes)
                            : "0"
                        }`,

                    b2s: `${sc.now_batting && sc.now_batting.b2 && sc.now_batting.b2.stats != ''
                        ? sc.now_batting.b2.stats.runs
                        : "0"
                        },${sc.now_batting && sc.now_batting.b2 && sc.now_batting.b2.stats
                            ? sc.now_batting.b2.stats.balls
                            : "0"
                        },${sc.now_batting && sc.now_batting.b2 && sc.now_batting.b2.stats
                            ? sc.now_batting.b2.stats.fours
                            : "0"
                        },${sc.now_batting && sc.now_batting.b2 && sc.now_batting.b2.stats
                            ? sc.now_batting.b2.stats.sixes
                            : "0"
                        }`,

                    bw: sc.now_bowling ? sc.now_bowling.b1.name : "",


                    pb: (last_six_balls && last_six_balls.length > 0 ?
                        `${(last_six_balls.length > 5 ? last_six_balls[0] : '')
                        },${(last_six_balls.length > 4 ? last_six_balls[1] : '')
                        },${(last_six_balls.length > 3 ? last_six_balls[2] : '')
                        },${(last_six_balls.length > 2 ? last_six_balls[3] : '')
                        },${(last_six_balls.length > 1 ? last_six_balls[4] : '')
                        },${(last_six_balls.length > 0 ? last_six_balls[5] : '')
                        }` : ''),
                };

                score[sc.match_id] = score_obj;

            }));

            res.status(200).json(score);;

        } catch (error) {
            console.log('error -->', error);
            res.status(400).json({ success: false, error: { message: error.message } });

        }

    },

    // espn
    espn: async (req, res) => {
        const requestOptions1 = {
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
                "Sec-Fetch-User": "?1"
            },
            "method": "GET",
            "mode": "cors"
        }

        var finall_result = {};

        try {
            const response = await fetch(
                "https://hs-consumer-api.espncricinfo.com/v1/pages/matches/current",
                requestOptions1
            )
            const response_data = await response.json()
            await Promise.allSettled(response_data.matches.map(async (val) => {
                const req_url = `https://hs-consumer-api.espncricinfo.com/v1/pages/match/scorecard?lang=en&seriesId=1&matchId=${val.objectId}`;

                const match_response = await fetch(req_url, requestOptions2)
                const score_data = await match_response.json();

                const match_details = score_data.match;
                const match_content = score_data.content;

                if (typeof match_content != "undefined" && typeof match_details != "undefined") {

                    // Get_Current_Batsmens
                    if (match_content.innings && match_content.innings != null) {

                        // Get_Live_Innings
                        const current_inns = match_details.liveInning != null
                            ? match_details.liveInning * 1
                            : 0;

                        // Get_Live_Innings_Batters
                        const batsmens = match_content
                            ? match_content.innings.length > 0
                                ? match_content.innings[current_inns - 1]
                                    .inningBatsmen
                                : ""
                            : "";
                        var current_batsmen_onstrick = "";
                        var current_batsmen_nonstrick = "";
                        var batsmen_onstrick_details = [];
                        var batsmen_nonstrick_details = [];

                        if (batsmens !== "") {
                            batsmens.map(async (batsmen) => {
                                // Current_Batsmen_Onstrick
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

                                // Current_Batsmen_Nonstrick
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

                    // Last_6_Balls
                    if (match_content.supportInfo.liveSummary != null) {
                        var ball_run = "";
                        var last_6_balls_req = [];

                        const last_6_balls_full =
                            match_content.supportInfo.liveSummary.recentBalls.slice(0, 6);

                        last_6_balls_full.map(async (ball) => {

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
                        })
                    }

                    const obj = {
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

                        match_api_url: req_url ? req_url : '',

                        start_date_time: match_details.startTime
                            ? localISOToUnix(match_details.startTime)
                            : "",

                        match_status: match_details.state ? statusFilter(match_details.state) : "",


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

                        cs: {
                            msg: match_details.statusText ? match_details.statusText : '',
                            ts: "",
                        },


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

                        os: 'p1',

                        b1s: batsmen_onstrick_details
                            ? batsmen_onstrick_details.toString()
                            : "",
                        b2s: batsmen_nonstrick_details
                            ? batsmen_nonstrick_details.toString()
                            : "",

                        bw:
                            match_content.supportInfo.liveSummary != null
                                ? match_content.supportInfo.liveSummary.bowlers.length > 0
                                    ? match_content.supportInfo.liveSummary.bowlers[0].player
                                        .longName
                                    : ""
                                : "",

                        pb: last_6_balls_req
                            ? last_6_balls_req.toString()
                            : "",

                        title: match_details.slug ? match_details.slug : "",

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
                    };

                    finall_result[req_url.split("&matchId=")[1]] = obj;
                }
            }));
            res.status(200).json(finall_result);
        } catch (error) {
            console.log('error -->', error);
            res.status(400).json({ success: false, error: { message: error.message } });
        }
    },

    // nw18
    nw18: async (req, res) => {
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

                // Get_Live_Innings
                var live_innings = '';
                if (sc.fourthInnings.status === 1) {
                    live_innings = sc.fourthInnings;
                } else if (sc.thirdInnings.status === 1) {
                    live_innings = sc.thirdInnings;
                } else if (sc.secondInnings.status === 1) {
                    live_innings = sc.secondInnings;
                } else if (sc.firstInnings.status === 1) {
                    live_innings = sc.firstInnings;
                }

                // Get Live_Batsmens & Live_Bowler
                var batsmen_onstrick = '';
                var batsmen_nonstrick = '';
                var live_bowler = '';
                if (live_innings != '' && live_innings.status === 1) {
                    // For Batsmen
                    if (live_innings.livePlayers.BatsMan[0].Striker === "yes") {
                        batsmen_onstrick = live_innings.livePlayers.BatsMan[0];
                        batsmen_nonstrick = live_innings.livePlayers.BatsMan[1];
                    } else {
                        batsmen_onstrick = live_innings.livePlayers.BatsMan[1];
                        batsmen_nonstrick = live_innings.livePlayers.BatsMan[0];

                    }
                    // For Bowler
                    if (live_innings.livePlayers.Bowler[0].Bowling === "yes") {
                        live_bowler = live_innings.livePlayers.Bowler[0].name;
                    } else {
                        live_bowler = live_innings.livePlayers.Bowler[1].name;
                    }
                }

                const score_obj = {
                    match_url: `https://www.news18.com/cricketnext/live-score/${sc.teamfa}-vs-${sc.teamfb}-live-score-${sc.matchCode}.html`.replace(/\s/gm, "-"),

                    match_api_url: req_url ? req_url : '',

                    start_date_time: '',

                    match_status: (sc.status ? statusFilter(sc.status) : ''),

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

                    bw: live_bowler ? live_bowler : '',

                    pb: "",
                };

                score[`nw18${sc.matchCode.substring(15)}`] = score_obj;

            }));

            res.status(200).json(score);

        } catch (error) {
            console.log('error -->', error);
            res.status(400).json({ success: false, error: { message: error.message } });
        }

    },

    // cricketlineguru
    cricketlineguru: async (req, res) => {
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

        try {
            const response = await fetch(
                `https://api.commentaryapi.com/api/v2/match/recent/web`,
                requestOptions
            );
            const response_data = await response.json();
            // console.log(response_data);
            if (response_data && response_data.res.matches) {
                await Promise.allSettled(response_data.res.matches.map(async (val) => {
                    const scorecard_url = `https://api.commentaryapi.com/api/v1/match/${val.key}/scorecard`;
                    const match_response = await fetch(scorecard_url, requestOptions);
                    const scorecard = await match_response.json();
                    const req_detail = scorecard.res;

                    if (req_detail.status === 'Live') {
                        var batsmens = [];
                        var live_bowler = '';
                        if (req_detail.inn_order && req_detail.inn_order.length > 0) {
                            // Get Live_Batsmens
                            req_detail.inn_order.slice(-1)[0].batting.map((batsmen) => {
                                if (!batsmen.batting.dismissed) {
                                    batsmens.push(batsmen)
                                }
                            })

                            // Get Live_Bowler
                            req_detail.inn_order.slice(-1)[0].bowling.map((bowler) => {
                                if (bowler.bowling.ov.split('.')[1] * 1 != 0) {
                                    live_bowler = bowler.name;
                                }
                            })
                        }

                        const score_obj = {
                            match_url: `https://www.cricketlineguru.com/match-detail/${val.key}/score`,

                            match_api_url: scorecard_url ? scorecard_url : '',

                            start_date_time: '',

                            match_status: req_detail.status ? statusFilter(req_detail.status) : "",

                            liveInning: req_detail.inn_order.length > 0 ? req_detail.inn_order.length : "",

                            iov: req_detail.format == 'T20' ? '20' : (req_detail.format == 'ODI' ? '50' : (req_detail.format == 'Test' ? '100' : '')),

                            t1: {
                                f: req_detail.teams.t1.name,
                                n: req_detail.teams.t1.sName && req_detail.teams.t1.sName.length < 6 ? req_detail.teams.t1.sName : req_detail.teams.t1.name.substr(0, 3).toLowerCase(),
                            },

                            t2: {
                                f: req_detail.teams.t2.name,
                                n: req_detail.teams.t2.sName && req_detail.teams.t2.sName.length < 6 ? req_detail.teams.t2.sName : req_detail.teams.t2.name.substr(0, 3).toLowerCase(),
                            },

                            i1: {
                                sc:
                                    req_detail.inn_order.length > 0
                                        ? req_detail.inn_order[0].team_info.runs
                                        : "0",
                                wk:
                                    req_detail.inn_order.length > 0
                                        ? req_detail.inn_order[0].team_info.wkts
                                        : "0",
                                ov:
                                    req_detail.inn_order.length > 0
                                        ? req_detail.inn_order[0].team_info.ov
                                        : "0",
                                rt: "",
                            },

                            i2: {
                                sc:
                                    req_detail.inn_order.length > 1
                                        ? req_detail.inn_order[1].team_info.runs
                                        : "0",
                                wk:
                                    req_detail.inn_order.length > 1
                                        ? req_detail.inn_order[1].team_info.wkts
                                        : "0",
                                ov:
                                    req_detail.inn_order.length > 1
                                        ? req_detail.inn_order[1].team_info.ov
                                        : "0",
                                rt: "",
                            },

                            i3: {
                                sc:
                                    req_detail.inn_order.length > 2
                                        ? req_detail.inn_order[2].team_info.runs
                                        : "0",
                                wk:
                                    req_detail.inn_order.length > 2
                                        ? req_detail.inn_order[2].team_info.wkts
                                        : "0",
                                ov:
                                    req_detail.inn_order.length > 2
                                        ? req_detail.inn_order[2].team_info.ov
                                        : "0",
                            },

                            i4: {
                                sc:
                                    req_detail.inn_order.length > 3
                                        ? req_detail.inn_order[3].team_info.runs
                                        : "0",
                                wk:
                                    req_detail.inn_order.length > 3
                                        ? req_detail.inn_order[3].team_info.wkts
                                        : "0",
                                ov:
                                    req_detail.inn_order.length > 3
                                        ? req_detail.inn_order[3].team_info.ov
                                        : "0",
                            },

                            cs: {
                                msg: req_detail.result ? req_detail.result.message : '',
                            },

                            p1: batsmens.length > 0 ? batsmens[0].name : '',

                            p2: batsmens.length > 1 ? batsmens[1].name : '',

                            os: "",

                            b1s: batsmens.length > 0
                                ? `${batsmens[0].batting.runs},${batsmens[0].batting.balls},${batsmens[0].batting._4s},${batsmens[0].batting._6s}`
                                : '',

                            b2s: batsmens.length > 1
                                ? `${batsmens[1].batting.runs},${batsmens[1].batting.balls},${batsmens[1].batting._4s},${batsmens[1].batting._6s}`
                                : '',

                            bw: live_bowler ? live_bowler : '',

                            pb: '',

                        };

                        score[`clg_${req_detail.teams.t1.key}${req_detail.teams.t2.key}`] = score_obj
                    }
                }))

                res.status(200).json(score);
            }
        } catch (e) {
            console.log('err', e);
            res.status(400).json({ success: false, error: { message: error.message } });
        }


    },

}

module.exports = { ScoreController };


