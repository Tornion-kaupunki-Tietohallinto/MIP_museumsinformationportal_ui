/*
 * Service for handling the kunta CRUD
 */
angular.module('mip.kunta', []);

angular.module('mip.kunta').factory('KuntaService', [
		'$http', '$q', 'CONFIG', '$location', 'AlertService', 'ListService', 'locale', 'CacheFactory', '$route', '$rootScope', function($http, $q, CONFIG, $location, AlertService, ListService, locale, CacheFactory, $route, $rootScope) {
		    
		    CacheFactory('kuntaCache', {
		        maxAge: 10 * 60 * 1000, // Items added to this cache expire after 10 minutes
		        cacheFlushInterval: 60 * 60 * 1000, // This cache will clear itself every hour
		        deleteOnExpire: 'passive', // Cache will do nothing when an item expires. Expired items will remain in the cache until requested, at which point they are removed, and undefined is returned.
		        capacity: 50 //Maximum number of items a cache can hold. Adding more items than the capacity will cause the cache to operate like an LRU cache, removing the least recently used items to stay under capacity. Default: Number.MAX_VALUE. 		           
		      });
		    		    
			return {
				/*
				 * Fetches all kunta entities from the backend with the given search words
				 */
				getKunnat : function(params) {
					var queryString = ListService.parseQueryString(params);

					var deferred = $q.defer();
					var url = CONFIG.API_URL + 'kunta/' + queryString;
					
					$http({
						method : 'GET',
						url : url,
						cache : CacheFactory.get('kuntaCache')
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
				 * Fetches the kunta details from the backend and sets properties.kunta.
				 */
				fetchKunta : function(id) {
					var deferred = $q.defer();
					var url = CONFIG.API_URL + 'kunta/' + id;
					$http({
						method : 'GET',
						url : url
					}).then(function success(response) {
						deferred.resolve(response.data.data);
					}, function error(response) {						
						deferred.reject(response);
					});
					return deferred.promise;
				},
				/*
				 * Get all the kyla entities of a given kunta
				 */
				getKylatOfKunta : function(kuntaId, params) {
					var deferred = $q.defer();
					var queryString = ListService.parseQueryString(params);
					
					var url = CONFIG.API_URL + 'kunta/' + kuntaId + '/kyla/' + queryString;
					$http({
						method : 'GET',
						url : url,
						cache: CacheFactory.get('kuntaCache')
					}).then(function successCallback(response) {
						deferred.resolve(response.data.data);
					}, function errorCallback(response) {
						deferred.reject(response);
					});

					return deferred.promise;
				},
				/*
				 * Get all the kyla entities of a given kunta
				 */
				getRakennuksetOfKunta : function(kuntaId, params) {
					var deferred = $q.defer();
					var queryString = ListService.parseQueryString(params);

					var url = CONFIG.API_URL + 'kunta/' + kuntaId + '/rakennus/' + queryString;
					$http({
						method : 'GET',
						url : url,
						cache: CacheFactory.get('kuntaCache')
					}).then(function successCallback(response) {
						deferred.resolve(response.data.data);
					}, function errorCallback(response) {						
						deferred.reject(response);
					});

					return deferred.promise;
				},
				/*
				 * Get all the kyla entities of a given kunta
				 */
				getKiinteistotOfKunta : function(kuntaId, params) {
					var deferred = $q.defer();
					var queryString = ListService.parseQueryString(params);

					var url = CONFIG.API_URL + 'kunta/' + kuntaId + '/kiinteisto/' + queryString;
					$http({
						method : 'GET',
						url : url,
						cache: CacheFactory.get('kuntaCache')
					}).then(function successCallback(response) {
						deferred.resolve(response.data.data);
					}, function errorCallback(response) {					
						deferred.reject(response);
					});

					return deferred.promise;
				},
				/*
				 * Get all the kyla entities of a given kunta
				 */
				getAlueetOfKunta : function(kuntaId, params) {
					var deferred = $q.defer();
					var queryString = ListService.parseQueryString(params);

					var url = CONFIG.API_URL + 'kunta/' + kuntaId + '/alue/' + queryString;
					$http({
						method : 'GET',
						url : url,
						cache: CacheFactory.get('kuntaCache')
					}).then(function successCallback(response) {
						deferred.resolve(response.data.data);
					}, function errorCallback(response) {						
						deferred.reject(response); 
					});

					return deferred.promise;
				},/*
                 * Get all the kyla entities of a given kunta
                 */
                getArvoalueetOfKunta : function(kuntaId, params) {
                    var deferred = $q.defer();
                    var queryString = ListService.parseQueryString(params);

                    var url = CONFIG.API_URL + 'kunta/' + kuntaId + '/arvoalue/' + queryString;
                    $http({
                        method : 'GET',
                        url : url,
                        cache: CacheFactory.get('kuntaCache')
                    }).then(function successCallback(response) {
                        deferred.resolve(response.data.data);
                    }, function errorCallback(response) {                       
                        deferred.reject(response); 
                    });

                    return deferred.promise;
                },
				saveKunta : function(kunta) {
					var deferred = $q.defer();
					
					if (kunta.properties.id) {
						$http({
							method : 'PUT',
							url : CONFIG.API_URL + 'kunta/' + kunta.properties.id,
							data : kunta.properties
						}).then(function success(response) {
						    
						    //Remove the items from the cache
						    CacheFactory.get('kuntaCache').removeAll();
						    
						    $rootScope.$broadcast('Update_data', {
                                'type' : 'kunta'
                            });
						    
							deferred.resolve(response);
						}, function error(response) {							
							deferred.reject(response);
						});
					} else {
						$http({
							method : 'POST',
							url : CONFIG.API_URL + 'kunta',
							data : kunta.properties
						}).then(function success(response) {	
						    
						    //Remove the items from the cache
						    CacheFactory.get('kuntaCache').removeAll();
						    
						    $rootScope.$broadcast('Update_data', {
                                'type' : 'kunta'
                            });
                            
							deferred.resolve(response.data.data.properties.id);
						}, function error(response) {							
							deferred.reject(response);
						});
					}
					return deferred.promise;
				},
				deleteKunta : function(kunta) {
					var deferred = $q.defer();
					
					$http({
						method : 'DELETE',
						url : CONFIG.API_URL + "kunta/" + kunta.properties.id
					}).then(function success(response) {

                        //Clear the items from the cache
					    CacheFactory.get('kuntaCache').removeAll();
					    
					    $rootScope.$broadcast('Update_data', {
                            'type' : 'kunta'
                        });
                        
						deferred.resolve();
					}, function error(response) {
						deferred.reject(response);
					});
					return deferred.promise;
				}
			}
		}
]);