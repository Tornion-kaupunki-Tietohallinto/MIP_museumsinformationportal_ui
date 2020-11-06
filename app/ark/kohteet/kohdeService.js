/**
 * Kohteiden käyttämä service.
 */
angular.module('mip.kohde', []);

angular.module('mip.kohde').factory('KohdeService', [
        '$http', '$q', 'CONFIG', '$location', 'AlertService', 'ListService', 'locale', '$route', 'CacheFactory', '$rootScope', function($http, $q, CONFIG, $location, AlertService, ListService, locale, $route, CacheFactory, $rootScope) {

            /**
             * Kohteiden cache selaimeen
             */
            CacheFactory('kohdeCache', {
                maxAge : 10 * 60 * 1000, // Items added to this cache expire after 10 minutes
                cacheFlushInterval : 60 * 60 * 1000, // This cache will clear itself every hour
                deleteOnExpire : 'passive', // Cache will do nothing when an item expires. Expired items will remain in the cache until requested, at which point they are removed, and undefined is returned.
                capacity : 50
            // Maximum number of items a cache can hold. Adding more items than the capacity will cause the cache to operate like an LRU cache, removing the least recently used items to stay under capacity. Default: Number.MAX_VALUE.
            });

            var kohdeServiceFunctions = {
                /**
                 * Haetaan kohteet bäkkäristä, palauttaa oletuksena 100kpl
                 * @param Mahdolliset hakuehdot
                 */
                getKohteet : function(params) {
                    var queryString = ListService.parseQueryString(params);

                    var deferred = $q.defer();
                    var url = CONFIG.API_URL + 'kohde/' + queryString;
                    $http({
                        method : 'GET',
                        url : url,
                        cache : CacheFactory.get('kohdeCache')
                    }).then(function successCallback(response) {
                        deferred.resolve(response.data.data);
                    }, function errorCallback(response) {
                        deferred.reject(response);
                    });

                    deferred.promise.cancel = function() {
                        deferred.resolve('Cancelled');
                    };

                    return deferred.promise;
                },
                /**
                 * Haetaan yhden kohteen tiedot
                 * @param Kohteen id
                 * @return Promise - Kohteen tiedot
                 */
                fetchKohde : function(id) {
                    var deferred = $q.defer();
                    var url = CONFIG.API_URL + "kohde/" + id;
                    $http({
                        method : 'GET',
                        url : url
                    }).then(function successCallback(response) {
                    	if(response.data.response.message) {
                    		for(var i = 0; i<response.data.response.message.length; i++) {
                    			if(response.data.response.message[i].indexOf('kyppi404') > -1) {
                    				AlertService.showError(response.data.response.message[i].split(':')[1]);
                    				break;
                    			}
                    		}
                    	}
                        deferred.resolve(response.data.data);
                    }, function errorCallback(response) {
                        deferred.reject(response);
                    });
                    return deferred.promise;
                },
                /**
                 * Hakee kohteen Kyppi-järjestelmästä muinaisjäännöstunnuksella ja tallentaa Mippiin
                 * @param Kohteen muinaisjaannostunnus
                 * @return Promise - Kohteen tiedot
                 */
                tuoKyppiKohde : function(muinaisjaannostunnus) {
                    var deferred = $q.defer();
                    var url = CONFIG.API_URL + "kyppi/tuokohde/" + muinaisjaannostunnus;
                    $http({
                        method : 'GET',
                        url : url
                    }).then(function successCallback(response) {
                        CacheFactory.get('kohdeCache').removeAll();

                        $rootScope.$broadcast('Update_data', {
                            'type' : 'kohde'
                        });
                        deferred.resolve(response.data.data);
                    }, function errorCallback(response) {
                        deferred.reject(response);
                    });
                    return deferred.promise;
                },
                /**
                 * Lisää kohteen Kyppi-järjestelmään muinaisjäännöstunnuksella ja tallentaa muinaisjäännöstunnuksen Mippiin
                 * @param Kohteen muinaisjaannostunnus
                 * @return Promise - Kohteen tiedot
                 */
                lisaaMuinaisjaannos : function(kohdeId) {
                    var deferred = $q.defer();
                    var url = CONFIG.API_URL + "kyppi/lisaamuinaisjaannos/" + kohdeId;
                    $http({
                        method : 'GET',
                        url : url
                    }).then(function successCallback(response) {
                        CacheFactory.get('kohdeCache').removeAll();

                        $rootScope.$broadcast('Update_data', {
                            'type' : 'kohde'
                        });
                        deferred.resolve(response.data.data);
                    }, function errorCallback(response) {
                        deferred.reject(response.data);
                    });
                    return deferred.promise;
                },
                /**
                 * Tallentaa kohteen - luodaan uusi kohde tai päivitetään olemassaolevaa jos id on tiedossa.
                 * @param Kohde (objekti) jonka tiedot tallennetaan
                 * @return Promise - Luodun / Tallennetun kohteen id
                 */
                saveKohde: function(kohde) {
                    var deferred = $q.defer();
                    if (kohde.properties.id) {
                        delete kohde['properties']['luoja'];
                        $http({
                            method : 'PUT',
                            url : CONFIG.API_URL + 'kohde/' + kohde.properties.id,
                            data : kohde
                        }).then(function success(response) {
                            // Clear the cache
                            CacheFactory.get('kohdeCache').removeAll();

                            $rootScope.$broadcast('Update_data', {
                                'type' : 'kohde'
                            });

                            deferred.resolve(response.data.data.properties.id);
                        }, function error(response) {
                            deferred.reject(response.data);
                        });
                    } else {
                        $http({
                            method : 'POST',
                            url : CONFIG.API_URL + 'kohde',
                            data : kohde
                        }).then(function success(response) {
                            // Clear the kohdeCache
                            CacheFactory.get('kohdeCache').removeAll();

                            $rootScope.$broadcast('Update_data', {
                                'type' : 'kohde'
                            });

                            deferred.resolve(response.data.data.properties.id);
                        }, function error(response) {
                            deferred.reject(response);
                        });
                    }
                    return deferred.promise;
                },
                /**
                 * Poistaa kohteen
                 * @param Poistettavan kohteen id
                 * @return Promise - Onnistuessa ei palauteta mitään, virhetilanteessa virheilmoitus
                 */
                deleteKohde : function(kohde) {
                    var deferred = $q.defer();
                    $http({
                        method : 'DELETE',
                        url : CONFIG.API_URL + "kohde/" + kohde.properties.id
                    }).then(function success(response) {

                        // Clear the kohdeCache
                        CacheFactory.get('kohdeCache').removeAll();

                        $rootScope.$broadcast('Update_data', {
                            'type' : 'kohde'
                        });

                        deferred.resolve();
                    }, function error(response) {
                        deferred.reject(response);
                    });
                    return deferred.promise;
                },
                /**
                 * Kiinteistön rakennusten osoitteiden haku kartan aluerajauksella
                 */
                getKiinteistoJaRakennusTiedotForPolygon : function(polygon) {
                	var deferred = $q.defer();
                	$http({
                		method : 'GET',
                		url : CONFIG.API_URL + 'ktj/kiinteistotjarakennukset/?sijainti=' + polygon
                	}).then(function success(response) {

                		deferred.resolve(response.data.data);

                	}, function error(response) {
                		console.log('Virhe: getKiinteistoJaRakennusTiedotForPolygon ');
                        deferred.reject(response);
                    });
                    return deferred.promise;
                },
                haePolygoninKohteet : function(polygon) {
                	var deferred = $q.defer();
                	$http({
                		method : 'GET',
                		url : CONFIG.API_URL + 'kohde/kohteet/polygon/?sijainti=' + polygon
                	}).then(function success(response) {

                		deferred.resolve(response.data.data);

                	}, function error(response) {
                		console.log('Virhe: haePolygoninKohteet ');
                        deferred.reject(response);
                    });
                    return deferred.promise;
                }
            }

            return kohdeServiceFunctions;
        }
]);