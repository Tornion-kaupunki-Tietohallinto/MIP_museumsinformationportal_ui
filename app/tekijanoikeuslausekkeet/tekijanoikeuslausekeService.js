/*
 * Tekijänoikeuslausekkeet service
 */

angular.module('mip.general').factory('TekijanoikeuslausekeService', [
		'$rootScope', '$http', '$q', 'CONFIG', '$location', 'AlertService', 'ListService', 'UserService', 'CacheFactory', 
		function ($rootScope, $http, $q, CONFIG, $location, AlertService, ListService, UserService, CacheFactory) {
			
            /**
             * Kori cache selaimeen
             */
            CacheFactory('tekijanoikeuslausekeCache', {
                maxAge : 10 * 60 * 1000, // Items added to this cache expire after 10 minutes
                cacheFlushInterval : 60 * 60 * 1000, // This cache will clear itself every hour
                deleteOnExpire : 'passive', // Cache will do nothing when an item expires. Expired items will remain in the cache until requested, at which point they are removed, and undefined is returned.
                capacity : 50
            // Maximum number of items a cache can hold. Adding more items than the capacity will cause the cache to operate like an LRU cache, removing the least recently used items to stay under capacity. Default: Number.MAX_VALUE.
            });
			
			return {
				/*
				 * Hae lausekkeet
				 */
				getLausekkeet : function (params) {
					var queryString = ListService.parseQueryString(params);
					var deferred = $q.defer();
					var url = CONFIG.API_URL + 'tekijanoikeuslauseke/' + queryString;
					$http({
						method : 'GET',
						url : url,
						cache: CacheFactory.get('tekijanoikeuslausekeCache')
					}).then(function successCallback (response) {
						deferred.resolve(response.data.data);
					}, function errorCallback (response) {						
						deferred.reject(response);
					});

					return deferred.promise;
				},
				/*
				 * Hakee lausekkeen id:n mukaan
				 */
				fetchLauseke : function (id) {
					var deferred = $q.defer();
					var url = CONFIG.API_URL + 'tekijanoikeuslauseke/' + id;
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
                /*
                 * Tallenna 
                 */
                saveLauseke : function(lauseke) {
                    var deferred = $q.defer();
                    // Päivitys
                    if (lauseke.id) {
                        $http({
                            method : 'PUT',
                            url : CONFIG.API_URL + 'tekijanoikeuslauseke/' + lauseke.id,
                            data : lauseke
                        }).then(function success(response) {
                            // Clear the cache
                            CacheFactory.get('tekijanoikeuslausekeCache').removeAll();

                            deferred.resolve(response.data.data);
                        }, function error(response) {
                            deferred.reject(response.data);
                        });
                    }
                    // Luonti
                    else {
                        $http({
                            method : 'POST',
                            url : CONFIG.API_URL + 'tekijanoikeuslauseke/',
                            data : lauseke
                        }).then(function success(response) {     
                        	// Clear the cache
                            CacheFactory.get('tekijanoikeuslausekeCache').removeAll();
                            
                            deferred.resolve(response.data.data);
                        }, function error(response) {
                            deferred.reject(response);
                        });
                    }
                    return deferred.promise;
                },
                /*
                 * Poista lauseke
                 */
                deleteLauseke : function(lauseke) {
                	var id = lauseke.properties.id;
                    var deferred = $q.defer();
                    $http({
                        method : 'DELETE',
                        url : CONFIG.API_URL + "tekijanoikeuslauseke/" + id
                    }).then(function success(response) {
                    	// Clear the cache
                        CacheFactory.get('tekijanoikeuslausekeCache').removeAll();
                        
                        deferred.resolve();
                    }, function error(response) {
                        deferred.reject(response);
                    });
                    return deferred.promise;
                }
			}
		}
]);