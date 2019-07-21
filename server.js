const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const request = require('request-promise');
var fs = require('fs');

const baseURL = 'https://api.navitia.io/v1/coverage/sandbox/networks/network:RAT:1/routes?depth=3';
const token = '3b036afe-0110-4202-b9ed-99718476c2e0';
let linesData = null;
let parsedStopPoints = {};
let parsedLineTransfers = {};
let allStops = [];

const getAllMetroStations = async () => {
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

main = async () => {
  let data = fs.readFileSync('lines.txt');
  linesData = JSON.parse(data);
  if (linesData == null) {
    const res = await getAllMetroStations();
    linesData = JSON.parse(res).routes;
    linesData.DateUpdated42 = new Date();
    console.log(linesData.DateUpdated42);
    fs.writeFile('lines.txt', JSON.stringify(linesData), function (err) {
      if (err) throw err;
      console.log('Saved!');
    });
  }
  let index = fs.readFileSync('index.json');
  parsedStopPoints = JSON.parse(index);
  if (parsedStopPoints === null || Object.size(parsedStopPoints) === 0) {
    getAllRoutes();
    fs.writeFile('index.json', JSON.stringify(parsedStopPoints), function (err) {
      if (err) throw err;
      console.log('Saved!');
    });
  }
}

getRandRoute = () => {
  linesData.forEach(line => {
    if (line.id.includes("_R")) return;
    line.stop_points.forEach(stop => {
      if (!allStops.includes(stop.id.slice(0,-1))) {
        allStops.push(stop.id.slice(0,-1));
      }
    });
  });
  var start = allStops[Math.floor(Math.random()*allStops.length)];
  var stop = allStops[Math.floor(Math.random()*allStops.length)];
  if (start == stop)
  {
    stop = allStops[Math.floor(Math.random()*allStops.length)];
  }
    console.log("FROM " + start + " TO " +
    stop);

    console.log(parsedStopPoints[start].routesToAllStations[stop]);
}

Object.size = function(obj) {
  var size = 0, key;
  for (key in obj) {
      if (obj.hasOwnProperty(key)) size++;
  }
  return size;
};

getAllRoutes = () =>{
  markAllTransferStops();
  createLineConnections();

  console.log("transfer stations found");

  console.time('parseOneLineStops');
  parseOneLineStops();
  console.timeEnd('parseOneLineStops');
  console.log("Single line routes found");

  console.time('parseOneTransferStops');
  parseOneTransferStops();
  console.timeEnd('parseOneTransferStops');
  console.log("One transfer routes found");

  console.time('parseMultTransferStops');
  parseMultTransferStops();
  console.timeEnd('parseMultTransferStops');
  console.log("Mult transfer routes found");
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
    console.log(parsedStopPoints[startPoint.id.slice(0,-1)].routesToAllStations[finishPoint.id.slice(0,-1)]);
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
                      route = {stations: [], numberOfTransfers: 1, time: 0};
                    } else {
                      route = copy(parsedStopPoints[startPoint.id.slice(0,-1)].routesToAllStations[ts]);
                      route.numberOfTransfers++;
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
      console.log("Line ready " + startLine.id + " " + number);
    });
  }

  parseMultTransferStops = () => {
    let number = 0;
    linesData.forEach(startL => {
      if (startL.id.includes("_R")) {return;}
      startL.stop_points.forEach(start => {
        number ++;
        linesData.forEach(targetL => {
          if (targetL.id.includes("_R")) {return;}
          targetL.stop_points.forEach(target => {
            if (parsedStopPoints[start.id.slice(0,-1)].routesToAllStations[target.id.slice(0,-1)]
            || start.id.slice(0, -1) === target.id.slice(0, -1)) {
              return;
            }
            let startLineTransfers = parsedLineTransfers[start.route];
            let targetLineTransfers = parsedLineTransfers[target.route];
            let allRoutes = [];
            startLineTransfers.forEach(stransfers => {
              targetLineTransfers.forEach(ttransfers => {
                if (stransfers.line === ttransfers.line) {
                  let routeToTransfer = parsedStopPoints[start.id.slice(0,-1)].routesToAllStations[stransfers.stop];
                  let routeBetweenTransfers= parsedStopPoints[stransfers.stop].routesToAllStations[ttransfers.stop];
                  let routeFromTransfer = parsedStopPoints[ttransfers.stop].routesToAllStations[target.id.slice(0,-1)];
                  let route = {stations: [], numberOfTransfers: 2, time: 6};

                  route.stations = route.stations.concat(routeToTransfer.stations);
                  route.stations = route.stations.concat(routeBetweenTransfers.stations);
                  route.stations = route.stations.concat(routeFromTransfer.stations);
                  route.numberOfTransfers = route.numberOfTransfers + routeToTransfer.numberOfTransfers
                   + routeBetweenTransfers.numberOfTransfers + routeFromTransfer.numberOfTransfers;
                  route.time = route.time + routeToTransfer.time + routeBetweenTransfers.time + routeFromTransfer.time;
                  allRoutes.push(route);
                }
              });
            });
            findBestRoute(start, target, allRoutes);
          });
        });
      });
      console.log("Line ready " + startL.id + " " + number);
    });
  }

  createLineConnections = () => {
    linesData.forEach(line => {
      if (line.id.includes("_R")) {return;}
      line.stop_points.forEach(point => {
          if (point.isTransfer)
          {
            if(!parsedLineTransfers[line.id]){
              parsedLineTransfers[line.id] = [];
            }
            point.links.forEach(link => {
              parsedLineTransfers[line.id].push(link);
            });
          }
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

getDetails = (route) => {
  let newStations = [];
  let newRoute = copy(route);
  route.stations.forEach(station => {
    newStations.push(findStation(station.stop));
  });
  newRoute.stations = newStations;
  return newRoute;
}

findStation = (id) => {
  let result = {};
  linesData.forEach(line => {
    line.stop_points.forEach(stop => {
      if (stop.id === id) {
        result = {lineId: line.id, color: line.line.color, stopPointName: stop.name, direction: line.direction.name};
      }
    });
  });
  return result;
}

// GET, params: start (beggining of the route), end (final destination), returns a route between them
app.get('/find-route/:start/:end', (req, res) => {
  const fromStation = req.params.start.slice(0,-1)
  const toStation = req.params.end.slice(0,-1)

  if (fromStation === toStation) {
    res.status(404).send({ error: 'Destination point should differ from start point' });
  }
  const route = getDetails(parsedStopPoints[fromStation].routesToAllStations[toStation])

  if (route) {
    res.send({ data: route, summary: { arrivalAt: `${new Date().getHours()}:${new Date().getMinutes() + route.time}`, totalStations: route.stations.length - 1, totalTransfers: route.numberOfTransfers } });
  }
});
