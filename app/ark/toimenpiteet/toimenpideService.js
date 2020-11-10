/*
 * Toimenpiteiden service
 */
angular.module('mip.toimenpide', []);

angular.module('mip.toimenpide').factory('ToimenpideService', [
		'$rootScope', '$http', '$q', 'CONFIG', '$location', 'AlertService', '$route', 'ListService', 'UserService', 'CacheFactory',
		function ($rootScope, $http, $q, CONFIG, $location, AlertService, $route, ListService, UserService, CacheFactory) {

            /**
             * Toimenpide cache selaimeen
             */
            CacheFactory('toimenpideCache', {
                maxAge : 10 * 60 * 1000, // Items added to this cache expire after 10 minutes
                cacheFlushInterval : 60 * 60 * 1000, // This cache will clear itself every hour
                deleteOnExpire : 'passive', // Cache will do nothing when an item expires. Expired items will remain in the cache until requested, at which point they are removed, and undefined is returned.
                capacity : 50
            // Maximum number of items a cache can hold. Adding more items than the capacity will cause the cache to operate like an LRU cache, removing the least recently used items to stay under capacity. Default: Number.MAX_VALUE.
            });

			return {
				/*
				 * Hae toimenpiteet
				 */
				haeToimenpiteet : function (params) {
					var queryString = ListService.parseQueryString(params);
					var deferred = $q.defer();
					var url = CONFIG.API_URL + 'konservointi/toimenpiteet/' + queryString;
					$http({
						method : 'GET',
						url : url,
						cache : CacheFactory.get('toimenpideCache')
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
				/**
				 * Hakee valitun toimenpiteen
				 */
				haeToimenpide : function (id) {
					var deferred = $q.defer();
					var url = CONFIG.API_URL + "konservointi/toimenpide/" + id;

					$http({
						method : 'GET',
						url : url
					}).then(function successCallback (response) {
						deferred.resolve(response.data.data);
					}, function errorCallback (response) {
						console.log("toimenpideService / haeToimenpide - virhe");
						deferred.reject(response);
					});
					return deferred.promise;
				},
                /**
                 * Tallentaa toimenpiteen - luodaan uusi tai päivitetään olemassaolevaa jos id on tiedossa.
                 */
                luoTallennaToimenpide: function(toimenpide) {
                    var deferred = $q.defer();
                    // Päivitys
                    if (toimenpide.properties.id) {
                        $http({
                            method : 'PUT',
                            url : CONFIG.API_URL + 'konservointi/toimenpide/' + toimenpide.properties.id,
                            data : toimenpide
                        }).then(function success(response) {
                            // Clear the cache
                            CacheFactory.get('toimenpideCache').removeAll();

                            $rootScope.$broadcast('Update_data', {
                                'type' : 'toimenpide'
                            });

                            deferred.resolve(response.data.data);
                        }, function error(response) {
                            deferred.reject(response.data);
                        });
                    }
                    // Luonti, palautetaan luotu
                    else {
                        $http({
                            method : 'POST',
                            url : CONFIG.API_URL + 'konservointi/toimenpide/',
                            data : toimenpide
                        }).then(function success(response) {

                            CacheFactory.get('toimenpideCache').removeAll();

                            $rootScope.$broadcast('Update_data', {
                                'type' : 'toimenpide'
                            });

                            deferred.resolve(response.data.data);
                        }, function error(response) {
                            deferred.reject(response);
                        });
                    }
                    return deferred.promise;
                },
                /**
                 * Poista toimenpide
                 */
                poistaToimenpide : function(toimenpide) {
                    var deferred = $q.defer();
                    $http({
                        method : 'DELETE',
                        url : CONFIG.API_URL + "konservointi/toimenpide/" + toimenpide.properties.id
                    }).then(function success(response) {

                        CacheFactory.get('toimenpideCache').removeAll();
                        $rootScope.$broadcast('Update_data', {
                            'type' : 'toimenpide'
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