/*
 * Service for handling the arvoalue CRUD
 */
angular.module('mip.arvoalue', []);

angular.module('mip.arvoalue').factory('ArvoalueService', [
		'$http', '$q', 'CONFIG', '$location', '$route', 'AlertService', 'locale', 'AlueService', 'CacheFactory', '$rootScope',
		function($http, $q, CONFIG, $location, $route, AlertService, locale, AlueService, CacheFactory, $rootScope) {
		    
		    CacheFactory('arvoalueCache', {
                maxAge: 10 * 60 * 1000, // Items added to this cache expire after 10 minutes
                cacheFlushInterval: 60 * 60 * 1000, // This cache will clear itself every hour
                deleteOnExpire: 'passive', // Cache will do nothing when an item expires. Expired items will remain in the cache until requested, at which point they are removed, and undefined is returned.
                capacity: 50 //Maximum number of items a cache can hold. Adding more items than the capacity will cause the cache to operate like an LRU cache, removing the least recently used items to stay under capacity. Default: Number.MAX_VALUE.                  
              });
		    
			return {
				/*
				 * Fetches the arvoalueet from the backend with the given
				 * search words (100kpl)
				 */
				getArvoalueet : function(params) {
					var queryString = '';

					for( var parameter in params) {
						if(params.hasOwnProperty(parameter)) {
							if(queryString.length == 0) {
								queryString = '?' + parameter + "=" + params[parameter];
							} else {
								queryString += '&' + parameter + "=" + params[parameter];
							}
						}
					}
					var deferred = $q.defer();
					var url = CONFIG.API_URL + 'arvoalue/' + queryString;
					$http({
						method : 'GET',
						url : url,
                        cache : CacheFactory.get('arvoalueCache')
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
				 * Fetches the Arvoalue details from the backend when
				 * Arvoalue has been selected
				 */
				fetchArvoalue : function(id) {
					var deferred = $q.defer();
					var url = CONFIG.API_URL + "arvoalue/" + id;
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
				
				saveArvoalue : function(arvoalue) {
					var deferred = $q.defer();				
					if(arvoalue.properties.id) {
						$http({
							method : 'PUT',
							url : CONFIG.API_URL + 'arvoalue/' + arvoalue.properties.id,
							data : arvoalue.properties
						}).then(function success(response) {
						    
						    //Clear the arvoalueCache
                            CacheFactory.get('arvoalueCache').removeAll();
						    
						    //Clear the kylaCache so that the KylaService.getArvoalueetOfKyla returns the updated results
                            CacheFactory.get('kylaCache').removeAll();
                            //Clear the kuntacache so that the KuntaService.getArvolueetOfKunta returns updated results                          
                            CacheFactory.get('kuntaCache').removeAll();
						    
                            $rootScope.$broadcast('Update_data', {
                                'type' : 'arvoalue'
                            });
                            
							deferred.resolve(arvoalue.properties.id);
						}, function error(response) {
							deferred.reject(response.data);
						});
					} else {
						// New arvoalue
						$http({
							method : 'POST',
							url : CONFIG.API_URL + 'arvoalue',
							data : arvoalue.properties
						}).then(function success(response) {	

						    //Clear the arvoalueCache
                            CacheFactory.get('arvoalueCache').removeAll();
                            
						    //Clear the kylaCache so that the KylaService.getArvoalueetOfKyla returns the updated results
                            CacheFactory.get('kylaCache').removeAll();
                            //Clear the kuntacache so that the KuntaService.getArvolueetOfKunta returns updated results                          
                            CacheFactory.get('kuntaCache').removeAll();                            
                            
                            $rootScope.$broadcast('Update_data', {
                                'type' : 'arvoalue'
                            });
                            
							deferred.resolve(response.data.data.properties.id);
						}, function error(response) {
							deferred.reject(response);
						});
					}
					return deferred.promise;
				},
				deleteArvoalue: function(arvoalue) {
					var deferred = $q.defer();
					$http({
						method : 'DELETE',
						url : CONFIG.API_URL + "arvoalue/" + arvoalue.properties.id
					}).then(function success(response) {		

					    //Clear the arvoalueCache
                        CacheFactory.get('arvoalueCache').removeAll();
                        
					    //Clear the kylaCache so that the KylaService.getArvoalueetOfKyla returns the updated results
                        CacheFactory.get('kylaCache').removeAll();
                        //Clear the kuntacache so that the KuntaService.getArvolueetOfKunta returns updated results                          
                        CacheFactory.get('kuntaCache').removeAll();
                        
                        $rootScope.$broadcast('Update_data', {
                            'type' : 'arvoalue'
                        });
					    
						deferred.resolve();
					}, function error(response) {
						deferred.reject(response);
					});
					return deferred.promise;
				},
				/*
				 * Get the kulttuurihistoriallinen arvo entities of an arvoalue
				 */
				getKulttuurihistoriallisetArvotOfArvoalue : function(arvoalueId) {					
					var deferred = $q.defer();
					var url = CONFIG.API_URL + 'arvoalue/' + arvoalueId + '/kulttuurihistoriallinenarvo';
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
				 * Create arvoalue - kulttuurihistoriallinen arvo relation
				 */
				addKulttuurihistoriallinenArvoToArvoalue : function (arvoalueId, arvoId) {
					var deferred = $q.defer();
					$http({
						method : 'POST',
						url : CONFIG.API_URL + 'arvoalue/' + arvoalueId + '/kulttuurihistoriallinenarvo/',
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
				 * Delete arvoalue - kulttuurihistoriallinen arvo relation
				 */
				deleteKulttuurihistoriallinenArvoFromArvoalue : function(arvoalueId, arvoId) {
					var deferred = $q.defer();
					$http({
						method: 'DELETE',
						url: CONFIG.API_URL + 'arvoalue/' + arvoalueId +'/kulttuurihistoriallinenarvo/',
						params: {'kulttuurihistoriallinenarvo_id': arvoId}
					}).then(function success(response) {
						deferred.resolve(response);
					}, function error(err) {
						deferred.reject(err);
					});
					return deferred.promise;
				},
				/*
				 * Check if inventointinumero has already been taken. 
				 */
				checkInventointinumero : function(alueId, arvoalue) {
					var deferred = $q.defer();
					var available = true;
					
					AlueService.getArvoalueetOfAlue(alueId).then(function success(data) {
						// Loop all of the arvoalueet. 
						for (var i = 0; i < data.features.length; i++) {
							var tmpArvoalue = data.features[i];
							if (tmpArvoalue.properties.inventointinumero == arvoalue.properties.inventointinumero) {
								// if this is new arvoalue (not saved) it has no id

								if (arvoalue.properties.id && (tmpArvoalue.properties.id == arvoalue.properties.id)) {
									available = true;
								} else {
									available = false;
									break;
								}										
							}
						}

						deferred.resolve(available);
					}, function error(data) {
						available = false;
						deferred.reject(available);
					});

					return deferred.promise;
				},
				getKiinteistotForArvoalue : function(arvoalueId) {
					var deferred = $q.defer();
					var url = CONFIG.API_URL + "arvoalue/" + arvoalueId + "/kiinteistot";
					$http({
						method : 'GET',
						url : url
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