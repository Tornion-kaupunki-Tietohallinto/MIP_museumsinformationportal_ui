/*
 * Konservoinnin käsittely service
 */
angular.module('mip.kasittely', []);

angular.module('mip.kasittely').factory('KasittelyService', [
		'$rootScope', '$http', '$q', 'CONFIG', '$location', 'AlertService', '$route', 'ListService', 'UserService', 'CacheFactory',
		function ($rootScope, $http, $q, CONFIG, $location, AlertService, $route, ListService, UserService, CacheFactory) {

            /**
             * Käsittelyn cache selaimeen
             */
            CacheFactory('kasittelyCache', {
                maxAge : 10 * 60 * 1000, // Items added to this cache expire after 10 minutes
                cacheFlushInterval : 60 * 60 * 1000, // This cache will clear itself every hour
                deleteOnExpire : 'passive', // Cache will do nothing when an item expires. Expired items will remain in the cache until requested, at which point they are removed, and undefined is returned.
                capacity : 50
            // Maximum number of items a cache can hold. Adding more items than the capacity will cause the cache to operate like an LRU cache, removing the least recently used items to stay under capacity. Default: Number.MAX_VALUE.
            });

			return {
				/*
				 * Hae käsittelyt
				 */
				haeKasittelyt : function (params) {
					var queryString = ListService.parseQueryString(params);
					var deferred = $q.defer();
					var url = CONFIG.API_URL + 'konservointi/kasittelyt/' + queryString;
					$http({
						method : 'GET',
						url : url,
						cache : CacheFactory.get('kasittelyCache')
					}).then(function successCallback (response) {
						deferred.resolve(response.data.data);
					}, function errorCallback (response) {
						if (CONFIG.DEBUG) {
							console.log("kasittelyService - fail : " + response);
						}
						deferred.reject(response);
					});

					deferred.promise.cancel = function () {
                        deferred.resolve('Cancelled');
                    };

					return deferred.promise;
				},
				/**
				 * Hakee valitun käsittelyn
				 */
				haeKasittely : function (id) {
					var deferred = $q.defer();
					var url = CONFIG.API_URL + "konservointi/kasittely/" + id;
					$http({
						method : 'GET',
						url : url
					}).then(function successCallback (response) {
						deferred.resolve(response.data.data);
					}, function errorCallback (response) {
						console.log("kasittelyService / haeKasittely - virhe");
						deferred.reject(response);
					});
					return deferred.promise;
				},
                /**
                 * Tallentaa käsittelyn - luodaan uusi tai päivitetään olemassaolevaa jos id on tiedossa.
                 */
                luoTallennaKasittely: function(kasittely) {
                    var deferred = $q.defer();
                    // Päivitys
                    if (kasittely.properties.id) {
                        $http({
                            method : 'PUT',
                            url : CONFIG.API_URL + 'konservointi/kasittely/' + kasittely.properties.id,
                            data : kasittely
                        }).then(function success(response) {
                            // Clear the cache
                            CacheFactory.get('kasittelyCache').removeAll();

        					// Käsittelyt sisältyvät osittain myös valintaCacheen
        					CacheFactory.get('valintaCache').removeAll();

                            $rootScope.$broadcast('Update_data', {
                                'type' : 'kasittely'
                            });

                            deferred.resolve(response.data.data);
                        }, function error(response) {
                            deferred.reject(response.data);
                        });
                    }
                    // Luonti
                    else {
                        $http({
                            method : 'POST',
                            url : CONFIG.API_URL + 'konservointi/kasittely/',
                            data : kasittely
                        }).then(function success(response) {

                            CacheFactory.get('kasittelyCache').removeAll();
        					// Käsittelyt sisältyvät osittain myös valintaCacheen
        					CacheFactory.get('valintaCache').removeAll();

                            $rootScope.$broadcast('Update_data', {
                                'type' : 'kasittely'
                            });

                            deferred.resolve(response.data.data);
                        }, function error(response) {
                            deferred.reject(response);
                        });
                    }
                    return deferred.promise;
                },
                /**
                 * Poista käsittely
                 */
                poistaKasittely : function(kasittely) {
                    var deferred = $q.defer();
                    $http({
                        method : 'DELETE',
                        url : CONFIG.API_URL + "konservointi/kasittely/" + kasittely.properties.id
                    }).then(function success(response) {

                        CacheFactory.get('kasittelyCache').removeAll();

                        deferred.resolve();
                    }, function error(response) {
                        deferred.reject(response);
                    });
                    return deferred.promise;
                },
				/*
				 * Uniikin käsittelytunnuksen tarkistus
				 */
				tarkistaKasittelytunnus : function (kasittelytunnus) {
					var deferred = $q.defer();
					var filterParameters = {
						'uniikki' : 'uniikki',
						'kasittelytunnus': kasittelytunnus
					};
					var available = false;
                    CacheFactory.get('kasittelyCache').removeAll();
					this.haeKasittelyt(filterParameters).then(function success (data) {
						if (data.features.length == 0) {
							available = true;
						}
						deferred.resolve(available);
					}, function error (data) {
						deferred.reject(available);
					});

					return deferred.promise;
				}
			}
		}
]);