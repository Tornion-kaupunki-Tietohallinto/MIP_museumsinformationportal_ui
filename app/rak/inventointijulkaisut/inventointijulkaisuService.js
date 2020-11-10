/*
 * Service for handling the julkaisuCRUD
 */

angular.module('mip.inventointijulkaisu', []);


angular.module('mip.inventointijulkaisu').factory('InventointijulkaisuService', [
		        '$http', '$q', 'CONFIG', 'AlertService', 'ListService', 'locale', '$route', 'CacheFactory', '$rootScope', 
		function ($http, $q, CONFIG, AlertService, ListService, locale, $route, CacheFactory, $rootScope) {
			 
		    CacheFactory('inventointijulkaisuCache', {
                maxAge: 10 * 60 * 1000, // Items added to this cache expire after 10 minutes
                cacheFlushInterval: 60 * 60 * 1000, // This cache will clear itself every hour
                deleteOnExpire: 'passive', // Cache will do nothing when an item expires. Expired items will remain in the cache until requested, at which point they are removed, and undefined is returned.
                capacity: 50 //Maximum number of items a cache can hold. Adding more items than the capacity will cause the cache to operate like an LRU cache, removing the least recently used items to stay under capacity. Default: Number.MAX_VALUE.                  
              });
		    
		    return {
				/*
				 * Fetches the alueet from the backend with the given search words (100kpl)
				 */
				getInventointijulkaisut : function (params) {
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

					/*
					 * uncomment for Mäntymäki if (queryString == '') { queryString = "?rivit=50&rivi=1450" }
					 */

					var deferred = $q.defer();
					var url = CONFIG.API_URL + 'inventointijulkaisu/' + queryString;
					$http({
						method : 'GET',
						url : url,
                        cache : CacheFactory.get('inventointijulkaisuCache')
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
				fetchInventointijulkaisu : function (id) {
					var deferred = $q.defer();
					var url = CONFIG.API_URL + "inventointijulkaisu/" + id;
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
				saveInventointijulkaisu: function (inventointijulkaisu) {
					var deferred = $q.defer();
					if (inventointijulkaisu.properties.id) {
						$http({
							method : 'PUT',
							url : CONFIG.API_URL + 'inventointijulkaisu/' + inventointijulkaisu.properties.id,
							data : inventointijulkaisu.properties
						}).then(function success (response) {
						    
						    //Clear the cache
                            CacheFactory.get('inventointijulkaisuCache').removeAll();               
						   		
                            $rootScope.$broadcast('Update_data', {
                                'type' : 'inventointijulkaisu'
                            });
                            
							deferred.resolve(response.data.data.properties.id);
						}, function error (response) {
							deferred.reject(response.data);
						});
					} else {
						$http({
							method : 'POST',
							url : CONFIG.API_URL + 'inventointijulkaisu',
							data : inventointijulkaisu.properties
						}).then(function success (response) {
						    
                            //Clear the alueCache
                            CacheFactory.get('inventointijulkaisuCache').removeAll();
						    
                            $rootScope.$broadcast('Update_data', {
                                'type' : 'inventointijulkaisu'
                            });
                            
							deferred.resolve(response.data.data.properties.id);
						}, function error (response) {							
							deferred.reject(response);
						});
					}
					return deferred.promise;
				},
				deleteInventointijulkaisu : function (inventointijulkaisu) {
					var deferred = $q.defer();
					$http({
						method : 'DELETE',
						url : CONFIG.API_URL + "inventointijulkaisu/" + inventointijulkaisu.properties.id
					}).then(function success (response) {

                        //Clear the alueCache
                        CacheFactory.get('inventointijulkaisuCache').removeAll();
					    
                        $rootScope.$broadcast('Update_data', {
                            'type' : 'inventointijulkaisu'
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