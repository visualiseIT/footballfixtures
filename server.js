var http = require('http');
var scrap = require('scrap');
var url = require('url');


//var teamsJSON;
var timestamp = 0;
var teams;
var games;

function doScrape() {

    console.log('doScrape');

    teams = [];
    games = [];

    scrap('http://www.bbc.co.uk/sport/football/fixtures', function(err, $) {


        var teamNodes = $('span[class~="teams"]');

        teamNodes.each(function(err, a, b) {
            var teamName = $(a).text().trim();
            if (teams.indexOf(teamName) === -1) {
                teams.push(teamName);
            }
        });



        var fixtures_table = $('div[class~="fixtures-table"]');
        
        var date;
        
        fixtures_table.children().each(function(index, el){
            
            
            if (el.name === "h2")
            {
                date = $(el).text().trim();
            }
            else if (el.name === "table")
            {
                $(el).find('td[class="match-details"]').each(function(index, table)
                {
                                        
                    var hometeam = $(table).find('span[class~="team-home"]').text().trim();
                    var awayteam = $(table).find('span[class~="team-away"]').text().trim();
                    var score = $(table).find('span[class="score"]').text().trim();                                    
                    var time = $(table).next().text().trim();
                   
                    var date_elements = date.split(' ');
                    var date_elements = [date_elements[3],date_elements[2],parseInt(date_elements[1]),time].join(',');
                    var timestamp = (new Date(date_elements)).getTime();
                    games.push({
                        hometeam: hometeam,
                        awayteam: awayteam,
                        score: score,
                        date:date,
                        time: time,
                        timestamp: timestamp
                    });
                    
                    
                });
                
            }
                    
            
        });
        
        
        timestamp = new Date().getTime();


    });
}




doScrape();

function getGames4Team(team)
{
    var games4team = [];
    games.forEach(function(game)
    {
        if (game.hometeam === team || game.hometeam === team)
        {
            games4team.push(game);            
        }
    })
    
    return games4team;
}

http.createServer(function(req, res) {

    res.writeHead(200, {
        'Content-Type': 'text/plain'
    });

    if (timestamp) {

        var timenow = new Date().getTime();
        var diff = timenow - timestamp;
        if (diff > (1000 * 60 * 5)) {

            doScrape();

        }

        var url_parts = url.parse(req.url);

        if (url_parts.pathname === "/teams") {

            var return_json = {
                status: "success",
                data: {
                    "teams": teams
                }
            }

            return_json = JSON.stringify(return_json);
            res.end(return_json);
        }
        else if (url_parts.pathname === "/games") {
            
            var return_json = {
                status: "success",
                data: {
                    "games": games
                }
            }

            return_json = JSON.stringify(return_json);
            res.end(return_json);
        }
        else if (url_parts.pathname.match("^/games")) {
            
            var team = url_parts.pathname.split("/").pop();
            
            var games4team = getGames4Team(team);
            
            var return_json = {
                status: "success",
                data: {
                    "games": games4team
                }
            }

            return_json = JSON.stringify(return_json);
            res.end(return_json);
        }
        
        //res.end(teamsJSON);

    }
    else {
        res.end("Loading...");
    }


}).listen(process.env.PORT);
