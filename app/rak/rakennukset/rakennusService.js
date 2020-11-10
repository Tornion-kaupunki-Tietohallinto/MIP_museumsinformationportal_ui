/*
 * Service for handling the rakennus CRUD
 */
angular.module('mip.rakennus', []);

angular.module('mip.rakennus').factory(
        'RakennusService',
        [
                '$http', '$q', 'CONFIG', '$location', 'AlertService', '$route', 'ListService', 'locale', 'KiinteistoService', 'CacheFactory', '$rootScope',
                function($http, $q, CONFIG, $location, AlertService, $route, ListService, locale, KiinteistoService, CacheFactory, $rootScope) {
                    
                    CacheFactory('rakennusCache', {
                        maxAge: 10 * 60 * 1000, // Items added to this cache expire after 10 minutes
                        cacheFlushInterval: 60 * 60 * 1000, // This cache will clear itself every hour
                        deleteOnExpire: 'passive', // Cache will do nothing when an item expires. Expired items will remain in the cache until requested, at which point they are removed, and undefined is returned.
                        capacity: 50 //Maximum number of items a cache can hold. Adding more items than the capacity will cause the cache to operate like an LRU cache, removing the least recently used items to stay under capacity. Default: Number.MAX_VALUE.                  
                      });
                    
                    return {
                        /*
                         * Fetches the rakennukset from the backend with the given search words
                         */
                        getRakennukset : function(params) {
                            var queryString = ListService.parseQueryString(params);
                            var deferred = $q.defer();
                            var url = CONFIG.API_URL + 'rakennus/' + queryString;
                            $http({
                                method : 'GET',
                                url : url,
                                cache : CacheFactory.get('rakennusCache')
                            }).then(function successCallback(response) {
                                deferred.resolve(response.data.data);
                            }, function errorCallback(response) {
                                deferred.reject(response);
                            });
                            
                            deferred.promise.cancel = function () {
                                deferred.resolve('Cancelled');
                            };
                            
                            return deferred.promise;
                        },
                        /*
                         * Fetches the rakennus details from the backend when rakennus has been selected
                         */
                        fetchRakennus : function(id) {
                            var deferred = $q.defer();
                            var url = CONFIG.API_URL + "rakennus/" + id;
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
                        saveRakennus : function(rakennus) {
                            var deferred = $q.defer();

                            if (rakennus.properties.id) {
                                $http({
                                    method : 'PUT',
                                    url : CONFIG.API_URL + 'rakennus/' + rakennus.properties.id,
                                    data : rakennus.properties
                                }).then(function success(response) {
                                    
                                    //Clear the cache
                                    CacheFactory.get('rakennusCache').removeAll();                            
                                    
                                    /*
                                     * Broadcast the modified data to scopes
                                     */
                                    $rootScope.$broadcast('Rakennus_modified', {
                                        'id' : rakennus.properties.id
                                    });

                                    // Clear the kylaCache so that the KylaService.getRakennuksetOfKyla returns the updated results
                                    CacheFactory.get('kylaCache').removeAll();
                                    // Clear the kuntacache so that the KuntaService.getRakennuksetOfKunta returns updated results
                                    CacheFactory.get('kuntaCache').removeAll();

                                    $rootScope.$broadcast('Update_data', {
                                        'type' : 'rakennus'
                                    });

                                    deferred.resolve(response.data.data.properties.id);
                                }, function error(response) {
                                    deferred.reject(response);
                                });
                            } else {
                                $http({
                                    method : 'POST',
                                    url : CONFIG.API_URL + 'rakennus',
                                    data : rakennus.properties
                                }).then(function success(response) {

                                    //Clear the cache
                                    CacheFactory.get('rakennusCache').removeAll();                            
                                    
                                    /*
                                     * Broadcast the modified data to scopes
                                     */
                                    $rootScope.$broadcast('Rakennus_modified', {
                                        'id' : rakennus.properties.id
                                    });

                                    // Clear the kylaCache so that the KylaService.getRakennuksetOfKyla returns the updated results
                                    CacheFactory.get('kylaCache').removeAll();
                                    // Clear the kuntacache so that the KuntaService.getRakennuksetOfKunta returns updated results
                                    CacheFactory.get('kuntaCache').removeAll();

                                    $rootScope.$broadcast('Update_data', {
                                        'type' : 'rakennus'
                                    });

                                    deferred.resolve(response.data.data.properties.id);
                                }, function error(response) {
                                    deferred.reject(response);
                                });
                            }
                            return deferred.promise;
                        },
                        deleteRakennus : function(rakennus) {
                            var deferred = $q.defer();
                            $http({
                                method : 'DELETE',
                                url : CONFIG.API_URL + "rakennus/" + rakennus.properties.id
                            }).then(function success(response) {

                                //Clear the cache
                                CacheFactory.get('rakennusCache').removeAll();                            
                                
                                /*
                                 * Broadcast the modified data to scopes
                                 */
                                $rootScope.$broadcast('Rakennus_modified', {
                                    'id' : rakennus.properties.id
                                });

                                // Clear the kylaCache so that the KylaService.getRakennuksetOfKyla returns the updated results
                                CacheFactory.get('kylaCache').removeAll();
                                // Clear the kuntacache so that the KuntaService.getRakennuksetOfKunta returns updated results
                                CacheFactory.get('kuntaCache').removeAll();

                                $rootScope.$broadcast('Update_data', {
                                    'type' : 'rakennus'
                                });

                                deferred.resolve();
                            }, function error(response) {
                                deferred.reject(response);
                            });
                            return deferred.promise;
                        },
                        getPorrashuoneetOfRakennus : function(id, params) {
                            var queryString = ListService.parseQueryString(params);
                            var deferred = $q.defer();
                            var url = CONFIG.API_URL + 'rakennus/' + id + '/porrashuone/' + queryString;
                            $http({
                                method : 'GET',
                                url : url,
                            }).then(function successCallback(response) {
                                deferred.resolve(response.data.data);
                            }, function errorCallback(response) {
                                deferred.reject(response);
                            });

                            return deferred.promise;
                        },
                        /*
                         * Get the rakennus entities of an architect.
                         */
                        getRakennuksetOfSuunnittelija : function(params) {
                            var queryString = ListService.parseQueryString(params);
                            var deferred = $q.defer();
                            var url = CONFIG.API_URL + 'rakennus/' + queryString;

                            $http({
                                method : 'GET',
                                url : url
                            }).then(function successCallback(response) {
                                deferred.resolve(response.data.data.features);
                            }, function errorCallback(response) {
                                deferred.reject(response);
                            });

                            return deferred.promise;
                        },
                        /*
                         * Check if inventointinumero has already been taken.
                         */
                        checkInventointinumero : function(kiinteistoId, rakennus) {
                            var deferred = $q.defer();
                            var available = true;

                            KiinteistoService.getRakennuksetOfKiinteisto(kiinteistoId).then(function success(data) {
                                // Loop all of the kiinteisto's buildings.
                                for (var i = 0; i < data.length; i++) {
                                    var tmpRakennus = data[i];
                                    if (tmpRakennus.properties.inventointinumero == rakennus.properties.inventointinumero) {
                                        if (rakennus.properties.id && (tmpRakennus.properties.id == rakennus.properties.id)) {
                                            available = true;
                                        } else {
                                            available = false;
                                            break;
                                        }
                                    }
                                }

                                deferred.resolve(available);
                            }, function error(data) {
                                available = false;
                                deferred.reject(available);
                            });

                            return deferred.promise;
                        },
                        moveRakennus : function(rakennusId, kiinteistotunnus, palstanumero) {
                            var deferred = $q.defer();

                            $http({
                                method : 'PUT',
                                url : CONFIG.API_URL + 'rakennus/' + rakennusId + '/siirra',
                                data : {
                                    'kiinteistotunnus' : kiinteistotunnus,
                                    'palstanumero' : palstanumero
                                }
                            }).then(function success(response) {
                                /*
                                 * Broadcast the modified data to scopes
                                 */
                                $rootScope.$broadcast('Rakennus_modified', {
                                    'id' : rakennusId
                                });

                                // Clear the kylaCache so that the KylaService.getRakennuksetOfKyla returns the updated results
                                CacheFactory.get('kylaCache').removeAll();
                                // Clear the kuntacache so that the KuntaService.getRakennuksetOfKunta returns updated results
                                CacheFactory.get('kuntaCache').removeAll();

                                $rootScope.$broadcast('Update_data', {
                                    'type' : 'rakennus'
                                });

                                deferred.resolve(response);
                            }, function error(response) {
                                deferred.reject(response);
                            });

                            return deferred.promise;
                        }
                    }
                }
        ]);