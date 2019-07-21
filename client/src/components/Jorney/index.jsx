/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState } from 'react'

import Station from './components/Station'
import LineInfo from './components/LineInfo'
import Summary from './components/Summary'

import { getDestinationStopPoint, getMetroLine } from '../../utils'

const Jorney = ({ route, summary, minutesStart }) => {
  const [metroLineId, setMetroLineId] = useState(route[0].line)

  const destinationStopPoint = getDestinationStopPoint(route)

  return (
    <div className="route-container">
      {route.map((way, index) => {
        if (index === 0 || metroLineId !== way.line) {
          setMetroLineId(way.line)
          const line = getMetroLine(way.line);

          return (
            <div key={line}>
              <Station stopsQueue={way.stopPointName} departureTime={`${new Date().getHours()}:${minutesStart + index * 3}`} />
              <LineInfo color={way.color} line={line} way={way.direction} />
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
