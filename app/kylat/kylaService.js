/*
 * Service for handling the kyla CRUD
 */
angular.module('mip.kyla', []);

angular.module('mip.kyla').factory('KylaService', [
		'$http', '$q', 'CONFIG', '$location', 'AlertService', '$route', 'locale', 'ListService', 'CacheFactory', '$rootScope',
		function($http, $q, CONFIG, $location, AlertService, $route, locale, ListService, CacheFactory, $rootScope) {
		    
		    CacheFactory('kylaCache', {
		        maxAge: 10 * 60 * 1000, // Items added to this cache expire after 10 minutes
                cacheFlushInterval: 60 * 60 * 1000, // This cache will clear itself every hour
                deleteOnExpire: 'passive', // Cache will do nothing when an item expires. Expired items will remain in the cache until requested, at which point they are removed, and undefined is returned.
                capacity: 50 //Maximum number of items a cache can hold. Adding more items than the capacity will cause the cache to operate like an LRU cache, removing the least recently used items to stay under capacity. Default: Number.MAX_VALUE.                  
              });
		    
		    
			return {
				/*
				 * Fetches the kylat from the backend with the given
				 * search words
				 */
				getKylat : function(params) {
					var queryString = ListService.parseQueryString(params);				
					var deferred = $q.defer();
					var url = CONFIG.API_URL + 'kyla/' + queryString;
					$http({
						method : 'GET',
						url : url,
						cache : CacheFactory.get('kylaCache')
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
				 * Fetches the kyla details from the backend when
				 * kyla has been selected
				 */
				fetchKyla: function(id) {
					var deferred = $q.defer();
					var url = CONFIG.API_URL + "kyla/" + id;
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
				saveKyla : function(kyla) {
					var deferred = $q.defer();
					
					if(kyla.properties.id) {
						$http({
							method: 'PUT',
							url: CONFIG.API_URL + 'kyla/' + kyla.properties.id,
							data: kyla.properties
						}).then(function success(response) {							    
						    //Clear the kylacache so that the updated results are returned
						    CacheFactory.get('kylaCache').removeAll();
                            //Clear the kuntacache so that the KuntaService.getKylatOfKunta returns updated results                          
                            CacheFactory.get('kuntaCache').removeAll(); 
                          
                            $rootScope.$broadcast('Update_data', {
                                'type' : 'kyla'
                            });                            
                          
							deferred.resolve(response);
						}, function error(response) {							
							deferred.reject(response);
						});
					} else {
						$http({
							method: 'POST',
							url: CONFIG.API_URL + 'kyla',
							data: kyla.properties
						}).then(function success(response) {
						    //Clear the kylacache
						    CacheFactory.get('kylaCache').removeAll();
                            //Clear the kuntacache so that the KuntaService.getKylatOfKunta returns updated results                          
                            CacheFactory.get('kuntaCache').removeAll();
                            
                            $rootScope.$broadcast('Update_data', {
                                'type' : 'kyla'
                            });
                            
							deferred.resolve(response.data.data.properties.id);
						}, function error(response) {							
							deferred.reject(response);
						});	
					}
					return deferred.promise;
				},
				deleteKyla : function(kyla) {
					var deferred = $q.defer();					
					$http({
						method : 'DELETE',
						url : CONFIG.API_URL + "kyla/" + kyla.properties.id
					}).then(function success(response) {		
					    //Clear the kylaCache
					    CacheFactory.get('kylaCache').removeAll();
                        //Clear the kuntacache so that the KuntaService.getKylatOfKunta returns updated results                          
                        CacheFactory.get('kuntaCache').removeAll();
                        
                        $rootScope.$broadcast('Update_data', {
                            'type' : 'kyla'
                        });
                        
						deferred.resolve();
					}, function error(response) {						
						deferred.reject(response);
					});
					return deferred.promise;
				},
				/*
				 * Get all the kiinteisto entities of a given kyla
				 */
				getKiinteistotOfKyla : function(kylaId, params) {
					var deferred = $q.defer();
					var queryString = ListService.parseQueryString(params);

					var url = CONFIG.API_URL + 'kyla/' + kylaId + '/kiinteisto/' + queryString;
					$http({
						method : 'GET',
						url : url,
						cache: CacheFactory.get('kylaCache')
					}).then(function successCallback(response) {
						deferred.resolve(response.data.data);
					}, function errorCallback(response) {					
						deferred.reject(response);
					});

					return deferred.promise;
				},
				getRakennuksetOfKyla : function(kylaId, params) {
					var deferred = $q.defer();
					var queryString = ListService.parseQueryString(params);

					var url = CONFIG.API_URL + 'kyla/' + kylaId + '/rakennus/' + queryString;
					$http({
						method : 'GET',
						url : url,
						cache: CacheFactory.get('kylaCache')
					}).then(function successCallback(response) {
						deferred.resolve(response.data.data);
					}, function errorCallback(response) {					
						deferred.reject(response);
					});

					return deferred.promise;
				},
				getAlueetOfKyla : function(kylaId, params) {
					var deferred = $q.defer();
					var queryString = ListService.parseQueryString(params);

					var url = CONFIG.API_URL + 'kyla/' + kylaId + '/alue/' + queryString;
					$http({
						method : 'GET',
						url : url,
						cache: CacheFactory.get('kylaCache')
					}).then(function successCallback(response) {
						deferred.resolve(response.data.data);
					}, function errorCallback(response) {					
						deferred.reject(response);
					});

					return deferred.promise;
				},
				getArvoalueetOfKyla : function(kylaId, params) {
					var deferred = $q.defer();
					var queryString = ListService.parseQueryString(params);

					var url = CONFIG.API_URL + 'kyla/' + kylaId + '/arvoalue/' + queryString;
					$http({
						method : 'GET',
						url : url,
						cache: CacheFactory.get('kylaCache')
					}).then(function successCallback(response) {
						deferred.resolve(response.data.data);
					}, function errorCallback(response) {					
						deferred.reject(response);
					});

					return deferred.promise;
				}
	   		}
		}
]);