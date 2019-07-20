/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';

import PlaceSelector from './components/PlaceSelector'
import Jorney from './components/Jorney'

import './App.scss';

const App = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [startValue, setStartInputValue] = useState('')
  const [endValue, setEndInputValue] = useState('')

  const [fromToRoute, setFromToRoute] = useState({from: '', to: ''})
  const [jorney, setJorney] = useState()

  const handleLoadOptions = async (inputValue, callback) => {
    const response = await fetch(`/metro-station-near/${inputValue}`);
    const allStops = await response.json();
    console.log(allStops);
    // axiosInstance
    //   .get(`/places?q=${inputValue}&type[stoppoint]=address`)
    //   .then(res => {
    //     const allStops = res.data.places.filter(place => place.embedded_type === 'stop_area').filter(stop => stop.stop_area.commercial_modes.some(mode => mode.id === 'commercial_mode:Metro'))
    //     callback(allStops.map(currentStop => ({value: currentStop.stop_area.id, label: currentStop.stop_area.label})))
    //     // console.log(allStops);
    //   })
    //   .catch(err => console.log('err', err))
    callback(allStops.data.map(currentStop => ({value: currentStop.stop_area.id, label: currentStop.stop_area.label})))
  }

  const handleStartPointChange = selectedOption => {
    setStartInputValue(selectedOption.label)
    setFromToRoute({...fromToRoute, from: selectedOption.label})
  }

  const handleEndPointChange = selectedOption => {
    setEndInputValue(selectedOption.label)
    setFromToRoute({...fromToRoute, to: selectedOption.label})
  }

  const handleSearchRoute = async () => {
    setIsLoading(true)
    const response = await fetch(`/find-route/${fromToRoute.from}/${fromToRoute.to}`);
    const trip = await response.json();
    console.log('response', trip)

    if (response.status !== 200) {
      throw Error(trip.message)
    }

    setJorney(trip)
    setIsLoading(false)
  }

  // const stops = {

  // }
  return (
    <div className="App">
      <div className="paper container-flex">
        <div className="select-holder">
          <div className="select-item">
            <PlaceSelector handleLoadOptions={handleLoadOptions} handleInputChange={setStartInputValue} inputValue={startValue} onChangeEvent={handleStartPointChange} selectedValue={fromToRoute.from} label="Enter your start point" />
          </div>
          <div className="select-item">
            <PlaceSelector handleLoadOptions={handleLoadOptions} handleInputChange={setEndInputValue} inputValue={endValue} onChangeEvent={handleEndPointChange} selectedValue={fromToRoute.to} label="Enter your destination point" />
          </div>
        </div>

        <button type="button" className={`search-btn ${!fromToRoute.from || !fromToRoute.to ? 'search-btn-disabled' : 'search-btn-active'}`} onClick={handleSearchRoute} disabled={!fromToRoute.from || !fromToRoute.to || isLoading}>Search a route</button>

        {isLoading && (
          <div className="spinner-container">
            <div className="spinner"/>
          </div>
        )}

        {jorney && (
          <Jorney route={jorney.data} summary={jorney.summary} />
        )}
      </div>
    </div>
  );
}

export default App;
