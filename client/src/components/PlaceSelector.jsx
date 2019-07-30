import React from 'react'
import Async from 'react-select/async'

import { debounce } from '../utils'

const PlaceSelector = ({ handleLoadOptions, placeholder = '', handleInputChange, inputValue, onChangeEvent, selectedValue, label = '' }) => {
  const customStyles = {
    option: (provided, state) => {
      return {
      ...provided,
      fontWeight: state.isSelected ? 500 : 400,
      padding: 10,
      textAlign: 'left',
      zIndex: 2,
    }},
    menuList: () => ({zIndex: 2}),
  }

  return (
    <>
      {label && (
        <p className="typography">
          {label}
        </p>
      )}
      <Async
        loadOptions={(inputValue, callback) => {
          if (inputValue.length > 2 && inputValue.length < 31) {
            debounce(handleLoadOptions(inputValue, callback), 250)
          } else {
            callback([])
          }
        }}
        noOptionsMessage={({ inputValue }) => {
          if (inputValue.length < 3) {
            return 'Please enter 3 more characters'
          }
          return 'No Options'
        }}
        placeholder={placeholder}
        onInputChange={inputValue => {
          if ((inputValue === '' || /^[A-Za-z0-9'.-\s,]+$/.test(inputValue)) && inputValue.length < 31) {
            handleInputChange(inputValue)
          }
        }}
        inputValue={inputValue}
        onChange={onChangeEvent}
        styles={customStyles}
        value={{label: selectedValue, value: selectedValue}}
        blurInputOnSelect
        menuIsOpen
      />
    </>
  )
}

export default PlaceSelector
