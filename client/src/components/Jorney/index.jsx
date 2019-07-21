/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react'

import Station from './components/Station'
import LineInfo from './components/LineInfo'
import Summary from './components/Summary'

import { getDestinationStopPoint, getMetroLine } from '../../utils'

const Jorney = ({ route, summary, minutesStart }) => {
  const destinationStopPoint = getDestinationStopPoint(route)
  let metroLineId = null

  return (
    <div className="route-container">
      {route.map((way, index) => {
        if (metroLineId === null || metroLineId !== way.lineId) {
          metroLineId = way.lineId;
          const line = getMetroLine(way.lineId);
          const stationCount = route.filter(routeCheck => routeCheck.lineId === metroLineId).length - 1

          return (
            <div key={line}>
              <Station stopName={way.stopPointName} departureTime={`${new Date().getHours()}:${minutesStart + index * 3}`} />
              <LineInfo color={`#${way.color}`} line={line} direction={way.direction} stationCount={stationCount} />
            </div>
          )
        }
        return null
      })}

      <Summary finalStopPoint={destinationStopPoint} arrivalTime={summary.arrivalAt} totalStations={summary.totalStations} totalTransfers={summary.totalTransfers} />
    </div>
  )
}

export default Jorney
