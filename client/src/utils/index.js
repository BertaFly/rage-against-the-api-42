export const debounce = (fn, ms = 0) => {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
};

export const getDestinationStopPoint = route => {
  return route[route.length - 1].stops[route[route.length - 1].stops.length - 1]
}


export const getMetroLine = lineCode => {
  return lineCode.split(':')[lineCode.split(':').length - 1]
}
