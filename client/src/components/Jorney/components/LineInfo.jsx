import React from 'react';

const LineInfo = ({ line, color, way }) => {
  const isPlural = value => {
    return value > 1
  }

  return (
    <div className="line-info">
      <div className="stripe" style={{borderColor: color}}></div>
      <div className="line-info-block">
        <div className="line-info-text-row">
          <div className="line-code" style={{background: color}}>{line}</div>
          <div className="line-direction">{way.direction}</div>
        </div>
        <div className="line-info-text-row">
          <div className="stop-points-count">{`${way.stops.length - 1} stop${isPlural(way.stops.length - 1) ? 's' : ''}`}</div>
        </div>
      </div>
    </div>
  );
};

export default LineInfo;
