/*
 * Tutkimus service
 */
angular.module('mip.tutkimus', []);

angular.module('mip.tutkimus').factory('TutkimusService', [
		'$rootScope', '$http', '$q', 'CONFIG', '$location', 'AlertService', '$route', 'ListService', 'UserService', 'CacheFactory',
		function ($rootScope, $http, $q, CONFIG, $location, AlertService, $route, ListService, UserService, CacheFactory) {

            /**
             * Tutkimusten cache selaimeen
             */
            CacheFactory('tutkimusCache', {
                maxAge : 10 * 60 * 1000, // Items added to this cache expire after 10 minutes
                cacheFlushInterval : 60 * 60 * 1000, // This cache will clear itself every hour
                deleteOnExpire : 'passive', // Cache will do nothing when an item expires. Expired items will remain in the cache until requested, at which point they are removed, and undefined is returned.
                capacity : 50
            // Maximum number of items a cache can hold. Adding more items than the capacity will cause the cache to operate like an LRU cache, removing the least recently used items to stay under capacity. Default: Number.MAX_VALUE.
            });

			return {
				/*
				 * Hae tutkimukset
				 */
				haeTutkimukset : function (params) {
					var queryString = ListService.parseQueryString(params);
					var deferred = $q.defer();
					var url = CONFIG.API_URL + 'tutkimus/' + queryString;
					$http({
						method : 'GET',
						url : url,
						cache : CacheFactory.get('tutkimusCache')
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
				 * Hakee valitun tutkimuksen
				 */
				haeTutkimus : function (id) {
					var deferred = $q.defer();
					var url = CONFIG.API_URL + "tutkimus/" + id;
					$http({
						method : 'GET',
						url : url
					}).then(function successCallback (response) {
						deferred.resolve(response.data.data);
					}, function errorCallback (response) {
						// AlertService.showError("Projektin haku epäonnistui");
						console.log("tutkimusService / haeTutkimus - virhe");
						deferred.reject(response);
					});
					return deferred.promise;
				},
				/*
				 * Tallentaa uuden tai muokatun tutkimuksen
				 */
				tallennaTutkimus : function (tutkimus) {
					var deferred = $q.defer();

					if (tutkimus.properties.id) {
						$http({
							method : 'PUT',
							url : CONFIG.API_URL + 'tutkimus/' + tutkimus.properties.id,
							data : tutkimus
						}).then(function success (response) {

                            CacheFactory.get('tutkimusCache').removeAll();
							/*
							 * TutkimusListControllerille tieto päivittää taulukko
							 */
                            $rootScope.$broadcast('Update_data', {
                                'type' : 'tutkimus'
                            });
							deferred.resolve(response);
						}, function error (response) {
							if (CONFIG.DEBUG) {
								console.log("tutkimusService / tallennaTutkimus - virhe");
							}
							deferred.reject(response);
						});
					} else {
						$http({
							method : 'POST',
							url : CONFIG.API_URL + 'tutkimus',
							data : tutkimus
						}).then(function success (response) {

							CacheFactory.get('tutkimusCache').removeAll();
							/*
							 * TutkimusListControllerille tieto päivittää taulukko
							 */
                            $rootScope.$broadcast('Update_data', {
                                'type' : 'tutkimus'
                            });
							deferred.resolve(response.data.data.properties.id);
						}, function error (response) {
							if (CONFIG.DEBUG) {
								console.log("tutkimusService / tallennaTutkimus - virhe");
							}
							deferred.reject(response);
						});
					}
					return deferred.promise;
				},
				/*
				 * Poista tutkimus
				 */
				poistaTutkimus : function (tutkimus) {
					var deferred = $q.defer();

					$http({
						method : 'DELETE',
						url : CONFIG.API_URL + "tutkimus/" + tutkimus.properties.id
					}).then(function success (response) {

						CacheFactory.get('tutkimusCache').removeAll();

                        $rootScope.$broadcast('Update_data', {
                            'type' : 'tutkimus'
                        });
						if (CONFIG.DEBUG) {
							console.log("Tutkimuksen poisto OK");
						}
						$route.reload();
						deferred.resolve();
					}, function error (response) {

						if (CONFIG.DEBUG) {
							console.log("TutkimusService / Tutkimuksen poisto epaonnistui.");
						}
						deferred.reject(response);
					});

					return deferred.promise;
				},
				/*
				 * Tutkimuksen nimen pitää olla uniikki
				 */
				tarkistaNimi : function (nimi) {
					var deferred = $q.defer();
					var filterParameters = {
						'nimi' : nimi,
						'tarkka' : 1
					};
					var available = false;
					this.haeTutkimukset(filterParameters).then(function success (data) {
						if (data.features.length == 0) {
							available = true;
						}
						deferred.resolve(available);
					}, function error (data) {
						deferred.reject(available);
					});

					return deferred.promise;
				},
				/*
				 * Tutkimuksen lyhenteen pitää olla uniikki, ei pakollinen
				 */
				tarkistaTutkimuksenLyhenne : function (tutkimuksen_lyhenne) {
					var deferred = $q.defer();
					var filterParameters = {
						'tutkimuksen_lyhenne' : tutkimuksen_lyhenne,
						'tarkka' : 1
					};
					var available = false;

					// Tyhjällä ei tarkisteta
					if (!tutkimuksen_lyhenne) {
						available = true;
						deferred.resolve(available);
					}else{
						// Tarkistus backendista
						this.haeTutkimukset(filterParameters).then(function success (data) {
							if (data.features.length == 0) {
								available = true;
							}
							deferred.resolve(available);
						}, function error (data) {
							deferred.reject(available);
						});
					}

					return deferred.promise;
				},
				/*
				 * Päänumeron pitää olla uniikki per kokoelmatunnus
				 */
				tarkistaPaanumero : function (tyyppi, paanumero, kokoelmalaji_id) {

					var deferred = $q.defer();
					var filterParameters = {
						'paanumeroTyyppi': tyyppi,
						'paanumero': paanumero,
						'kokoelmalaji': kokoelmalaji_id
					};
					var available = false;
					this.haeTutkimukset(filterParameters).then(function success (data) {
						if (data.features.length == 0) {
							available = true;
						}
						deferred.resolve(available);
					}, function error (data) {
						deferred.reject(available);
					});

					return deferred.promise;
				},
				/*
				 * Get all users with roles for the projekti TODO: BE is WIP - return value changes
				 */
				getProjektiKayttajat : function (projekti_id) {
					var deferred = $q.defer();
					$http({
						method : 'GET',
						url : CONFIG.API_URL + "projekti/" + projekti_id + "/kayttaja"
					}).then(function success (response) {
						deferred.resolve(response.data.data);
					}, function error (response) {
						deferred.reject(response);
					});
					return deferred.promise;
				},
				/*
				 * Save the user-role to the project
				 */
				saveProjektiKayttaja : function (projekti_id, kayttaja_id, projekti_rooli_id) {
					var deferred = $q.defer();
					$http({
						method : 'POST',
						url : CONFIG.API_URL + "projekti/" + projekti_id + "/kayttaja",
						data : {
							'kayttaja_id' : kayttaja_id,
							'projekti_rooli_id' : projekti_rooli_id
						}
					}).then(function success (response) {
						/*
						 * Broadcast the modified data to scopes
						 */
						$rootScope.$broadcast('Projektikayttajat_modified', {
							'id' : projekti_id
						});

						deferred.resolve(response.data.data);
					}, function error (response) {
						deferred.reject(response);
					});
					return deferred.promise;
				},
				/*
				 * Delete the user-role from the project
				 */
				deleteProjektiKayttaja : function (projekti_id, kayttaja_id, projekti_rooli_id) {
					var deferred = $q.defer();
					$http({
						method : 'DELETE',
						url : CONFIG.API_URL + "projekti/" + projekti_id + "/kayttaja",
						params : {
							'kayttaja_id' : kayttaja_id,
							'projekti_rooli_id' : projekti_rooli_id
						}
					}).then(function success (response) {
						/*
						 * Broadcast the modified data to scopes
						 */
						$rootScope.$broadcast('Projektikayttajat_modified', {
							'id' : projekti_id
						});

						deferred.resolve(response.data.data);
					}, function error (response) {
						deferred.reject(response);
					});
					return deferred.promise;
				},
				/*
				 * Get all of the roles for the project
				 */
				getProjektiRoolit : function (projekti_id) {
					var deferred = $q.defer();
					$http({
						method : 'GET',
						url : CONFIG.API_URL + "projektirooli/"
					}).then(function success (response) {
						deferred.resolve(response.data.data);
					}, function error (response) {
						deferred.reject(response);
					});
					return deferred.promise;
				},
				/*
				 * Get the roles for the current user for the designed project TODO: Not working currently
				 */
				getKayttajaProjektiRoolit : function (projekti_id) {
					var deferred = $q.defer();
					$http({
						method : 'GET',
						url : CONFIG.API_URL + "kayttaja/" + UserService.getProperties().user.id + "/projektirooli/",
						data : {
							'projekti_id' : projekti_id
						}
					}).then(function success (response) {
						deferred.resolve(response.data.data);
					}, function error (response) {
						deferred.reject(response);
					});
					return deferred.promise;
				},
				/*
				 * Get all project types
				 */
				getProjektityypit : function () {
					var deferred = $q.defer();
					$http({
						method : 'GET',
						url : CONFIG.API_URL + "projektityyppi/"
					}).then(function success (response) {
						deferred.resolve(response.data.data);
					}, function error (response) {
						deferred.reject(response);
					});
					return deferred.promise;
				},
				muokkaaKayttajia : function(data) { //data: {'tutkimusId': 123, 'lisattavat': [id1, id2, id3], 'poistettavat': [id1, id2, id3]}
				    var deferred = $q.defer();
    				$http({
                        method : 'POST',
                        url : CONFIG.API_URL + 'tutkimus/'+data.tutkimusId+'/kayttaja',
                        data : data
                    }).then(function success (response) {
                        $rootScope.$broadcast('Update_data', {
							'type' : 'tutkimus_kayttajat',
							'tutkimusId': response.data.data.properties.id
                        });
                        deferred.resolve(response.data.data.properties.id);
                    }, function error (response) {
                        console.log("tutkimusService / muokkaaKayttajia - virhe: " + response);
                        deferred.reject(response);
					});
					return deferred.promise;
				}

            }

		}
]);