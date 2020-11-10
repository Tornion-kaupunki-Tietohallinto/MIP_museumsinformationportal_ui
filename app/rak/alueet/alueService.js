/*
 * Service for handling the kiinteisto CRUD
 */
angular.module('mip.alue', []);

angular.module('mip.alue').factory('AlueService', [
		'$http', '$q', 'CONFIG', '$location', 'AlertService', 'ListService', 'locale', '$route', 'CacheFactory', '$rootScope', function ($http, $q, CONFIG, $location, AlertService, ListService, locale, $route, CacheFactory, $rootScope) {
			 
		    CacheFactory('alueCache', {
                maxAge: 10 * 60 * 1000, // Items added to this cache expire after 10 minutes
                cacheFlushInterval: 60 * 60 * 1000, // This cache will clear itself every hour
                deleteOnExpire: 'passive', // Cache will do nothing when an item expires. Expired items will remain in the cache until requested, at which point they are removed, and undefined is returned.
                capacity: 50 //Maximum number of items a cache can hold. Adding more items than the capacity will cause the cache to operate like an LRU cache, removing the least recently used items to stay under capacity. Default: Number.MAX_VALUE.                  
              });
		    
		    return {
				/*
				 * Fetches the alueet from the backend with the given search words (100kpl)
				 */
				getAlueet : function (params) {
					var queryString = '';

					for ( var parameter in params) {
						if (params.hasOwnProperty(parameter)) {
							if (queryString.length == 0) {
								queryString = '?' + parameter + "=" + params[parameter];
							} else {
								queryString += '&' + parameter + "=" + params[parameter];
							}
						}
					}

					var deferred = $q.defer();
					var url = CONFIG.API_URL + 'alue/' + queryString;
					$http({
						method : 'GET',
						url : url,
                        cache : CacheFactory.get('alueCache')
					}).then(function successCallback (response) {						
						deferred.resolve(response.data.data);
					}, function errorCallback (response) {
						deferred.reject(response);
					});
					
					deferred.promise.cancel = function () {
				        deferred.resolve('Cancelled');
				      };

					return deferred.promise;
				},
				/*
				 * Fetches the kiinteisto details from the backend when kiinteisto has been selected
				 */
				fetchAlue : function (id) {
					var deferred = $q.defer();
					var url = CONFIG.API_URL + "alue/" + id;
					$http({
						method : 'GET',
						url : url
					}).then(function successCallback (response) {
						deferred.resolve(response.data.data);
					}, function errorCallback (response) {						
						deferred.reject(response);
					});
					return deferred.promise;
				},
				saveAlue : function (alue) {
					var deferred = $q.defer();
					if (alue.properties.id) {
						$http({
							method : 'PUT',
							url : CONFIG.API_URL + 'alue/' + alue.properties.id,
							data : alue.properties
						}).then(function success (response) {
						    
						    //Clear the cache
                            CacheFactory.get('alueCache').removeAll();                            
						    
						    //Clear the kylaCache so that the KylaService.getAlueetOfKyla returns the updated results
	                        CacheFactory.get('kylaCache').removeAll();
						    //Clear the kuntacache so that the KuntaService.getAlueetOfKunta returns updated results						  
                            CacheFactory.get('kuntaCache').removeAll();
                            		
                            $rootScope.$broadcast('Update_data', {
                                'type' : 'alue'
                            });
                            
							deferred.resolve(response.data.data.properties.id);
						}, function error (response) {
							deferred.reject(response.data);
						});
					} else {
						$http({
							method : 'POST',
							url : CONFIG.API_URL + 'alue',
							data : alue.properties
						}).then(function success (response) {
						    
                            //Clear the alueCache
                            CacheFactory.get('alueCache').removeAll();
						    
						    //Clear the kylaCache so that the KylaService.getAlueetOfKyla returns the updated results
                            CacheFactory.get('kylaCache').removeAll();
                            //Clear the kuntacache so that the KuntaService.getAlueetOfKunta returns updated results                          
                            CacheFactory.get('kuntaCache').removeAll();
						    
                            $rootScope.$broadcast('Update_data', {
                                'type' : 'alue'
                            });
                            
							deferred.resolve(response.data.data.properties.id);
						}, function error (response) {							
							deferred.reject(response);
						});
					}
					return deferred.promise;
				},
				deleteAlue : function (alue) {
					var deferred = $q.defer();
					$http({
						method : 'DELETE',
						url : CONFIG.API_URL + "alue/" + alue.properties.id
					}).then(function success (response) {

                        //Clear the alueCache
                        CacheFactory.get('alueCache').removeAll();
					    
					    //Clear the kylaCache so that the KylaService.getAlueetOfKyla returns the updated results
                        CacheFactory.get('kylaCache').removeAll();
                        //Clear the kuntacache so that the KuntaService.getAlueetOfKunta returns updated results                          
                        CacheFactory.get('kuntaCache').removeAll();
					    
                        $rootScope.$broadcast('Update_data', {
                            'type' : 'alue'
                        });
                        
						deferred.resolve();
					}, function error (response) {
						deferred.reject(response);
					});
					return deferred.promise;
				},
				getArvoalueetOfAlue : function (id, params) {
					var queryString = ListService.parseQueryString(params);
					var deferred = $q.defer();
					var url = CONFIG.API_URL + 'alue/' + id + '/arvoalue/' + queryString;
					$http({
						method : 'GET',
						url : url,
					}).then(function successCallback (response) {
						deferred.resolve(response.data.data);
					}, function errorCallback (response) {
						deferred.reject(response);
					});

					return deferred.promise;
				}
			}
		}
]);