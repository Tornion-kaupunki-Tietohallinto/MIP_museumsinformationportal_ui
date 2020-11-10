/*
 * Service for handling the suunnittelija CRUD
 */
angular.module('mip.suunnittelija', []);

angular.module('mip.suunnittelija').factory('SuunnittelijaService', [
		'$http', '$q', 'CONFIG', '$location', 'AlertService', '$route', 'locale', 'ListService', '$rootScope', 'CacheFactory', function($http, $q, CONFIG, $location, AlertService, $route, locale, ListService, $rootScope, CacheFactory) {
			
		    CacheFactory('suunnittelijaCache', {
                maxAge: 10 * 60 * 1000, // Items added to this cache expire after 10 minutes
                cacheFlushInterval: 60 * 60 * 1000, // This cache will clear itself every hour
                deleteOnExpire: 'passive', // Cache will do nothing when an item expires. Expired items will remain in the cache until requested, at which point they are removed, and undefined is returned.
                capacity: 50 //Maximum number of items a cache can hold. Adding more items than the capacity will cause the cache to operate like an LRU cache, removing the least recently used items to stay under capacity. Default: Number.MAX_VALUE.                  
              });
            		    
		    return {
				/*
				 * Fetches the suunnittelijat from the backend with the given search words
				 */
				getSuunnittelijat : function(params) {
					var queryString = ListService.parseQueryString(params);
					var deferred = $q.defer();
					var url = CONFIG.API_URL + 'suunnittelija/' + queryString;
					$http({
						method : 'GET',
						url : url,
                        cache : CacheFactory.get('suunnittelijaCache')
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
				 * Fetches the suunnittelija from the backend for the given rakennus
				 */
				getSuunnittelijatByRakennus : function(rakennusId) {
					var deferred = $q.defer();
					var url = CONFIG.API_URL + 'rakennus/' + rakennusId + '/suunnittelija/';
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
				 * Create rakennus - suunnittelija relation
				 */
				addSuunnittelijaToRakennus : function(rakennusId, suunnittelijaId, lisatiedot) {
					var deferred = $q.defer();
					$http({
						method : 'POST',
						url : CONFIG.API_URL + 'rakennus/' + rakennusId + '/suunnittelija/',
						data : {
							'suunnittelija_id' : suunnittelijaId,
							'lisatiedot' : lisatiedot
						}
					}).then(function success(response) {
						deferred.resolve(response);
					}, function error(response) {
						deferred.reject(response);
					});

					return deferred.promise;
				},
				/*
				 * Delete rakennus - suunnittelija relation
				 */
				deleteSuunnittelijaFromRakennus : function(rakennusId, suunnittelijaId) {
					var deferred = $q.defer();
					$http({
						method : 'DELETE',
						url : CONFIG.API_URL + 'rakennus/' + rakennusId + '/suunnittelija/',
						params : {
							'suunnittelija_id' : suunnittelijaId
						}
					}).then(function success(response) {
						deferred.resolve(response);
					}, function error(err) {
						deferred.reject(err);
					});
					return deferred.promise;
				},
				/*
				 * Fetches the suunnittelija details from the backend when rakennus has been selected
				 */
				fetchSuunnittelija : function(id) {
					var deferred = $q.defer();
					var url = CONFIG.API_URL + "suunnittelija/" + id;
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
				saveSuunnittelija : function(suunnittelija) {
					var deferred = $q.defer();
					if (suunnittelija.properties.id) {
						$http({
							method : 'PUT',
							url : CONFIG.API_URL + 'suunnittelija/' + suunnittelija.properties.id,
							data : suunnittelija.properties
						}).then(function success(response) {	

                            //Clear the cache
                            CacheFactory.get('suunnittelijaCache').removeAll();
                            
						    $rootScope.$broadcast('Update_data', {
                                'type' : 'suunnittelija'
                            });
						    
							deferred.resolve(response);
						}, function error(response) {
							deferred.reject(response);
						});
					} else {
						$http({
							method : 'POST',
							url : CONFIG.API_URL + 'suunnittelija',
							data : suunnittelija.properties
						}).then(function success(response) {

                            //Clear the cache
                            CacheFactory.get('suunnittelijaCache').removeAll();
                            
						    $rootScope.$broadcast('Update_data', {
                                'type' : 'suunnittelija'
                            });
						    
							deferred.resolve(response.data.data.properties.id);
						}, function error(response) {
							deferred.reject(response);
						});
					}

					return deferred.promise;
				},
				deleteSuunnittelija : function(suunnittelija) {
					var deferred = $q.defer();
					$http({
						method : 'DELETE',
						url : CONFIG.API_URL + "suunnittelija/" + suunnittelija.properties.id
					}).then(function success(response) {

                        //Clear the cache
                        CacheFactory.get('suunnittelijaCache').removeAll();
                        
					    $rootScope.$broadcast('Update_data', {
                            'type' : 'suunnittelija'
                        });
					    
						deferred.resolve();
					}, function error(response) {
						deferred.reject(response);
					});
					return deferred.promise;
				},
				getRakennuksetOfSuunnittelija : function(suunnittelijaId) {
				    var deferred = $q.defer();
                    var url = CONFIG.API_URL + "suunnittelija/" + suunnittelijaId + "/rakennus";
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
                /*
                 * Check if nimi has already been taken. We need possibility to search exact match.
                 */
                checkNimi : function(nimi, laji) {
                    var deferred = $q.defer();
                    var filterParameters = {
                        'nimi' : nimi,
                        'tarkka' : 1
                    };
                    var available = false;
                    this.getSuunnittelijat(filterParameters).then(function success(data) {                       
                        deferred.resolve(data);
                    }, function error(data) {
                        deferred.reject(data);
                    });

                    return deferred.promise;
                }
			}
		}
]);