import React from 'react';

const Station = ({ stopName, departureTime }) => {
  return (
    <div className="station">
      <span className="depart-time">{departureTime}</span>
      <span className="station-icon" />
      <span className="station-name">{stopName}</span>
    </div>
  );
};

export default Station;
