import React from 'react';

import Station from './Station'

const Summary = ({ finalStopPoint, arrivalTime, totalStations, totalTransfers }) => {
  return (
    <>
      <Station stopsQueue={[finalStopPoint]} departureTime={arrivalTime} />

      <span className="stop-points-count total-stations">{`${totalStations} stop${totalStations > 1 ? 's' : ''} in total, ${totalTransfers === 0 ? 'No': totalTransfers } transfer${totalTransfers > 1 ? 's' : ''}`}</span>
    </>
  );
};

export default Summary;
