/*
 * Konservoinnin hallinta service. Materiaalit, toimenpiteet ja menetelmät
 */
angular.module('mip.konservointi.hallinta', []);

angular.module('mip.konservointi.hallinta').factory('KonservointiHallintaService', [
		'$rootScope', '$http', '$q', 'CONFIG', '$location', 'AlertService', '$route', 'ListService', 'UserService', 'CacheFactory',
		function ($rootScope, $http, $q, CONFIG, $location, AlertService, $route, ListService, UserService, CacheFactory) {

            /**
             * Konservoinnin cache selaimeen
             */
//            CacheFactory('konservointiCache', {
//                maxAge : 10 * 60 * 1000, // Items added to this cache expire after 10 minutes
//                cacheFlushInterval : 60 * 60 * 1000, // This cache will clear itself every hour
//                deleteOnExpire : 'passive', // Cache will do nothing when an item expires. Expired items will remain in the cache until requested, at which point they are removed, and undefined is returned.
//                capacity : 50
//            // Maximum number of items a cache can hold. Adding more items than the capacity will cause the cache to operate like an LRU cache, removing the least recently used items to stay under capacity. Default: Number.MAX_VALUE.
//            });

			return {
				/*
				 * Hae konservoinnin materiaalit
				 */
				haeMateriaalit : function (params) {
					var queryString = ListService.parseQueryString(params);
					var deferred = $q.defer();
					var url = CONFIG.API_URL + 'konservointi/hallinta/materiaalit/' + queryString;
					$http({
						method : 'GET',
						url : url
					}).then(function successCallback (response) {
						deferred.resolve(response.data.data);
					}, function errorCallback (response) {
						if (CONFIG.DEBUG) {
							console.log("konservointiService.haeMateriaalit - virhe : " + response);
						}
						deferred.reject(response);
					});

					deferred.promise.cancel = function () {
                        deferred.resolve('Cancelled');
                    };

					return deferred.promise;
				},
                /**
                 * Tallentaa materiaalin - luodaan uusi tai päivitetään olemassaolevaa jos id on tiedossa.
                 */
                luoTallennaMateriaali: function(materiaali) {
                    var deferred = $q.defer();
                    // Päivitys
                    if (materiaali.properties.id) {
                        $http({
                            method : 'PUT',
                            url : CONFIG.API_URL + 'konservointi/hallinta/materiaali/' + materiaali.properties.id,
                            data : materiaali
                        }).then(function success(response) {

        					CacheFactory.get('valintaCache').removeAll();

                            $rootScope.$broadcast('Update_data', {
                                'type' : 'materiaali'
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
                            url : CONFIG.API_URL + 'konservointi/hallinta/materiaali/',
                            data : materiaali
                        }).then(function success(response) {

                        	CacheFactory.get('valintaCache').removeAll();

                            $rootScope.$broadcast('Update_data', {
                                'type' : 'materiaali'
                            });

                            deferred.resolve(response.data.data);
                        }, function error(response) {
                            deferred.reject(response);
                        });
                    }
                    return deferred.promise;
                },
				/*
				 * Materiaalin nimen oltava uniikki
				 */
				tarkistaMateriaali : function (nimi) {
					var deferred = $q.defer();
					var filterParameters = {
						'uniikki' : 'uniikki',
						'nimi': nimi
					};
					var available = false;

					this.haeMateriaalit(filterParameters).then(function success (data) {
						if (data.features.length == 0) {
							available = true;
						}
						deferred.resolve(available);
					}, function error (data) {
						deferred.reject(available);
					});

					return deferred.promise;
				},
                /**
                 * Poista materiaali
                 */
                poistaMateriaali : function(materiaali) {
                    var deferred = $q.defer();
                    $http({
                        method : 'DELETE',
                        url : CONFIG.API_URL + "konservointi/hallinta/materiaali/" + materiaali.properties.id
                    }).then(function success(response) {
    					CacheFactory.get('valintaCache').removeAll();
                        deferred.resolve();
                    }, function error(response) {
                        deferred.reject(response);
                    });
                    return deferred.promise;
                },
				/**
				 * Hae konservoinnin toimenpiteet
				 */
				haeToimenpiteet : function (params) {
					var queryString = ListService.parseQueryString(params);
					var deferred = $q.defer();
					var url = CONFIG.API_URL + 'konservointi/hallinta/toimenpiteet/' + queryString;
					$http({
						method : 'GET',
						url : url
					}).then(function successCallback (response) {
						deferred.resolve(response.data.data);
					}, function errorCallback (response) {
						if (CONFIG.DEBUG) {
							console.log("konservointiService.haeToimenpiteet - virhe : " + response);
						}
						deferred.reject(response);
					});

					deferred.promise.cancel = function () {
                        deferred.resolve('Cancelled');
                    };

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
                            url : CONFIG.API_URL + 'konservointi/hallinta/toimenpide/' + toimenpide.properties.id,
                            data : toimenpide
                        }).then(function success(response) {

        					CacheFactory.get('valintaCache').removeAll();
                            $rootScope.$broadcast('Update_data', {
                                'type' : 'toimenpide'
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
                            url : CONFIG.API_URL + 'konservointi/hallinta/toimenpide/',
                            data : toimenpide
                        }).then(function success(response) {

        					CacheFactory.get('valintaCache').removeAll();
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
				 * Toimenpiteen nimen oltava uniikki
				 */
				tarkistaToimenpide : function (nimi) {
					var deferred = $q.defer();
					var filterParameters = {
						'uniikki' : 'uniikki',
						'nimi': nimi
					};
					var available = false;

					this.haeToimenpiteet(filterParameters).then(function success (data) {
						if (data.features.length == 0) {
							available = true;
						}
						deferred.resolve(available);
					}, function error (data) {
						deferred.reject(available);
					});

					return deferred.promise;
				},
                /**
                 * Poista toimenpide
                 */
                poistaToimenpide : function(toimenpide) {
                    var deferred = $q.defer();
                    $http({
                        method : 'DELETE',
                        url : CONFIG.API_URL + "konservointi/hallinta/toimenpide/" + toimenpide.properties.id
                    }).then(function success(response) {
    					CacheFactory.get('valintaCache').removeAll();
                        deferred.resolve();
                    }, function error(response) {
                        deferred.reject(response);
                    });
                    return deferred.promise;
                },
				/**
				 * Hae konservoinnin menetelmät
				 */
				haeMenetelmat : function (params) {
					var queryString = ListService.parseQueryString(params);
					var deferred = $q.defer();
					var url = CONFIG.API_URL + 'konservointi/hallinta/menetelmat/' + queryString;
					$http({
						method : 'GET',
						url : url
					}).then(function successCallback (response) {
						deferred.resolve(response.data.data);
					}, function errorCallback (response) {
						if (CONFIG.DEBUG) {
							console.log("konservointiService.haeMenetelmat - virhe : " + response);
						}
						deferred.reject(response);
					});

					return deferred.promise;
				},
                /**
                 * Tallentaa menetelmän - luodaan uusi tai päivitetään olemassaolevaa jos id on tiedossa.
                 */
                luoTallennaMenetelma: function(menetelma) {
                    var deferred = $q.defer();
                    // Päivitys
                    if (menetelma.properties.id) {
                        $http({
                            method : 'PUT',
                            url : CONFIG.API_URL + 'konservointi/hallinta/menetelma/' + menetelma.properties.id,
                            data : menetelma
                        }).then(function success(response) {

        					CacheFactory.get('valintaCache').removeAll();
                            $rootScope.$broadcast('Update_data', {
                                'type' : 'menetelma'
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
                            url : CONFIG.API_URL + 'konservointi/hallinta/menetelma/',
                            data : menetelma
                        }).then(function success(response) {

        					CacheFactory.get('valintaCache').removeAll();
                            $rootScope.$broadcast('Update_data', {
                                'type' : 'menetelma'
                            });

                            deferred.resolve(response.data.data);
                        }, function error(response) {
                            deferred.reject(response);
                        });
                    }
                    return deferred.promise;
                },
				/**
				 * Menetelmän nimen oltava uniikki
				 */
				tarkistaMenetelma : function (nimi) {
					var deferred = $q.defer();
					var filterParameters = {
						'uniikki' : 'uniikki',
						'nimi': nimi
					};
					var available = false;

					this.haeMenetelmat(filterParameters).then(function success (data) {
						if (data.features.length == 0) {
							available = true;
						}
						deferred.resolve(available);
					}, function error (data) {
						deferred.reject(available);
					});

					return deferred.promise;
				},
                /**
                 * Poista menetelma
                 */
                poistaMenetelma : function(menetelma) {
                    var deferred = $q.defer();
                    $http({
                        method : 'DELETE',
                        url : CONFIG.API_URL + "konservointi/hallinta/menetelma/" + menetelma.properties.id
                    }).then(function success(response) {
    					CacheFactory.get('valintaCache').removeAll();
                        deferred.resolve();
                    }, function error(response) {
                        deferred.reject(response);
                    });
                    return deferred.promise;
                }
			}
		}
]);