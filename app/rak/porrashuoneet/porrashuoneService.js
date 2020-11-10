/*
 * Service for handling the porrashuone CRUD
 */

angular.module('mip.porrashuone', []);

angular.module('mip.porrashuone').factory('PorrashuoneService', [
		'$http', '$q', 'CONFIG', '$location', 'AlertService', '$route', '$rootScope', 'locale', 'ListService', 'CacheFactory', function ($http, $q, CONFIG, $location, AlertService, $route, $rootScope, locale, ListService, CacheFactory) {
			
		    CacheFactory('porrashuoneCache', {
                maxAge: 10 * 60 * 1000, // Items added to this cache expire after 10 minutes
                cacheFlushInterval: 60 * 60 * 1000, // This cache will clear itself every hour
                deleteOnExpire: 'passive', // Cache will do nothing when an item expires. Expired items will remain in the cache until requested, at which point they are removed, and undefined is returned.
                capacity: 50 //Maximum number of items a cache can hold. Adding more items than the capacity will cause the cache to operate like an LRU cache, removing the least recently used items to stay under capacity. Default: Number.MAX_VALUE.                  
              });
		    
		    return {
				/*
				 * Fetches the porrashuoneet from the backend with the given search words
				 */
				getPorrashuoneet : function (params) {
					var queryString = ListService.parseQueryString(params);	
					var deferred = $q.defer();
					var url = CONFIG.API_URL + 'porrashuone/' + queryString;
					$http({
						method : 'GET',
						url : url,
                        cache : CacheFactory.get('porrashuoneCache')
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
				 * Fetches the porrashuone details from the backend when porrashuone has been selected
				 */
				fetchPorrashuone : function (id) {
					var deferred = $q.defer();
					var url = CONFIG.API_URL + "porrashuone/" + id;
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
				savePorrashuone : function (porrashuone) {
					var deferred = $q.defer();
				
					if (porrashuone.properties.id) {
						$http({
							method : 'PUT',
							url : CONFIG.API_URL + 'porrashuone/' + porrashuone.properties.id,
							data : porrashuone.properties
						}).then(function success (response) {
						    
						    //Clear the cache
                            CacheFactory.get('porrashuoneCache').removeAll();                            
                            
						    
							/*
							 * Broadcast the modified data to scopes
							 */
							$rootScope.$broadcast('Porrashuone_modified', {
								'id' : porrashuone.properties.id
							});
							
							$rootScope.$broadcast('Update_data', {
                                'type' : 'porrashuone'
                            });

							deferred.resolve(response);
						}, function error (response) {							
							deferred.reject(response);
						});
					} else {
						$http({
							method : 'POST',
							url : CONFIG.API_URL + 'porrashuone',
							data : porrashuone.properties
						}).then(function success (response) {

                            //Clear the cache
                            CacheFactory.get('porrashuoneCache').removeAll();                            
                            
                            /*
							 * Broadcast the modified data to scopes
							 */
							$rootScope.$broadcast('Porrashuone_modified', {
								'id' : porrashuone.properties.id
							});
							
							$rootScope.$broadcast('Update_data', {
                                'type' : 'porrashuone'
                            });
							
							deferred.resolve(response.data.data.properties.id);
						}, function error (response) {							
							deferred.reject(response);
						});
					}
					return deferred.promise;
				},
				deletePorrashuone : function (porrashuone) {
					var deferred = $q.defer();
					
					$http({
						method : 'DELETE',
						url : CONFIG.API_URL + "porrashuone/" + porrashuone.properties.id
					}).then(function success (response) {						

                        //Clear the cache
                        CacheFactory.get('porrashuoneCache').removeAll();                            
                                                
                        /*
						 * Broadcast the modified data to scopes
						 */
						$rootScope.$broadcast('Porrashuone_modified', {
							'id' : porrashuone.properties.id
						});
						
						$rootScope.$broadcast('Update_data', {
                            'type' : 'porrashuone'
                        });
						
						deferred.resolve();
					}, function error (response) {						
						deferred.reject(response);
					});
					return deferred.promise;
				}
			}
		}
]);