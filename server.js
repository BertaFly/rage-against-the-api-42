const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const request = require('request-promise');
var fs = require('fs');

const baseURL = 'https://api.navitia.io/v1/coverage/sandbox/networks/network:RAT:1/routes?depth=3';
const token = '3b036afe-0110-4202-b9ed-99718476c2e0';
let linesData = null;
let parsedStopPoints = {};

const getAllMetroStations =  () => {
  return  request.get({
    url: baseURL,
    headers: {
      'Authorization': token,
    }
  }, (error, response, body) => {
    if (!error && response.statusCode == 200) {
      return body;
     } else {
       console.log(error);
     }
  });
}

main =  () => {
  let data = fs.readFileSync('lines.txt');
  linesData = JSON.parse(data);
  if (linesData == null) {
    const res =  getAllMetroStations();
    linesData = JSON.parse(res).routes;
    linesData.DateUpdated42 = new Date();
    fs.writeFile('lines.txt', JSON.stringify(linesData), function (err) {
      if (err) throw err;
    });
  }

  markAllTransferStops();
  parseOneLineStops();
  parseOneTransferStops();
}

findRoute = (start, finish) => {
    let startPoint = null;
    let finishPoint = null;
    linesData.forEach(line => {
      if (startPoint && finishPoint) return;
      line.stop_points.forEach(stop => {
        if (startPoint && finishPoint) return;
        if (stop.name.toUpperCase().includes(start.toUpperCase()))
        {
          startPoint = stop;
        }
        if (stop.name.toUpperCase().includes(finish.toUpperCase()))
        {
          finishPoint = stop;
        }
      });
    });
  }

markAllTransferStops = () => {
    linesData.forEach(line => {
      line.stop_points.forEach(point => {
        linesData.forEach(lineIn => {
          lineIn.stop_points.forEach(pointIn => {

            if (point.id.slice(0, -1) === pointIn.id.slice(0, -1) && line.id.replace("_R", "") !== lineIn.id.replace("_R", ""))
            {
              point.isTransfer = true;
              let newLink = {line: lineIn.id.replace("_R", ""), stop: pointIn.id.slice(0, -1)};
              if (point.links.filter(l => l.line === newLink.line && l.stop === newLink.stop).length > 0) {
                return;
              }
              point.links.push(newLink);
            }
            point.route = line.id.replace("_R", "");
          })
        });
      })
    });
  }

  parseOneLineStops =  () => {
    linesData.forEach( line => {
      if (line.id.includes("_R")) return;
      line.stop_points.forEach( start => {

        line.stop_points.forEach( target => {

          let routes = [];
          if(start.id === target.id){
            return;
          }
          let result =  calculatePath(line, start, target, {stations: [], numberOfTransfers: 0, time: 0}, [], []);
          routes = routes.concat(result);
          findBestRoute(start, target, routes);
        });
      });
    });
  }

  parseOneTransferStops =  () => {
    let number = 0;
    linesData.forEach( startLine => {
      startLine.stop_points.forEach( (startPoint, Index) => {
        if (startLine.id.includes("_R")) return;
        number++;
        linesData.forEach( targetLine => {
          if (targetLine.id.includes("_R")) return;
          targetLine.stop_points.forEach( (targetPoint, index) => {
            if (targetPoint.id.slice(0,-1) === startPoint.id.slice(0,-1)
              || targetPoint.route.replace("_R", "") === startPoint.route.replace("_R", "")
              || parsedStopPoints[startPoint.id.slice(0,-1)].routesToAllStations[targetPoint.id.slice(0,-1)]) {return;}
                let transferStops = startLine.stop_points.filter(s => s.isTransfer);
                let transfersToTargetLine = [];
                transferStops.forEach(s => {
                  s.links.forEach(l => {
                    if (l.line === targetPoint.route){
                      transfersToTargetLine.push(l.stop);
                    }
                  });
                });
                if (transfersToTargetLine.length === 0) {
                  return;
                }
                  let allRoutes = [];
                  transfersToTargetLine.forEach(ts => {
                    let route = {};
                    if (ts === startPoint.id.slice(0, -1)){
                      route = {stations: [], numberOfTransfers: 0, time: 0};
                    } else {
                      route = copy(parsedStopPoints[startPoint.id.slice(0,-1)].routesToAllStations[ts]);
                      route.numberOfTransfers ++;
                      route.time +=3;
                    }
                    let newRoute = parsedStopPoints[ts].routesToAllStations[targetPoint.id.slice(0,-1)];

                    route.stations = route.stations.concat(newRoute.stations);
                    route.numberOfTransfers += newRoute.numberOfTransfers;
                    route.time += newRoute.time;
                    allRoutes.push(copy(route));
                  });

                findBestRoute(startPoint, targetPoint, allRoutes);
          })
        });
      });
    });
  }

  findBestRoute =  (start, target, routes) =>  {
    let bestRoute = routes[0];
    let startId = start.id.slice(0, -1);
    let targetId = target.id.slice(0, -1);
    if (routes.length > 1) {
      routes.forEach(route => {
        if (route.time < bestRoute.time) {
          bestRoute = route;
        }
      });
    }
    if (!bestRoute) {return;}
    writeNewRoute(startId, targetId, bestRoute);
    let reverseRoute = copy(bestRoute);
    reverseRoute.stations = reverseRoute.stations.reverse();
    writeNewRoute(targetId, startId, reverseRoute);
  }

  writeNewRoute = (startId, targetId, route) => {
    if (!parsedStopPoints[startId]) {
      parsedStopPoints[startId] = {};
    }
    if (!parsedStopPoints[startId].routesToAllStations) {
      parsedStopPoints[startId].routesToAllStations = {};
    }
    if (!parsedStopPoints[startId].routesToAllStations[targetId]){
      parsedStopPoints[startId].routesToAllStations[targetId] = {stations: [], numberOfTransfers: 0, time : 0};
    }
    if (parsedStopPoints[startId].routesToAllStations[targetId].numberOfTransfers === 0 ||
      parsedStopPoints[startId].routesToAllStations[targetId].numberOfTransfers > route.numberOfTransfers)
      {
        parsedStopPoints[startId].routesToAllStations[targetId] = {
          stations: route.stations,
          numberOfTransfers: route.numberOfTransfers,
          time: route.time
        };
      }
  }

calculatePath =  (startLine, start, target, route, allRoutes, allVisitedStations) => {
  if (allVisitedStations.includes(start.id)) {
    return allRoutes;
  }
  if (parsedStopPoints[start.id.slice(0,-1)] && parsedStopPoints[start.id.slice(0,-1)].routesToAllStations[target.id.slice(0,-1)]) {
    var lastPartOfRoute = parsedStopPoints[start.id.slice(0,-1)].routesToAllStations[target.id.slice(0,-1)];
    route.stations = route.stations.concat(lastPartOfRoute.stations);
    route.time += lastPartOfRoute.time;
    route.numberOfTransfers += lastPartOfRoute.numberOfTransfers;
    allRoutes.push(copy(route));
    return allRoutes;
  }

  route.stations.push({stop: start.id, line: startLine.id});
  allVisitedStations.push(start.id);
  route.time +=3;
  if (start.id === target.id)
  {
    allRoutes.push(copy(route));
    return allRoutes;
  }
    let index = startLine.stop_points.indexOf(start);
    let nextStop = startLine.stop_points[index + 1];
    if (nextStop) {
      var result = calculatePath(startLine, nextStop, target, copy(route), copy(allRoutes), allVisitedStations);
      allRoutes = allRoutes.concat(result);
    }
  return allRoutes;
}

copy = (entity) => {
  return JSON.parse(JSON.stringify(entity));
}

main();

app.listen(port, async () => {
  console.log(`Listening on port ${port}`)
});

// GET, params: query (users entered value), returns matched metro stations
app.get('/metro-station-near/:query', (req, res) => {

  const filteredStations = linesData.map(line => line.stop_points.find(stop => {
    return stop.label.toLowerCase().includes(req.params.query.toLowerCase())
  })).filter(item => item);

  const uniqueArray = filteredStations.filter((station, index) => {
    return index === filteredStations.findIndex(obj => obj.label === station.label)
  })

  res.send({ data: uniqueArray });
});

// GET, params: start (beggining of the route), end (final destination), returns a route between them
app.get('/find-route/:start/:end', (req, res) => {
  const fromStation = req.params.start.slice(0,-1)
  const toStation = req.params.end.slice(0,-1)

  if (fromStation === toStation) {
    res.status(404).send({ error: 'Destination point should differ from start point' });
  }
  const route = parsedStopPoints[fromStation].routesToAllStations[toStation]

  if (route) {
    res.send({ data: route, summary: { arrivalAt: `${new Date().getHours()}:${new Date().getMinutes() + route.time}`, totalStations: route.stations.length - 1, totalTransfers: route.numberOfTransfers } });
  }
});
