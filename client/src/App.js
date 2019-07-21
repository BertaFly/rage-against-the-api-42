/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState } from 'react';

import PlaceSelector from './components/PlaceSelector'
import Jorney from './components/Jorney'

import './App.scss';

const App = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [localError, setError] = useState('')
  const [startValue, setStartInputValue] = useState('')
  const [endValue, setEndInputValue] = useState('')

  const [fromToRoute, setFromToRoute] = useState({from: '', to: ''})
  const [jorney, setJorney] = useState()

  const handleLoadOptions = async (inputValue, callback) => {
    const response = await fetch(`/metro-station-near/${inputValue}`);
    const allStops = await response.json();

    if (allStops.data.length) {
      callback(allStops.data.map(currentStop => ({value: currentStop.id, label: currentStop.label})))
    } else {
      callback([])
    }
  }

  const handleStartPointChange = selectedOption => {
    setStartInputValue(selectedOption.label)
    setFromToRoute({...fromToRoute, from: selectedOption})
  }

  const handleEndPointChange = selectedOption => {
    setEndInputValue(selectedOption.label)
    setFromToRoute({...fromToRoute, to: selectedOption})
  }

  const handleSearchRoute = async () => {
    setIsLoading(true)
    setError('')
    const response = await fetch(`/find-route/${fromToRoute.from.value}/${fromToRoute.to.value}`);
    const trip = await response.json();

    if (response.status !== 200) {
      setIsLoading(false)
      if (response.status === 404) {
        setError(trip.error)
      } else {
        setError('Oops, please try later')
      }
      return
    }

    setJorney(trip)
    setIsLoading(false)
  }

  return (
    <div className="App">
      <div className="paper container-flex">
        <div className="select-holder">
          <div className="select-item">
            <PlaceSelector handleLoadOptions={handleLoadOptions} handleInputChange={setStartInputValue} inputValue={startValue} onChangeEvent={handleStartPointChange} selectedValue={fromToRoute.from.label} label="Enter your start point" />
          </div>
          <div className="select-item">
            <PlaceSelector handleLoadOptions={handleLoadOptions} handleInputChange={setEndInputValue} inputValue={endValue} onChangeEvent={handleEndPointChange} selectedValue={fromToRoute.to.label} label="Enter your destination point" />
          </div>
        </div>

        <button type="button" className={`search-btn ${!fromToRoute.from || !fromToRoute.to ? 'search-btn-disabled' : 'search-btn-active'}`} onClick={handleSearchRoute} disabled={!fromToRoute.from || !fromToRoute.to || isLoading}>Search a route</button>

        {isLoading && (
          <div className="spinner-container">
            <div className="spinner"/>
          </div>
        )}

        {localError && (
            <p>{localError}</p>
        )}

        {jorney && (
          <Jorney route={jorney.data.stations} summary={jorney.summary} minutesStart={new Date().getMinutes()} />
        )}
      </div>
    </div>
  );
}

export default App;
