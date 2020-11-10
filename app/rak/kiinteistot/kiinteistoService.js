/*
 * Service for handling the kiinteisto CRUD
 */
angular.module('mip.kiinteisto', []);

angular.module('mip.kiinteisto').factory('KiinteistoService', [
		'$http', '$q', 'CONFIG', '$location', '$route', 'AlertService', 'locale', 'ListService', 'CacheFactory', '$rootScope', function($http, $q, CONFIG, $location, $route, AlertService, locale, ListService, CacheFactory, $rootScope) {

		    CacheFactory('kiinteistoCache', {
                maxAge: 10 * 60 * 1000, // Items added to this cache expire after 10 minutes
                cacheFlushInterval: 60 * 60 * 1000, // This cache will clear itself every hour
                deleteOnExpire: 'passive', // Cache will do nothing when an item expires. Expired items will remain in the cache until requested, at which point they are removed, and undefined is returned.
                capacity: 50 //Maximum number of items a cache can hold. Adding more items than the capacity will cause the cache to operate like an LRU cache, removing the least recently used items to stay under capacity. Default: Number.MAX_VALUE.                  
              });
		    
		    
			return {				
				getMuutosHistoria : function(kiinteistoId) {
					var deferred = $q.defer();
					var url = CONFIG.API_URL + 'kiinteisto/' + kiinteistoId +"/historia";

					$http({
						method : 'GET',
						url : url
					}).then(function successCallback(response) {
						deferred.resolve(response.data);						
					}, function errorCallback(response) {
						deferred.reject(response);
					});

					return deferred.promise;
				},
				/*
				 * Fetches the kiinteistot from the backend with the given
				 * search words (100kpl)
				 */
				getKiinteistot : function(params) {
					var queryString = ListService.parseQueryString(params);

					var deferred = $q.defer();
					var url = CONFIG.API_URL + 'kiinteisto/' + queryString;
					$http({
						method : 'GET',
						url : url,
                        cache : CacheFactory.get('kiinteistoCache')
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
				 * Get the rakennus entities of this kiinteisto entity. TODO
				 * apply finishing touches (& use for something)
				 */
				getRakennuksetOfKiinteisto : function(kiinteistoId) {
					var deferred = $q.defer();
					var url = CONFIG.API_URL + 'kiinteisto/' + kiinteistoId + '/rakennus';

					$http({
						method : 'GET',
						url : url
					}).then(function successCallback(response) {
						deferred.resolve(response.data.data.features);						
					}, function errorCallback(response) {
						deferred.reject(response);
					});

					return deferred.promise;
				},
				/*
				 * Fetches the kiinteisto details from the backend when
				 * kiinteisto has been selected
				 */
				fetchKiinteisto : function(id) {
					var deferred = $q.defer();
					var url = CONFIG.API_URL + "kiinteisto/" + id;
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
				/*
				 * Hakee kiinteistön kiinteistötunnuksella
				 */
				haeKiinteistotunnuksella : function(kiinteistotunnus) {
					var deferred = $q.defer();
					var url = CONFIG.API_URL + "kiinteisto/kiinteistotunnushaku/" + kiinteistotunnus;
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
				saveKiinteisto : function(kiinteisto) {
					var deferred = $q.defer();
					if(kiinteisto.properties.id) {
						// Existing kiinteisto --> update
						$http({
							method : 'PUT',
							url : CONFIG.API_URL + 'kiinteisto/' + kiinteisto.properties.id,
							data : kiinteisto.properties
						}).then(function success(response) {
						    
						    //Clear the cache
                            CacheFactory.get('kiinteistoCache').removeAll();
                            CacheFactory.get('rakennusCache').removeAll();    
						    //Clear the kylaCache so that the KylaService.getKiinteistotOfKyla returns the updated results
                            CacheFactory.get('kylaCache').removeAll();
                            //Clear the kuntacache so that the KuntaService.getKiinteistotOfKunta returns updated results                          
                            CacheFactory.get('kuntaCache').removeAll();
                            
                            $rootScope.$broadcast('Update_data', {
                                'type' : 'kiinteisto'
                            });
                                                      
							deferred.resolve(response.data.data.properties.id);
						}, function error(response) {
							deferred.reject(response.data);
						});
					} else {
						// New kiinteisto
						$http({
							method : 'POST',
							url : CONFIG.API_URL + 'kiinteisto',
							data : kiinteisto.properties
						}).then(function success(response) {	

                            //Clear the cache
                            CacheFactory.get('kiinteistoCache').removeAll();
                            
						    //Clear the kylaCache so that the KylaService.getKiinteistotOfKyla returns the updated results
                            CacheFactory.get('kylaCache').removeAll();
                            //Clear the kuntacache so that the KuntaService.getKiinteistotOfKunta returns updated results                          
                            CacheFactory.get('kuntaCache').removeAll();
                            
                            $rootScope.$broadcast('Update_data', {
                                'type' : 'kiinteisto'
                            });
                                                       
							deferred.resolve(response.data.data.properties.id);
						}, function error(response) {
							deferred.reject(response);
						});
					}
					return deferred.promise;
				},
				deleteKiinteisto : function(kiinteisto) {
					var deferred = $q.defer();
					$http({
						method : 'DELETE',
						url : CONFIG.API_URL + "kiinteisto/" + kiinteisto.properties.id
					}).then(function success(response) {

                        //Clear the cache
                        CacheFactory.get('kiinteistoCache').removeAll();
                        CacheFactory.get('rakennusCache').removeAll();    
					    //Clear the kylaCache so that the KylaService.getKiinteistotOfKyla returns the updated results
                        CacheFactory.get('kylaCache').removeAll();
                        //Clear the kuntacache so that the KuntaService.getKiinteistotOfKunta returns updated results                          
                        CacheFactory.get('kuntaCache').removeAll();
                        
                        $rootScope.$broadcast('Update_data', {
                            'type' : 'kiinteisto'
                        });
                      
						deferred.resolve();
					}, function error(response) {
						deferred.reject(response);
					});
					return deferred.promise;
				},
				/*
				 * Get the kulttuurihistoriallinen arvo entities of an estate
				 */
				getKulttuurihistoriallisetArvotOfKiinteisto : function(kiinteistoId) {					
					var deferred = $q.defer();
					var url = CONFIG.API_URL + 'kiinteisto/' + kiinteistoId + '/kulttuurihistoriallinenarvo';
					$http({
						method : 'GET',
						url : url
					}).then(function successCallback(response) {						
						deferred.resolve(response.data.data.features);						
					}, function errorCallback(response) {

						deferred.reject(response);
					});

					return deferred.promise;
				},
				/*
				 * Create kiinteisto - kulttuurihistoriallinen arvo relation
				 */
				addKulttuurihistoriallinenArvoToKiinteisto: function (kiinteistoId, arvoId) {
					var deferred = $q.defer();
					$http({
						method : 'POST',
						url : CONFIG.API_URL + 'kiinteisto/' + kiinteistoId + '/kulttuurihistoriallinenarvo/',
						data : {
							'kulttuurihistoriallinenarvo_id' : arvoId
						}
					}).then(function success (response) {						
						deferred.resolve(response);
					}, function error (response) {
						deferred.reject(response);
					});
					return deferred.promise;
				},
				/*
				 * Delete kiinteistö - kulttuurihistoriallinen arvo relation
				 */
				deleteKulttuurihistoriallinenArvoFromKiinteisto: function(kiinteistoId, arvoId) {
					var deferred = $q.defer();
					$http({
						method: 'DELETE',
						url: CONFIG.API_URL + 'kiinteisto/' + kiinteistoId +'/kulttuurihistoriallinenarvo/',
						params: {'kulttuurihistoriallinenarvo_id': arvoId}
					}).then(function success(response) {
						deferred.resolve(response);
					}, function error(err) {
						deferred.reject(err);
					});
					return deferred.promise;
				},
				checkKiinteistotunnusAvailability : function(kt, id, pn) {
				    var deferred = $q.defer();
				    var url = CONFIG.API_URL + "kiinteisto/kiinteistotunnus/";
				    
                    $http({
                        method : 'GET',
                        url : url,
                        params : {
                            'kiinteistotunnus': kt,
                            'id': id,
                            'palstanumero': pn
                        }
                    }).then(function successCallback(response) {
                        deferred.resolve(response.data);
                    }, function errorCallback(response) {
                        deferred.reject(response);
                    });
                    return deferred.promise;
				    
				}
			}
		}
]);