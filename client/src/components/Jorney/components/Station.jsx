import React from 'react';

const Station = ({ stopsQueue, departureTime }) => {
  return (
    <div className="station">
      <span className="depart-time">{departureTime}</span>
      <span className="station-icon" />
      <span className="station-name">{stopsQueue[0]}</span>
    </div>
  );
};

export default Station;
