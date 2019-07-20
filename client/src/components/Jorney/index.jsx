import React from 'react'

import Station from './components/Station'
import LineInfo from './components/LineInfo'
import Summary from './components/Summary'

import { getDestinationStopPoint, getMetroLine } from '../../utils'

const Jorney = ({ route, summary }) => {
  const destinationStopPoint = getDestinationStopPoint(route)

  return (
    <div className="route-container">
      {route.map(way => {
        const color = `#${way.color}`;
        const line = getMetroLine(way.line);

        return (
          <div key={line}>
            <Station stopsQueue={way.stops} departureTime={way.startAt} />
            <LineInfo color={color} line={line} way={way} />
          </div>
        )
      })}

      <Summary finalStopPoint={destinationStopPoint} arrivalTime={summary.arrivalAt} totalStations={summary.totalStations} />
    </div>
  )
}

export default Jorney
