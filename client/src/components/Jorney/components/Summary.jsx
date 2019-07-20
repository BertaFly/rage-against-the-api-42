import React from 'react';

import Station from './Station'

const Summary = ({ finalStopPoint, arrivalTime, totalStations }) => {
  return (
    <>
      <Station stopsQueue={[finalStopPoint]} departureTime={arrivalTime} />

      <span className="stop-points-count total-stations">{`${totalStations} stop${totalStations > 1 ? 's' : ''} in total`}</span>
    </>
  );
};

export default Summary;
