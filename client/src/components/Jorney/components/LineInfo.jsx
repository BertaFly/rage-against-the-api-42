import React from 'react';

const LineInfo = ({ line, color, direction, stationCount }) => {
  return (
    <div className="line-info">
      <div className="stripe" style={{borderColor: color}}></div>
      <div className="line-info-block">
        <div className="line-info-text-row">
          <div className="line-code" style={{background: color}}>{line}</div>
          <div className="line-direction">{direction}</div>
        </div>
        <div className="line-info-text-row">
          <div className="stop-points-count">{`${stationCount} stop${stationCount > 1 ? 's' : ''}`}</div>
        </div>
      </div>
    </div>
  );
};

export default LineInfo;
