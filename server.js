const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const request = require('request-promise');

const baseURL = 'https://api.navitia.io/v1/coverage/sandbox';
const token = '3b036afe-0110-4202-b9ed-99718476c2e0';

let allMetroStations = [];

const getAllMetroStations = async () => {
  return await request.get({
    url: `${baseURL}/networks/network:RAT:1/routes?depth=3`,
    headers: {
      'Authorization': token,
    },
  }, (error, response, body) => {
    if (!error && response.statusCode == 200) {
      console.log('Stations were downloaded')
      return body;
     }
  });
}

main = async () => {
  const res = await getAllMetroStations();
  allMetroStations = JSON.parse(res);
}

app.listen(port, async () => {
  console.log(`Listening on port ${port}`)
});

// GET, params: query (users entered value), returns matched metro stations
app.get('/metro-station-near/:query', (req, res) => {
  const filteredStations = allMetroStations.routes.map(line => {
    return line.stop_points.find(stopPoint => stopPoint.label.toLowerCase().includes(req.params.query.toLowerCase()))
  }).filter(item => item);

  const uniqueArray = filteredStations.filter((station, index) => {
    return index === filteredStations.findIndex(obj => obj.label === station.label)
  })

  res.send({ data: uniqueArray });
});

// GET, params: start (beggining of the route), end (final destination), returns a route between them
app.get('/find-route/:start/:end', (req, res) => {
  const fromStation = req.params.start
  const toStation = req.params.end

  const jorney = [
    {
      line: 'line:RAT:M1',
      stops: [
        fromStation, 'Charles de Gaulle - Etoile'
      ],
      direction: 'Argentine',
      startAt: '17:15',
      color: 'F2C931',
    },
    {
      line: 'line:RAT:M6',
      stops: [
        'Charles de Gaulle — Étoile (Paris)', 'Kléber (Paris)', 'Some Test',
      ],
      direction: 'Nation (Paris)',
      startAt: '17:21',
      color: '79BB92',
    },
    {
      line: 'line:RAT:M6',
      stops: [
        'My Custom Station', 'Kléber (Paris)', toStation,
      ],
      direction: 'Olympiades (Paris)',
      startAt: '17:21',
      color: '993366',
    }
  ]
  const summary = {
    arrivalAt: '17:27',
    totalStations: 6,
  }
  setTimeout(() => {
    res.send({ data: jorney, summary: summary });
  }, 1500);
});

main();
