import { useRef, useEffect, useState } from 'react'
import * as tt from '@tomtom-international/web-sdk-maps'
import * as ttapi from '@tomtom-international/web-sdk-services'
import './App.css'
import '@tomtom-international/web-sdk-maps/dist/maps.css'

const App = () => {
  const mapElement = useRef()
  const [map, setMap] = useState({})
  const [longitude, setLongitude] = useState(36.09414873391526)
  const [latitude, setLatitude] = useState(32.0608498750872)
  const [markPoint, setMarkPoint] = useState()
  let _markPoint
  let _route
  // const url = "https://api.tomtom.com/routing/1/calculateRoute/32.06088120170601%2C36.094155815142045%3A{latitude}%2C${longitude}/json?maxAlternatives=0&instructionsType=text&language=en-GB&computeBestOrder=false&routeRepresentation=polyline&computeTravelTimeFor=none&sectionType=travelMode&callback=callback&departAt=now&traffic=true&avoid=unpavedRoads&travelMode=car&vehicleMaxSpeed=0&vehicleWeight=0&vehicleAxleWeight=0&vehicleLength=0&vehicleWidth=0&vehicleHeight=0&vehicleCommercial=false&vehicleEngineType=combustion&key=BILqah1HZszHwuWV2lQW5EdE2gzOrKPy"
  // const url = "https://api.tomtom.com/routing/1/calculateRoute/32.06088120170601%2C36.094155815142045%3A32.06076803154444%2C36.092996604951594/json?maxAlternatives=0&instructionsType=text&language=en-GB&computeBestOrder=false&routeRepresentation=polyline&computeTravelTimeFor=none&sectionType=travelMode&callback=callback&departAt=now&traffic=true&avoid=unpavedRoads&travelMode=car&vehicleMaxSpeed=0&vehicleWeight=0&vehicleAxleWeight=0&vehicleLength=0&vehicleWidth=0&vehicleHeight=0&vehicleCommercial=false&vehicleEngineType=combustion&key=BILqah1HZszHwuWV2lQW5EdE2gzOrKPy"

  const convertToPoints = (lngLat) => {
    return {
      point: {
        latitude: lngLat.lat,
        longitude: lngLat.lng
      }
    }
  }

  const drawRoute = (geoJson, map) => {
    if (map.getLayer('route')) {
      map.removeLayer('route')
      map.removeSource('route')
    }
    map.addLayer({
      id: 'route',
      type: 'line',
      source: {
        type: 'geojson',
        data: geoJson
      },
      paint: {
        'line-color': '#4a90e2',
        'line-width': 4
      }
    })
    // console.log(map.dist)
  }


  useEffect(() => {
    const origin = {
      lng: longitude,
      lat: latitude,
    }
    let destinations = []

    const addDeliveryMarker = (lngLat, map) => {
      console.log("lngLat: ", lngLat)
      const element = document.createElement('div')
      element.className = 'marker-delivery'
      if (_markPoint) {
        _markPoint.remove()
        // map.removeLayer(_markPoint);
      }
      _markPoint = new tt.Marker({
        element: element,
        draggable: true,
      })
      _markPoint
        .setLngLat(lngLat)
        .addTo(map)
      setMarkPoint(_markPoint)

      _markPoint.on('dragend', (e) => {
        console.log("dragend: ", e.target._lngLat)
        destinations = [e.target._lngLat]
        recalculateRoutes()
      });
    }

    let map = tt.map({
      key: "BILqah1HZszHwuWV2lQW5EdE2gzOrKPy",
      container: mapElement.current,
      stylesVisibility: {
        trafficIncidents: true,
        trafficFlow: true,
      },
      center: [longitude, latitude],
      zoom: 14,
    })
    setMap(map)

    const addMarker = () => {
      const popupOffset = {
        bottom: [0, -25]
      }
      const popup = new tt.Popup({ offset: popupOffset }).setHTML('هنا المتجر')
      const element = document.createElement('div')
      element.className = 'marker'

      const marker = new tt.Marker({
        draggable: true,
        element: element,
      }).setLngLat([longitude, latitude]).addTo(map)

      marker.on('dragend', () => {
        const lngLat = marker.getLngLat()
        setLongitude(lngLat.lng)
        setLatitude(lngLat.lat)
      })

      marker.setPopup(popup).togglePopup()

    }

    addMarker()

    const sortDestinations = (locations) => {
      console.log(locations)
      const pointsForDestinations = locations.map((destination) => {
        console.log("?????", destination)
        return convertToPoints(destination)
      })
      const callParameters = {
        key: "BILqah1HZszHwuWV2lQW5EdE2gzOrKPy",
        destinations: pointsForDestinations,
        origins: [convertToPoints(origin)],
      }

      return new Promise((resolve, reject) => {
        ttapi.services
          .matrixRouting(callParameters)
          .then((matrixAPIResults) => {
            const results = matrixAPIResults.matrix[0]
            const resultsArray = results.map((result, index) => {
              return {
                location: locations[index],
                drivingtime: result.response.routeSummary.travelTimeInSeconds,
              }
            })
            resultsArray.sort((a, b) => {
              return a.drivingtime - b.drivingtime
            })
            const sortedLocations = resultsArray.map((result) => {
              return result.location
            })
            resolve(sortedLocations)
          })
      })
    }
    console.log(navigator)
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(function(position) {
        let coordinates = {lng:position.coords.longitude, lat:position.coords.latitude} 
        addDeliveryMarker(coordinates, map)
        destinations = [coordinates]
        recalculateRoutes()
         console.log("Latitude is :", position.coords);
          console.log("Longitude is :", position.coords.longitude);
         });    } else {
      console.log("Not Available")
    }

    const recalculateRoutes = async () => {
      //  let distance  = await fetch(`https://api.tomtom.com/routing/1/calculateRoute/36.09414873391526,32.0608498750872:${latitude},${longitude}/json?maxAlternatives=0&instructionsType=text&language=en-GB&computeBestOrder=false&routeRepresentation=polyline&computeTravelTimeFor=none&sectionType=travelMode&callback=callback&departAt=now&traffic=true&avoid=unpavedRoads&travelMode=car&vehicleMaxSpeed=0&vehicleWeight=0&vehicleAxleWeight=0&vehicleLength=0&vehicleWidth=0&vehicleHeight=0&vehicleCommercial=false&vehicleEngineType=combustion&key=BILqah1HZszHwuWV2lQW5EdE2gzOrKPy`
      // ).catch(e => console.log("???????", e)).then((a)=> {
      //         // console.log(a.clone().json().routss)
      //         // console.log("=========================")
      //         // // console.log(a.clone().json().routss[1])

      //         // console.log(a.json())

      //         // console.log("---------------------------")

      //         // console.log(a.clone().json())


      //         // console.log(a.lengthInMeters)
      //         // console.log(a)
      //         // console.log(a.clone().json())
      //         return a.clone().json()

      //       }).then(data => {

      //         console.log("data::::", data)
      //         // console.log("distance::::", distance/1000)

      //         console.log(data.routes[0].legs[0].summary)
      //         // return data.routes[0].legs[0].summary.lengthInMeters
      //       })
      //         console.log("---------------------------", distance)



      sortDestinations(destinations).then((sorted) => {
        sorted.unshift(origin)

        ttapi.services
          .calculateRoute({
            key: "BILqah1HZszHwuWV2lQW5EdE2gzOrKPy",
            locations: sorted,
          })
          .then((routeData) => {
            const geoJson = routeData.toGeoJson()
            console.log("???/////",geoJson)
            drawRoute(geoJson, map)
          })
      })
    }


    map.on('click', (e) => {
      destinations = [e.lngLat]
      addDeliveryMarker(e.lngLat, map)
      recalculateRoutes()

    })

    return () => map.remove()
  }, [longitude, latitude])

  return (
    <>
      {map && (
        <div className="app">
          <div ref={mapElement} className="map" />
          {/* <div className="search-bar"> */}
          {/* <h1>Where to?</h1> */}
          {/* <input
              type="text"
              id="longitude"
              className="longitude"
              placeholder="Put in Longitude"
              onChange={(e) => {
                setLongitude(e.target.value)
              }}
            />
            <input
              type="text"
              id="latitude"
              className="latitude"
              placeholder="Put in latitude"
              onChange={(e) => {
                setLatitude(e.target.value)
              }}
            /> */}
          {/* </div> */}
        </div>
      )}
    </>
  )
}

export default App
