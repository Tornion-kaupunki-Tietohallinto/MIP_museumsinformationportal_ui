/**
 * Tutkimusalueiden käyttämä service.
 */

angular.module('mip.tutkimus').factory('TutkimusalueService', [
        '$http', '$q', 'CONFIG', '$location', 'AlertService', 'ListService', 'locale', '$route', 'CacheFactory', '$rootScope',
        function($http, $q, CONFIG, $location, AlertService, ListService, locale, $route, CacheFactory, $rootScope) {

            /**
             * Tutkimusalue cache selaimeen
             */
            CacheFactory('tutkimusalueCache', {
                maxAge : 10 * 60 * 1000, // Items added to this cache expire after 10 minutes
                cacheFlushInterval : 60 * 60 * 1000, // This cache will clear itself every hour
                deleteOnExpire : 'passive', // Cache will do nothing when an item expires. Expired items will remain in the cache until requested, at which point they are removed, and undefined is returned.
                capacity : 50
            // Maximum number of items a cache can hold. Adding more items than the capacity will cause the cache to operate like an LRU cache, removing the least recently used items to stay under capacity. Default: Number.MAX_VALUE.
            });

            var tutkimusalueServiceFunctions = {
                /**
                 * Ei välttämättä tarvita, jos listaussivua ei ole ollenkaan.
                 * Haetaan tutkimusalueet bäkkäristä, palauttaa oletuksena 100kpl
                 * @param Mahdolliset hakuehdot
                 */
                getTutkimusalueet : function(params) {
                    var queryString = ListService.parseQueryString(params);

                    var deferred = $q.defer();
                    var url = CONFIG.API_URL + 'tutkimusalueet/' + queryString;
                    $http({
                        method : 'GET',
                        url : url,
                        cache : CacheFactory.get('tutkimusalueCache')
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
                 * Haetaan yhden tutkimusalueen tiedot
                 * @param Tutkimusalueen id
                 * @return Promise - Kohteen tiedot
                 */
                fetchTutkimusalue : function(id) {
                    var deferred = $q.defer();
                    var url = CONFIG.API_URL + "tutkimusalue/" + id;
                    $http({
                        method : 'GET',
                        url : url
                    }).then(function successCallback(response) {
                        deferred.resolve(response.data.data);
                    }, function errorCallback(response) {
                        deferred.reject(response);
                    });
                    return deferred.promise;
                },

                /**
                 * Tallentaa tutkimusalueen - luodaan uusi ta tai päivitetään olemassaolevaa jos id on tiedossa.
                 * @param Tutkimusalue (objekti) jonka tiedot tallennetaan
                 * @return Promise - Luodun / Tallennetun kohteen id
                 */
                saveTutkimusalue: function(tutkimusalue) {
                    var deferred = $q.defer();
                    if (tutkimusalue.properties.id) {
                        delete tutkimusalue['properties']['luoja'];
                        $http({
                            method : 'PUT',
                            url : CONFIG.API_URL + 'tutkimusalue/' + tutkimusalue.properties.id,
                            data : tutkimusalue
                        }).then(function success(response) {
                            // Clear the cache
                            CacheFactory.get('tutkimusalueCache').removeAll();

                            deferred.resolve(response.data.data.properties.id);
                        }, function error(response) {
                            deferred.reject(response.data);
                        });
                    } else {
                        $http({
                            method : 'POST',
                            url : CONFIG.API_URL + 'tutkimusalue',
                            data : tutkimusalue
                        }).then(function success(response) {
                            // Clear the tutkimusalueCache
                            CacheFactory.get('tutkimusalueCache').removeAll();

                            deferred.resolve(response.data.data.properties.id);
                        }, function error(response) {
                            deferred.reject(response);
                        });
                    }
                    return deferred.promise;
                },
                /**
                 * Poistaa tutkimusalueen
                 * @param Poistettavan tutkimusalueen id
                 * @return Promise - Onnistuessa ei palauteta mitään, virhetilanteessa virheilmoitus
                 */
                deleteTutkimusalue : function(tutkimusalue) {
                    var deferred = $q.defer();
                    $http({
                        method : 'DELETE',
                        url : CONFIG.API_URL + "tutkimusalue/" + tutkimusalue.properties.id
                    }).then(function success(response) {

                        // Clear the tutkimusalueCache
                        CacheFactory.get('tutkimusalueCache').removeAll();

                        deferred.resolve();
                    }, function error(response) {
                        deferred.reject(response);
                    });
                    return deferred.promise;
                },
				/*
				 * Tutkimusalueen nimen oltava uniikki
				 */
				tarkistaTutkimusalueenNimi : function (nimi, tutkimus_id) {
					var deferred = $q.defer();
					var filterParameters = {
						'uniikki_nimi' : 'uniikki_nimi',
						'tutkimusalue_nimi': nimi,
						'ark_tutkimus_id' : tutkimus_id
					};
					var available = false;
					this.getTutkimusalueet(filterParameters).then(function success (data) {
						if (data.features.length == 0) {
							available = true;
						}
						deferred.resolve(available);
					}, function error (data) {
						deferred.reject(available);
					});

					return deferred.promise;
				},
				/*
				 * Löytyykö tutkimukselta haettava tutkimusalue. Palautetaan jos löytyy.
				 */
				tarkistaTutkimuksenTutkimusalue : function (nimi, tutkimus_id) {
					var deferred = $q.defer();
					var filterParameters = {
						'uniikki_nimi' : 'uniikki_nimi',
						'tutkimusalue_nimi': nimi,
						'ark_tutkimus_id' : tutkimus_id
					};

					this.getTutkimusalueet(filterParameters).then(function success (data) {
						var vastaus = null;
						if(data.features.length == 1){
							vastaus = data.features[0].properties;
						}
						deferred.resolve(vastaus);
					}, function error (response) {
						deferred.reject(response);
					});

					return deferred.promise;
				}
            }

            return tutkimusalueServiceFunctions;
        }
]);