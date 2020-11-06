/*
 * Service for handling the inventointiprojekti CRUD
 */
angular.module('mip.inventointiprojekti', []);

angular.module('mip.inventointiprojekti').factory('InventointiprojektiService', [
		'$http', '$q', 'CONFIG', '$location', 'AlertService', '$route', 'ListService', 'locale', '$rootScope', 'CacheFactory', function($http, $q, CONFIG, $location, AlertService, $route, ListService, locale, $rootScope, CacheFactory) {
		    
		    CacheFactory('inventointiprojektiCache', {
                maxAge: 10 * 60 * 1000, // Items added to this cache expire after 10 minutes
                cacheFlushInterval: 60 * 60 * 1000, // This cache will clear itself every hour
                deleteOnExpire: 'passive', // Cache will do nothing when an item expires. Expired items will remain in the cache until requested, at which point they are removed, and undefined is returned.
                capacity: 50 //Maximum number of items a cache can hold. Adding more items than the capacity will cause the cache to operate like an LRU cache, removing the least recently used items to stay under capacity. Default: Number.MAX_VALUE.                  
              });
		    
			return {
				/*
				 * Fetches the inventointiprojektit from the backend with the given search words
				 */
				getInventointiprojektit : function(params) {
					var queryString = ListService.parseQueryString(params);
					var deferred = $q.defer();
					var url = CONFIG.API_URL + 'inventointiprojekti/' + queryString;
					$http({
						method : 'GET',
						url : url,
                        cache : CacheFactory.get('inventointiprojektiCache')
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
				 * Fetches the inventointiprojektit from the backend for the given kiinteisto
				 */
				getInventointiprojektitByKiinteisto : function(kiinteistoId) {
					var deferred = $q.defer();
					var url = CONFIG.API_URL + 'kiinteisto/' + kiinteistoId + '/inventointiprojekti/';
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
				 * Create kiinteisto - inventoryproject relation
				 */
				addKiinteistoToInventointiprojekti : function(kiinteistoId, inventointiprojektiId, kenttaPaiva, inventoijaId, inventointiPaiva) {
					var deferred = $q.defer();
					$http({
						method : 'POST',
						url : CONFIG.API_URL + 'kiinteisto/' + kiinteistoId + '/inventointiprojekti/',
						data : {
							'inventointiprojekti_id' : inventointiprojektiId,
							'kenttapaiva' : kenttaPaiva,
							'inventointipaiva' : inventointiPaiva,
							'inventoija_id' : inventoijaId
						}
					}).then(function success(response) {
						deferred.resolve(response);
					}, function error(response) {
						deferred.reject(response);
					});

					return deferred.promise;
				},
				/*
				 * Delete kiinteistö - inventoryproject relation
				 */
				deleteKiinteistoFromInventointiprojekti : function(kiinteistoId, inventointiprojektiId) {
					var deferred = $q.defer();
					$http({
						method : 'DELETE',
						url : CONFIG.API_URL + 'kiinteisto/' + kiinteistoId + '/inventointiprojekti/',
						params : {
							'inventointiprojekti_id' : inventointiprojektiId
						}
					}).then(function success(response) {
						deferred.resolve(response);
					}, function error(err) {
						deferred.reject(err);
					});
					return deferred.promise;
				},
				/*
				 * Fetches the inventointiprojekti details from the backend when inventointiprojekti has been selected
				 */
				fetchInventointiprojekti : function(id) {
					var deferred = $q.defer();
					var url = CONFIG.API_URL + "inventointiprojekti/" + id;
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
				saveInventointiprojekti : function(inventointiprojekti) {
					var deferred = $q.defer();
					if (inventointiprojekti.properties.id) {
						$http({
							method : 'PUT',
							url : CONFIG.API_URL + 'inventointiprojekti/' + inventointiprojekti.properties.id,
							data : inventointiprojekti.properties
						}).then(function success(response) {

                            //Clear the cache
                            CacheFactory.get('inventointiprojektiCache').removeAll();                            
                            
						    $rootScope.$broadcast('Update_data', {
	                            'type' : 'inventointiprojekti'
	                        });
						    
							deferred.resolve(response);
						}, function error(response) {
							deferred.reject(response);
						});
					} else {
						$http({
							method : 'POST',
							url : CONFIG.API_URL + 'inventointiprojekti',
							data : inventointiprojekti.properties
						}).then(function success(response) {

                            //Clear the cache
                            CacheFactory.get('inventointiprojektiCache').removeAll();                            
                            
						    $rootScope.$broadcast('Update_data', {
                                'type' : 'inventointiprojekti'
                            });
						    
							deferred.resolve(response.data.data.properties.id);
						}, function error(response) {
							deferred.reject(response);
						});
					}
					return deferred.promise;
				},
				deleteInventointiprojekti : function(inventointiprojekti) {
					var deferred = $q.defer();
					$http({
						method : 'DELETE',
						url : CONFIG.API_URL + "inventointiprojekti/" + inventointiprojekti.properties.id
					}).then(function success(response) {

                        //Clear the cache
                        CacheFactory.get('inventointiprojektiCache').removeAll();                            
                        
					    $rootScope.$broadcast('Update_data', {
                            'type' : 'inventointiprojekti'
                        });
					    
						deferred.resolve();
					}, function error(response) {
						deferred.reject(response);
					});
					return deferred.promise;
				},
				getKiinteistotOfInventointiprojekti : function(id, params) {
					var queryString = ListService.parseQueryString(params);
					var deferred = $q.defer();
					var url = CONFIG.API_URL + 'inventointiprojekti/' + id + '/kiinteisto/' + queryString;
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
				getAlueetOfInventointiprojekti : function(id, params) {
					var queryString = ListService.parseQueryString(params);
					var deferred = $q.defer();
					var url = CONFIG.API_URL + 'inventointiprojekti/' + id + '/alue/' + queryString;
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
				getArvoalueetOfInventointiprojekti : function(id, params) {
					var queryString = ListService.parseQueryString(params);
					var deferred = $q.defer();
					var url = CONFIG.API_URL + 'inventointiprojekti/' + id + '/arvoalue/' + queryString;
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
				getInventoijatOfInventointiprojekti : function(id, params) {
					var queryString = ListService.parseQueryString(params);
					var deferred = $q.defer();
					var url = CONFIG.API_URL + 'inventointiprojekti/' + id + '/inventoija/' + queryString;
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
				getMuutInventoijatOfInventointiprojekti : function(id, params) {
					var queryString = ListService.parseQueryString(params);
					var deferred = $q.defer();
					var url = CONFIG.API_URL + 'inventointiprojekti/' + id + '/muutinventoijat/' + queryString;
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
				getRakennuksetOfInventointiprojekti : function(id, params) {
					var queryString = ListService.parseQueryString(params);
					var deferred = $q.defer();
					var url = CONFIG.API_URL + 'inventointiprojekti/' + id + '/rakennus/' + queryString;
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
				getKylatOfInventointiprojekti : function(id, params) {
					var queryString = ListService.parseQueryString(params);
					var deferred = $q.defer();
					var url = CONFIG.API_URL + 'inventointiprojekti/' + id + '/kyla/' + queryString;
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
				// Kaikki investointiprojektin kylät
				getAllVillagesOfInventointiprojekti : function(id) {
					var deferred = $q.defer();
					var url = CONFIG.API_URL + 'inventointiprojekti/' + id + '/kaikki/kylat'
					$http({
						method : 'GET',
						url : url,
					}).then(function successCallback(response) {
						deferred.resolve(response.data);
					}, function errorCallback(response) {
						deferred.reject(response);
					});

					return deferred.promise;
				},
				/*
				 * Create kiinteisto - inventoryproject relation
				 */
				addKayttajaToInventointiprojekti : function(inventointiprojektiId, kayttajaId, etunimi, sukunimi, inventoijaArvo, inventoijaOrganisaatio) {
					var nimi = etunimi + " " + sukunimi;
					var deferred = $q.defer();
					$http({
						method : 'POST',
						url : CONFIG.API_URL + 'inventointiprojekti/' + inventointiprojektiId + '/inventoija/',
						data : {
							'inventoija_id' : kayttajaId,
							'inventoija_arvo' : inventoijaArvo,
							'inventoija_organisaatio' : inventoijaOrganisaatio,
							'inventoija_nimi' : nimi
						}
					}).then(function success(response) {
						deferred.resolve(response);
					}, function error(response) {
						deferred.reject(response);
					});

					return deferred.promise;
				},
				/*
				 * Delete kiinteistö - inventoryproject relation
				 */
				deleteKayttajaFromInventointiprojekti : function(kayttajaId, inventointiprojektiId) {
					var deferred = $q.defer();
					$http({
						method : 'DELETE',
						url : CONFIG.API_URL + 'inventointiprojekti/' + inventointiprojektiId + '/inventoija/' + kayttajaId,
						params : {
							'inventointiprojekti_id' : inventointiprojektiId,
							'inventoija_id' : kayttajaId
						}
					}).then(function success(response) {
						deferred.resolve(response);
					}, function error(err) {
						deferred.reject(err);
					});
					return deferred.promise;
				},
				/*
				 * Check if nimi has already been taken. We need possibility to search exact match.
				 */
				checkNimi : function(nimi, id) {
					var deferred = $q.defer();
					var filterParameters = {
						'nimi' : nimi,
						'tarkka' : 1
					};
					var available = false;
					this.getInventointiprojektit(filterParameters).then(function success(data) {
						if (data.features.length == 0) {
							available = true;
						} else if(data.features.length == 1 && id != undefined && data.features[0].properties.id == id) {
						    available = true;
						}
						deferred.resolve(available);
					}, function error(data) {
						deferred.reject(available);
					});

					return deferred.promise;
				},
				getInventointipaiva : function(inventointiprojektiId, tyyppi, entiteettiId, inventoijaId) {
				    var deferred = $q.defer();
                                 
                    var url = CONFIG.API_URL + 'inventointiprojekti/' + inventointiprojektiId + '/inventointipaiva/';
                    $http({
                        method : 'GET',
                        url : url,
                        params : {
                            'entiteetti_tyyppi' : tyyppi,
                            'entiteetti_id': entiteettiId,
                            'inventoija_id': inventoijaId
                        }
                    }).then(function successCallback(response) {
                        deferred.resolve(response.data.data);
                    }, function errorCallback(response) {
                        deferred.reject(response);
                    });

                    return deferred.promise;
				},
                getKenttapaiva : function(inventointiprojektiId, tyyppi, entiteettiId, inventoijaId) {
                    var deferred = $q.defer();
                                 
                    var url = CONFIG.API_URL + 'inventointiprojekti/' + inventointiprojektiId + '/kenttapaiva/';
                    $http({
                        method : 'GET',
                        url : url,
                        params : {
                            'entiteetti_tyyppi' : tyyppi,
                            'entiteetti_id': entiteettiId,
                            'inventoija_id': inventoijaId
                        }
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