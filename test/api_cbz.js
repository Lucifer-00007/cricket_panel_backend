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

                                    t1: {
                                        f: innerhtml.matchHeader.team1.id == innerhtml.miniscore.batTeam.teamId ? innerhtml.matchHeader.team1.name : innerhtml.matchHeader.team2.name,
                                        n: innerhtml.matchHeader.team1.id == innerhtml.miniscore.batTeam.teamId ? innerhtml.matchHeader.team1.shortName : innerhtml.matchHeader.team2.shortName,
                                    },

                                    t2: {
                                        f: innerhtml.matchHeader.team1.id == innerhtml.miniscore.batTeam.teamId ? innerhtml.matchHeader.team2.name : innerhtml.matchHeader.team1.name,
                                        n: innerhtml.matchHeader.team1.id == innerhtml.miniscore.batTeam.teamId ? innerhtml.matchHeader.team2.shortName : innerhtml.matchHeader.team1.shortName,
                                    },

                                    i1: {
                                        sc: innerhtml.miniscore.batTeam.teamScore ? innerhtml.miniscore.batTeam.teamScore.toString() : '0',

                                        wk: innerhtml.miniscore.batTeam.teamWkts ? innerhtml.miniscore.batTeam.teamWkts.toString() : '0',

                                        ov: innerhtml.miniscore.matchScoreDetails.inningsScoreList.length < 1 ? '0' : (innerhtml.miniscore.matchScoreDetails.inningsScoreList.length > 0 && innerhtml.miniscore.matchScoreDetails.inningsScoreList[0].batTeamId == innerhtml.miniscore.batTeam.teamId && innerhtml.miniscore.matchScoreDetails.inningsScoreList[0].inningsId == 1 ? innerhtml.miniscore.matchScoreDetails.inningsScoreList[0].overs.toString() : (innerhtml.miniscore.matchScoreDetails.inningsScoreList.length > 1 && innerhtml.miniscore.matchScoreDetails.inningsScoreList[1].batTeamId == innerhtml.miniscore.batTeam.teamId && innerhtml.miniscore.matchScoreDetails.inningsScoreList[1].inningsId == 1 ? innerhtml.miniscore.matchScoreDetails.inningsScoreList[1].overs.toString() : (innerhtml.miniscore.matchScoreDetails.inningsScoreList.length > 2 && innerhtml.miniscore.matchScoreDetails.inningsScoreList[2].batTeamId == innerhtml.miniscore.batTeam.teamId && innerhtml.miniscore.matchScoreDetails.inningsScoreList[2].inningsId == 1 ? innerhtml.miniscore.matchScoreDetails.inningsScoreList[2].overs.toString() : (innerhtml.miniscore.matchScoreDetails.inningsScoreList.length > 3 && innerhtml.miniscore.matchScoreDetails.inningsScoreList[3].batTeamId == innerhtml.miniscore.batTeam.teamId && innerhtml.miniscore.matchScoreDetails.inningsScoreList[3].inningsId == 1 ? innerhtml.miniscore.matchScoreDetails.inningsScoreList[3].overs.toString() : '0')))),
                                    },

                                    i2: {
                                        sc: innerhtml.miniscore.matchScoreDetails.inningsScoreList.length < 1 ? '0' : (innerhtml.miniscore.matchScoreDetails.inningsScoreList.length > 0 && innerhtml.miniscore.matchScoreDetails.inningsScoreList[0].batTeamId != innerhtml.miniscore.batTeam.teamId && innerhtml.miniscore.matchScoreDetails.inningsScoreList[0].inningsId == 2 ? innerhtml.miniscore.matchScoreDetails.inningsScoreList[0].score.toString() : (innerhtml.miniscore.matchScoreDetails.inningsScoreList.length > 1 && innerhtml.miniscore.matchScoreDetails.inningsScoreList[1].batTeamId != innerhtml.miniscore.batTeam.teamId && innerhtml.miniscore.matchScoreDetails.inningsScoreList[1].inningsId == 2 ? innerhtml.miniscore.matchScoreDetails.inningsScoreList[1].score.toString() : (innerhtml.miniscore.matchScoreDetails.inningsScoreList.length > 2 && innerhtml.miniscore.matchScoreDetails.inningsScoreList[2].batTeamId != innerhtml.miniscore.batTeam.teamId && innerhtml.miniscore.matchScoreDetails.inningsScoreList[2].inningsId == 2 ? innerhtml.miniscore.matchScoreDetails.inningsScoreList[2].score.toString() : (innerhtml.miniscore.matchScoreDetails.inningsScoreList.length > 3 && innerhtml.miniscore.matchScoreDetails.inningsScoreList[3].batTeamId != innerhtml.miniscore.batTeam.teamId && innerhtml.miniscore.matchScoreDetails.inningsScoreList[3].inningsId == 2 ? innerhtml.miniscore.matchScoreDetails.inningsScoreList[3].score.toString() : '0')))),

                                        wk: innerhtml.miniscore.matchScoreDetails.inningsScoreList.length < 1 ? '0' : (innerhtml.miniscore.matchScoreDetails.inningsScoreList.length > 0 && innerhtml.miniscore.matchScoreDetails.inningsScoreList[0].batTeamId != innerhtml.miniscore.batTeam.teamId && innerhtml.miniscore.matchScoreDetails.inningsScoreList[0].inningsId == 2 ? innerhtml.miniscore.matchScoreDetails.inningsScoreList[0].wickets.toString() : (innerhtml.miniscore.matchScoreDetails.inningsScoreList.length > 1 && innerhtml.miniscore.matchScoreDetails.inningsScoreList[1].batTeamId != innerhtml.miniscore.batTeam.teamId && innerhtml.miniscore.matchScoreDetails.inningsScoreList[1].inningsId == 2 ? innerhtml.miniscore.matchScoreDetails.inningsScoreList[1].wickets.toString() : (innerhtml.miniscore.matchScoreDetails.inningsScoreList.length > 2 && innerhtml.miniscore.matchScoreDetails.inningsScoreList[2].batTeamId != innerhtml.miniscore.batTeam.teamId && innerhtml.miniscore.matchScoreDetails.inningsScoreList[2].inningsId == 2 ? innerhtml.miniscore.matchScoreDetails.inningsScoreList[2].wickets.toString() : (innerhtml.miniscore.matchScoreDetails.inningsScoreList.length > 3 && innerhtml.miniscore.matchScoreDetails.inningsScoreList[3].batTeamId != innerhtml.miniscore.batTeam.teamId && innerhtml.miniscore.matchScoreDetails.inningsScoreList[3].inningsId == 2 ? innerhtml.miniscore.matchScoreDetails.inningsScoreList[3].wickets.toString() : '0')))),

                                        ov: innerhtml.miniscore.matchScoreDetails.inningsScoreList.length < 1 ? '0' : (innerhtml.miniscore.matchScoreDetails.inningsScoreList.length > 0 && innerhtml.miniscore.matchScoreDetails.inningsScoreList[0].batTeamId != innerhtml.miniscore.batTeam.teamId && innerhtml.miniscore.matchScoreDetails.inningsScoreList[0].inningsId == 2 ? innerhtml.miniscore.matchScoreDetails.inningsScoreList[0].overs.toString() : (innerhtml.miniscore.matchScoreDetails.inningsScoreList.length > 1 && innerhtml.miniscore.matchScoreDetails.inningsScoreList[1].batTeamId != innerhtml.miniscore.batTeam.teamId && innerhtml.miniscore.matchScoreDetails.inningsScoreList[1].inningsId == 2 ? innerhtml.miniscore.matchScoreDetails.inningsScoreList[1].overs.toString() : (innerhtml.miniscore.matchScoreDetails.inningsScoreList.length > 2 && innerhtml.miniscore.matchScoreDetails.inningsScoreList[2].batTeamId != innerhtml.miniscore.batTeam.teamId && innerhtml.miniscore.matchScoreDetails.inningsScoreList[2].inningsId == 2 ? innerhtml.miniscore.matchScoreDetails.inningsScoreList[2].overs.toString() : (innerhtml.miniscore.matchScoreDetails.inningsScoreList.length > 3 && innerhtml.miniscore.matchScoreDetails.inningsScoreList[3].batTeamId != innerhtml.miniscore.batTeam.teamId && innerhtml.miniscore.matchScoreDetails.inningsScoreList[3].inningsId == 2 ? innerhtml.miniscore.matchScoreDetails.inningsScoreList[3].overs.toString() : '0')))),

                                        tr:
                                            innerhtml.miniscore.inningsId == 2 &&
                                                innerhtml.miniscore.matchScoreDetails.inningsScoreList.length > 1
                                                ? (
                                                    innerhtml.miniscore.matchScoreDetails.inningsScoreList[1]
                                                        .score + 1
                                                ).toString()
                                                : '0',
                                    },

                                    i3: {
                                        sc: innerhtml.miniscore.matchScoreDetails.inningsScoreList.length < 1 ? '0' : (innerhtml.miniscore.matchScoreDetails.inningsScoreList.length > 0 && innerhtml.miniscore.matchScoreDetails.inningsScoreList[0].batTeamId == innerhtml.miniscore.batTeam.teamId && innerhtml.miniscore.matchScoreDetails.inningsScoreList[0].inningsId == 3 ? innerhtml.miniscore.matchScoreDetails.inningsScoreList[0].score.toString() : (innerhtml.miniscore.matchScoreDetails.inningsScoreList.length > 1 && innerhtml.miniscore.matchScoreDetails.inningsScoreList[1].batTeamId == innerhtml.miniscore.batTeam.teamId && innerhtml.miniscore.matchScoreDetails.inningsScoreList[1].inningsId == 3 ? innerhtml.miniscore.matchScoreDetails.inningsScoreList[1].score.toString() : (innerhtml.miniscore.matchScoreDetails.inningsScoreList.length > 2 && innerhtml.miniscore.matchScoreDetails.inningsScoreList[2].batTeamId == innerhtml.miniscore.batTeam.teamId && innerhtml.miniscore.matchScoreDetails.inningsScoreList[2].inningsId == 3 ? innerhtml.miniscore.matchScoreDetails.inningsScoreList[2].score.toString() : (innerhtml.miniscore.matchScoreDetails.inningsScoreList.length > 3 && innerhtml.miniscore.matchScoreDetails.inningsScoreList[3].batTeamId == innerhtml.miniscore.batTeam.teamId && innerhtml.miniscore.matchScoreDetails.inningsScoreList[3].inningsId == 3 ? innerhtml.miniscore.matchScoreDetails.inningsScoreList[3].score.toString() : '0')))),

                                        wk: innerhtml.miniscore.matchScoreDetails.inningsScoreList.length < 1 ? '0' : (innerhtml.miniscore.matchScoreDetails.inningsScoreList.length > 0 && innerhtml.miniscore.matchScoreDetails.inningsScoreList[0].batTeamId == innerhtml.miniscore.batTeam.teamId && innerhtml.miniscore.matchScoreDetails.inningsScoreList[0].inningsId == 3 ? innerhtml.miniscore.matchScoreDetails.inningsScoreList[0].wickets.toString() : (innerhtml.miniscore.matchScoreDetails.inningsScoreList.length > 1 && innerhtml.miniscore.matchScoreDetails.inningsScoreList[1].batTeamId == innerhtml.miniscore.batTeam.teamId && innerhtml.miniscore.matchScoreDetails.inningsScoreList[1].inningsId == 3 ? innerhtml.miniscore.matchScoreDetails.inningsScoreList[1].wickets.toString() : (innerhtml.miniscore.matchScoreDetails.inningsScoreList.length > 2 && innerhtml.miniscore.matchScoreDetails.inningsScoreList[2].batTeamId == innerhtml.miniscore.batTeam.teamId && innerhtml.miniscore.matchScoreDetails.inningsScoreList[2].inningsId == 3 ? innerhtml.miniscore.matchScoreDetails.inningsScoreList[2].wickets.toString() : (innerhtml.miniscore.matchScoreDetails.inningsScoreList.length > 3 && innerhtml.miniscore.matchScoreDetails.inningsScoreList[3].batTeamId == innerhtml.miniscore.batTeam.teamId && innerhtml.miniscore.matchScoreDetails.inningsScoreList[3].inningsId == 3 ? innerhtml.miniscore.matchScoreDetails.inningsScoreList[3].wickets.toString() : '0')))),

                                        ov: innerhtml.miniscore.matchScoreDetails.inningsScoreList.length < 1 ? '0' : (innerhtml.miniscore.matchScoreDetails.inningsScoreList.length > 0 && innerhtml.miniscore.matchScoreDetails.inningsScoreList[0].batTeamId == innerhtml.miniscore.batTeam.teamId && innerhtml.miniscore.matchScoreDetails.inningsScoreList[0].inningsId == 3 ? innerhtml.miniscore.matchScoreDetails.inningsScoreList[0].overs.toString() : (innerhtml.miniscore.matchScoreDetails.inningsScoreList.length > 1 && innerhtml.miniscore.matchScoreDetails.inningsScoreList[1].batTeamId == innerhtml.miniscore.batTeam.teamId && innerhtml.miniscore.matchScoreDetails.inningsScoreList[1].inningsId == 3 ? innerhtml.miniscore.matchScoreDetails.inningsScoreList[1].overs.toString() : (innerhtml.miniscore.matchScoreDetails.inningsScoreList.length > 2 && innerhtml.miniscore.matchScoreDetails.inningsScoreList[2].batTeamId == innerhtml.miniscore.batTeam.teamId && innerhtml.miniscore.matchScoreDetails.inningsScoreList[2].inningsId == 3 ? innerhtml.miniscore.matchScoreDetails.inningsScoreList[2].overs.toString() : (innerhtml.miniscore.matchScoreDetails.inningsScoreList.length > 3 && innerhtml.miniscore.matchScoreDetails.inningsScoreList[3].batTeamId == innerhtml.miniscore.batTeam.teamId && innerhtml.miniscore.matchScoreDetails.inningsScoreList[3].inningsId == 3 ? innerhtml.miniscore.matchScoreDetails.inningsScoreList[3].overs.toString() : '0')))),
                                    },

                                    i4: {
                                        sc: innerhtml.miniscore.matchScoreDetails.inningsScoreList.length < 1 ? '0' : (innerhtml.miniscore.matchScoreDetails.inningsScoreList.length > 0 && innerhtml.miniscore.matchScoreDetails.inningsScoreList[0].batTeamId != innerhtml.miniscore.batTeam.teamId && innerhtml.miniscore.matchScoreDetails.inningsScoreList[0].inningsId == 4 ? innerhtml.miniscore.matchScoreDetails.inningsScoreList[0].score.toString() : (innerhtml.miniscore.matchScoreDetails.inningsScoreList.length > 1 && innerhtml.miniscore.matchScoreDetails.inningsScoreList[1].batTeamId != innerhtml.miniscore.batTeam.teamId && innerhtml.miniscore.matchScoreDetails.inningsScoreList[1].inningsId == 4 ? innerhtml.miniscore.matchScoreDetails.inningsScoreList[1].score.toString() : (innerhtml.miniscore.matchScoreDetails.inningsScoreList.length > 2 && innerhtml.miniscore.matchScoreDetails.inningsScoreList[2].batTeamId != innerhtml.miniscore.batTeam.teamId && innerhtml.miniscore.matchScoreDetails.inningsScoreList[2].inningsId == 4 ? innerhtml.miniscore.matchScoreDetails.inningsScoreList[2].score.toString() : (innerhtml.miniscore.matchScoreDetails.inningsScoreList.length > 3 && innerhtml.miniscore.matchScoreDetails.inningsScoreList[3].batTeamId != innerhtml.miniscore.batTeam.teamId && innerhtml.miniscore.matchScoreDetails.inningsScoreList[3].inningsId == 4 ? innerhtml.miniscore.matchScoreDetails.inningsScoreList[3].score.toString() : '0')))),

                                        wk: innerhtml.miniscore.matchScoreDetails.inningsScoreList.length < 1 ? '0' : (innerhtml.miniscore.matchScoreDetails.inningsScoreList.length > 0 && innerhtml.miniscore.matchScoreDetails.inningsScoreList[0].batTeamId != innerhtml.miniscore.batTeam.teamId && innerhtml.miniscore.matchScoreDetails.inningsScoreList[0].inningsId == 4 ? innerhtml.miniscore.matchScoreDetails.inningsScoreList[0].wickets.toString() : (innerhtml.miniscore.matchScoreDetails.inningsScoreList.length > 1 && innerhtml.miniscore.matchScoreDetails.inningsScoreList[1].batTeamId != innerhtml.miniscore.batTeam.teamId && innerhtml.miniscore.matchScoreDetails.inningsScoreList[1].inningsId == 4 ? innerhtml.miniscore.matchScoreDetails.inningsScoreList[1].wickets.toString() : (innerhtml.miniscore.matchScoreDetails.inningsScoreList.length > 2 && innerhtml.miniscore.matchScoreDetails.inningsScoreList[2].batTeamId != innerhtml.miniscore.batTeam.teamId && innerhtml.miniscore.matchScoreDetails.inningsScoreList[2].inningsId == 4 ? innerhtml.miniscore.matchScoreDetails.inningsScoreList[2].wickets.toString() : (innerhtml.miniscore.matchScoreDetails.inningsScoreList.length > 3 && innerhtml.miniscore.matchScoreDetails.inningsScoreList[3].batTeamId != innerhtml.miniscore.batTeam.teamId && innerhtml.miniscore.matchScoreDetails.inningsScoreList[3].inningsId == 4 ? innerhtml.miniscore.matchScoreDetails.inningsScoreList[3].wickets.toString() : '0')))),

                                        ov: innerhtml.miniscore.matchScoreDetails.inningsScoreList.length < 1 ? '0' : (innerhtml.miniscore.matchScoreDetails.inningsScoreList.length > 0 && innerhtml.miniscore.matchScoreDetails.inningsScoreList[0].batTeamId != innerhtml.miniscore.batTeam.teamId && innerhtml.miniscore.matchScoreDetails.inningsScoreList[0].inningsId == 4 ? innerhtml.miniscore.matchScoreDetails.inningsScoreList[0].overs.toString() : (innerhtml.miniscore.matchScoreDetails.inningsScoreList.length > 1 && innerhtml.miniscore.matchScoreDetails.inningsScoreList[1].batTeamId != innerhtml.miniscore.batTeam.teamId && innerhtml.miniscore.matchScoreDetails.inningsScoreList[1].inningsId == 4 ? innerhtml.miniscore.matchScoreDetails.inningsScoreList[1].overs.toString() : (innerhtml.miniscore.matchScoreDetails.inningsScoreList.length > 2 && innerhtml.miniscore.matchScoreDetails.inningsScoreList[2].batTeamId != innerhtml.miniscore.batTeam.teamId && innerhtml.miniscore.matchScoreDetails.inningsScoreList[2].inningsId == 4 ? innerhtml.miniscore.matchScoreDetails.inningsScoreList[2].overs.toString() : (innerhtml.miniscore.matchScoreDetails.inningsScoreList.length > 3 && innerhtml.miniscore.matchScoreDetails.inningsScoreList[3].batTeamId != innerhtml.miniscore.batTeam.teamId && innerhtml.miniscore.matchScoreDetails.inningsScoreList[3].inningsId == 4 ? innerhtml.miniscore.matchScoreDetails.inningsScoreList[3].overs.toString() : '0')))),
                                    },

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
}