/*

  Service for interacting with the brower geolocation api.
  Based on
    https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/watchPosition
    https://developers.google.com/web/fundamentals/native-hardware/user-location

  Peruskäyttö:

  SIJAINNIN HAKEMINEN KERRAN(esimerkiksi controllerissa):
    Tapa 1 (Sijainnin päivittäminen controllerissa, koordinaatit ainoastaan pyydetään serviceltä):
      $scope.getCurrentPosition = function() {
        $scope.locationService.getCurrentPosition().then(function(coords) {
          $scope.center.lon = coords[0];
          $scope.center.lat = coords[1];
        });
      };

    Tapa 2 (Sijainnin päivittäminen servicessä, controllerista annetaan center-objekti jota halutaan päivittää):
      $scope.centerToCurrentPosition = function() {
        $scope.locationService.centerToCurrentPosition($scope.center);
      };

  SIJAINNIN SEURANTA:
    Tapa 1 (Rekisteröidään keskipiste erikseen ja aloitetaan sijainnin seuranta):
      $scope.watchPosition = function() {
        $scope.locationService.registerCenter($scope.center);
        $scope.locationService.watchPosition();
      };

    Tapa 2 (Rekisteröidään keskipiste pyynnön yhteydessä):
      $scope.watchPosition = function() {
        $scope.locationService.watchPosition($scope.center);
      };

    Tapa 3 (Ei rekisteröityä keskipistettä ollenkaan, eli jos sitä ei ole missään tehty, ei mitään karttaa päivitetä)
      $scope.watchPosition = function() {
        $scope.locationService.watchPosition();
      };

  SIJAINNIN SEURANNAN LOPETUS:
    $scope.stopWatch = function() {
      $scope.locationService.stopWatch();
    }

  KARTAN KESKIPISTEEN REKISTERÖINTI PÄIVITETTÄVÄKSI:
    $scope.locationService.registerCenter($scope.center);

*/
angular.module('mip.map').factory('LocationService', [
  '$rootScope', '$http', '$q', 'CONFIG', 'locale', 'AlertService', '$interval', '$timeout', 'MapService',
  function ($rootScope, $http, $q, CONFIG, locale, AlertService, $interval, $timeout, MapService) {

    // Servicen tallentamat sijainnit, joita ei ole vielä tallennettu kantaan. Sisältää objekteja: {lon: 123, lat: 321, id:-1, desc: "userPosition"}
    // desc = "description" - lisätty kuvastamaan sijainnin käyttötarkoitusta, jos tarvitaan esimerkiksi tyylien kanssa.
    // Ei ole käytetty "type"-nimeä väärinkäsitysten välttämiseksi (type on käytössä GeoJSON:issa).
    var unsavedLocations = [];
    // watchPosition handlerin id. Tarvitaan seurannan lopettamiseen (clearWatch())
    var id = undefined;
    // GPS seurannan asetukset
    var options = {
      enableHighAccuracy: true, // Syö akkua.
      timeout: 5000, // Aika joka odotetaan sijaintia pyydettäessä.
      maximumAge: 0 // Ei käytä 'vanhaa' sijaintia, vaan pyytää aina uuden.
    };
    // $scopen center-objekti jota halutaan päivitettävän. Jos näkymässä on kartta, voidaan sen keskipiste rekisteröidä
    // jolloin (seurannan ollessa päällä) tätä objektia päivitetään.
    var centerReference = undefined;

    // Minimiluku jonka verrran koordinaattien tulee muuttua, jotta käyttäjän sijainti huomataan muuttuneeksi
    // Ei metrejä. 25 ~ 1/3 kauppatorin leveydestä...
    var minTreshold = 5;

    var locationServiceFunctions = {
      /*
       * Saadun sijainnin lisääminen servicen ylläpitämään sijaintilistaan.
       * Samaa sijaintia ei tallenneta kahtaa kertaa peräkkäin.
       * Jos sijainti tallennettiin, palautetaan true. Jos sijaintia ei tallennettu, palautetaan false.
       *
       * TODO: Tarvitaanko jonkinlainen 'marginaali', eli jos kaksi peräkkäistä sijaintia ovat
       *       lähekkäin toisiaan, ei niitä tallenneta?
       *
       */
      addLocationPoint: function (point) {
        var initialLength = unsavedLocations.length;
        if (unsavedLocations.length > 0) {
          //console.log("Herkkyys: " + minTreshold + ". Onko sijainti muuttunut tarpeeksi: " + (Math.abs(unsavedLocations[unsavedLocations.length - 1].lon - point.lon) > minTreshold) + " & " + (Math.abs(unsavedLocations[unsavedLocations.length - 1].lat - point.lat) > minTreshold) + ". LON EROTUS: " + Math.abs(unsavedLocations[unsavedLocations.length - 1].lon - point.lon) + " & LAT EROTUS:" + Math.abs(unsavedLocations[unsavedLocations.length - 1].lat - point.lat));
          // Sijainnin muutos edelliseen tulee olla huomattava ennen kuin uusi sijainti otetaan huomioon.
          if ((Math.abs(unsavedLocations[unsavedLocations.length - 1].lon - point.lon) < minTreshold) && (Math.abs(unsavedLocations[unsavedLocations.length - 1].lat - point.lat) < minTreshold)) {
            return false;
          }
          if (unsavedLocations[unsavedLocations.length - 1].lon !== point.lon || unsavedLocations[unsavedLocations.length - 1].lat !== point.lat) {
            point['id'] = locationServiceFunctions.getNextIndex();
            point['desc'] = "userPosition";
            unsavedLocations.push(point);
          }
        } else {
          point['id'] = locationServiceFunctions.getNextIndex();
          point['desc'] = "userPosition";
          unsavedLocations.push(point);
        }
        if (unsavedLocations.length != initialLength) {
          return true;
        }

        return false;
      },
      /*
       * Get the temporary locations.
       */
      getUnsavedLocations: function () {
        return unsavedLocations;
      },
      /*
       * Poista sijanti servicen ylläpistämästä sijaintilistasta
       */
      removeLocationPoint: function (id) {
        var index = unsavedLocations.indexOf(id);
        unsavedLocations.splice(index, 1);
      },
      /*
       * Tyhjennä servicen ylläpitämä sijantilista
       */
      removeLocationPoints: function (layer) {
        unsavedLocations.length = 0;
        if(layer) {
          // Clear also the openlayers layer from features
          layer.getSource().clear();
        }
      },
      clearLayer: function (layer) {
        layer.getSource().clear();
      },
      /*
       * Seuraavan väliaikaisen ID:n generoiminen sijainnille.
       * Negatiivinen, jotta sekaannusta kantaan tallennettujen sijaintien kanssa ei tule.
       * TODO: Tarvitaanko ylipäänsä?
       */
      getNextIndex: function () {
        return (unsavedLocations.length + 1) * -1; // Return -1 as the first index and so on.
      },
      /**
       * Tarkastetaan onko käyttäjä antanut sijainnin käytettäväksi
       * MIPille. "Ei pakollista" käyttää, metodien callbackina on virheilmoitus jos sijaintia ei saada.
       *
       * Returns:
       *    granted -> access is allowed
       *    denied -> access is denied
       *    prompt -> prompt is shown, user has not given access yet
       */
      isLocationAvailable: function () {
        var deferred = $q.defer();
        navigator.permissions.query({ name: 'geolocation' }).then(function (permission) {
          //console.log(permission);
          deferred.resolve(permission.state);
        });
        return deferred.promise;
      },
      /*
       * Tarkastetaanko onko sijainnin saaminen ylipäänsä mahdollista.
       */
      isLocationSupported: function () {
        if (navigator.geolocation) {
          return true;
        }
        return false;
      },
      /*
       * Aloitetaan käyttäjän sijainnin seuranta (jos sijainti on saatavilla).
       *   Jos $scope.center on rekisteröity servicelle, se päivitetään vastaamaan käyttäjän sijaintia.
       *   Jos ei ole rekisteröity, sijaintia tallennetaan taustalla, ilman että käyttöliittymässä olevan kartan
       *   sijaintia päivitetään.
       *   $scope.center voidaan rekisteröidä myös jälkikäteen (jotta esimerkiksi aktiivisen näkymän kartta saadaan liikkumaan sijainnin mukana).
       * Aloitettaessa lopetetaan mahdollinen jo käynnissä ollut sijainnin tallentaminen (ei varmuutta onko vaikutusta mihinkään).
       *
       * Sijainnin lopettaminen tulee tehdä (stopWatch), muuten sijainnin tallentaminen jää päälle.
       *
       */
      watchPosition: function (centerToRegister, layer) {
        locationServiceFunctions.stopWatch();
        if (centerToRegister) {
          centerReference = centerToRegister;
        }

        var deferred = $q.defer();

        var geoSuccess = function (position) {
          var converted = MapService.epsg4326ToEpsg3067(position.coords.longitude, position.coords.latitude);
          // Center the map to the coords
          if (centerReference) {
            centerReference.lon = converted[0];
            centerReference.lat = converted[1];
          }
          var locationAdded = locationServiceFunctions.addLocationPoint({ lon: converted[0], lat: converted[1] });

          if (layer && locationAdded) {
            //locationServiceFunctions.clearLayer(layer);
            //locationServiceFunctions.drawUnsavedLocations(layer);
            //locationServiceFunctions.addFeature(layer, [centerReference.lon, centerReference.lat]);
            //if(unsavedLocations.length >= 2) {
              //var coordsFrom = [unsavedLocations[unsavedLocations.length-1].lon, unsavedLocations[unsavedLocations.length-1].lat]; // Previous location
              var coordsTo = [centerReference.lon, centerReference.lat]; // Current location
              locationServiceFunctions.drawLine(layer, coordsTo);
           // }
          }

          $rootScope.$apply();
          return deferred.resolve([converted[0], converted[1]]);
        };

        // TODO: Näytä ilmoitus tjsp
        var geoError = function (error) {
          // error.code can be:
          //   0: unknown error
          //   1: permission denied
          //   2: position unavailable (error response from location provider)
          //   3: timed out
          console.log('Error occurred. Error code: ' + error.code + ": " + error.message);
          AlertService.showError(locale.getString('error.Error'), error.code + ": " + error.message);
        }

        id = navigator.geolocation.watchPosition(geoSuccess, geoError, options);
        return deferred.promise;
      },
      /*
       * Käyttäjän sijainnin hakeminen yhden kerran. Ei siis jatkuvaa tallennusta.
       * Koordinaatit palautetaan EPSG:3067 -projektiossa.
       * Ei myöskään keskitetä mahdollisesti käyttöliittymässä olevaa karttaa mihinkään.
       *
       */
      getCurrentPosition: function () {
        var deferred = $q.defer();
        var geoSuccess = function (position) {
          var converted = MapService.epsg4326ToEpsg3067(position.coords.longitude, position.coords.latitude);
          return deferred.resolve([converted[0], converted[1]]);
        };

        // TODO: Näytä ilmoitus tjsp
        var geoError = function (error) {
          console.log('Error occurred. Error code: ' + error.code + ": " + error.message);
        }

        navigator.geolocation.getCurrentPosition(geoSuccess, geoError, options);
        return deferred.promise;
      },
      /*
       * Haetaan sijainti ja keskitetään anettu $scope.center objekti saatuun sijaintiin.
       *
       */
      centerToCurrentPosition: function (center) {
        locationServiceFunctions.getCurrentPosition().then(function (coords) {
          center.lon = coords[0];
          center.lat = coors[1];
        });
      },
      /*
       * Seurannan lopettaminen.
       */
      stopWatch: function () {
        if (id) {
          navigator.geolocation.clearWatch(id);
          id = undefined;
        }
      },
      /*
       * Seurannan handlerin palauttaminen. JOS määritetty, seuranta on päällä. JOS undefined, seuranta ei ole päällä
       */
      getWatchId: function () {
        return id;
      },
      /*
       * Rekisteröi näkymässä oleva esim. $scope.center servicelle. Tätä objektia päivitetään jos seuranta on päällä.
       *
       */
      registerCenter: function (center) {
        centerReference = center;
      },
      /*
       * Unrekisteröi $scopessa objekti jota päivitetään sijainnin seurannan yhteydessä.
       * Tämän jälkeen siis mitään karttaa ei enää keskitetä ennen kuin uusi objekti rekisteröidään.
       *
       */
      unregisterCenter: function () {
        centerReference = undefined;
      },
      setLocationTreshold: function (treshold) {
        minTreshold = treshold;
      },
      getLocationTreshold: function () {
        return minTreshold;
      },
      // Featuren lisääminen annetulle tasolle annettuihin koordinaatteihin
      // EI VÄLTTÄMÄTTÄ TARVITA, JOS PELKÄSTÄÄN DRAWLINE ON KÄYTÖSSÄ
      /*
      addFeature: function (layer, coords) {
        var source = layer.getSource();
        var g = new ol.geom.Point([coords[0], coords[1]]);
        var f = new ol.Feature({
          name: 'userPoint',
          geometry: g
        });
        source.addFeature(f);

        // Jos tallennettuja pisteitä on yli 2, voidaan alkaa piirtämään viivaa
        if (unsavedLocations.length > 1) {
          locationServiceFunctions.drawLineFeature(layer,
            [unsavedLocations[unsavedLocations.length - 2].lon, unsavedLocations[unsavedLocations.length - 2].lat],
            [unsavedLocations[unsavedLocations.length - 1].lon, unsavedLocations[unsavedLocations.length - 1].lat]);
        }
      },
      */
      // Käydään läpi kaikki unsavedLocations listan pisteet ja piirretään ne tasolle. Lisäksi piirretään viivat pisteiden väleille.
      // TODO - MUOKKAA DRAWLINE KALTAISEKSI JOS YKSI VIIVA ON NOPEAMPI TOIMIVUUDESSA
      drawUnsavedLocations: function (layer) {
        for (var i = 0; i < unsavedLocations.length; i++) {
          locationServiceFunctions.drawLine(layer, [unsavedLocations[i].lon, unsavedLocations[i].lat]);
          /*
          var g = new ol.geom.Point([unsavedLocations[i].lon, unsavedLocations[i].lat]);
          var f = new ol.Feature({
            name: 'userPoint',
            geometry: g
          });
          source.addFeature(f);

          if (i > 0) {
            locationServiceFunctions.drawLineFeature(layer,
              [unsavedLocations[i - 1].lon, unsavedLocations[i - 1].lat],
              [unsavedLocations[i].lon, unsavedLocations[i].lat]);
          }
          */
        }
      },
      // Versio, jossa featureiden lisäämisen sijaan ainaostaan lisätään olemassaolevaan viivaan pisteitä, jotka on tallessa
      // unsavedLocations-arrayssä
      // Jos annetaan ainoastaan layer ja coordsTo, niin silloin alkupistettä ei tarvita,
      drawLine: function(layer, coordsTo) {
        var source = layer.getSource();
        // Onko viiva jo olemassa?
        var features = source.getFeatures();
        if(features.length === 0) {
          // Tehdään uusi viiva, johon myöhemmin lisätään pisteitä
          var featureLine = new ol.Feature({
            geometry: new ol.geom.LineString([coordsTo])
          });
          source.addFeature(featureLine);
        } else {
          // Pitäisi olla ainoastaan 1 feature
          var line = features[0];
          var geom = line.getGeometry();
          var existingCoords = geom.getCoordinates();
          existingCoords.push(coordsTo);
          geom.setCoordinates(existingCoords);
        }
      },
      // Piirretään annetulle tasolle viiva kahden pisteen välille
      // EI VÄLTTÄMÄTTÄ TARVITA, JOS PELKÄSTÄÄN DRAWLINE ON KÄYTÖSSÄ
      /*
      drawLineFeature: function (layer, coordsFrom, coordsTo) {
        var source = layer.getSource();
        var featureLine = new ol.Feature({
          geometry: new ol.geom.LineString([coordsFrom, coordsTo])
        });
        source.addFeature(featureLine);
      },
      */
      // Käyttäjän reitin tallennus ja linkkaus annettuun entiteettiin
      // data: { entityType: <entityType>, entityId: <entityId>, 'pisteet': [[lat: x, lon: y]]}
      saveEntityLink: function (data) {
        var deferred = $q.defer();

        $http({
          method: 'POST',
          url: CONFIG.API_URL + 'reitti',
          data: data
        }).then(function success(response) {
          $rootScope.$broadcast('Reitti_modified', {
            'type': 'Add',
            'reitti_id': response.data.data.properties.id
          });
          // Tyhjennetään reittipisteet
          locationServiceFunctions.removeLocationPoints();

          deferred.resolve(response.data.data);
        }, function error(response) {
          deferred.reject(response);
        });

        return deferred.promise;
      },
      // Haetaan entiteettiin liitetyt reitit bäkkäristä
      // data: {entiteettiTyyppi: 'Kohde', entiteettiId: 123}
      getReitit: function(data) {
        var deferred = $q.defer();

        $http({
          method: 'GET',
          url: CONFIG.API_URL + 'reitti/'+data['entiteettiTyyppi']+'/'+data['entiteettiId'],
        }).then(function success(response) {
          deferred.resolve(response.data.data);
        }, function error(response) {
          deferred.reject(response);
        });

        return deferred.promise;
      },
      // Hae kaikki reitit
      getAllReitit: function() {
        var deferred = $q.defer();

        $http({
          method: 'GET',
          url: CONFIG.API_URL + 'reitti/',
        }).then(function success(response) {
          deferred.resolve(response.data.data);
        }, function error(response) {
          deferred.reject(response);
        });

        return deferred.promise;
      },
      poistaReitti: function(id) {
        var deferred = $q.defer();

        $http({
          method: 'DELETE',
          url: CONFIG.API_URL + 'reitti/'+id,
        }).then(function success(response) {
          deferred.resolve(response.data.data);
        }, function error(response) {
          deferred.reject(response);
        });
        return deferred.promise;
      }
    }

    return locationServiceFunctions;
  }]);