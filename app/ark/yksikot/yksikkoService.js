/*
 * Yksikkö service
 */
angular.module('mip.yksikko', []);

angular.module('mip.yksikko').factory('YksikkoService', [
		'$rootScope', '$http', '$q', 'CONFIG', '$location', 'AlertService', '$route', 'ListService', 'UserService', 'CacheFactory',
		function ($rootScope, $http, $q, CONFIG, $location, AlertService, $route, ListService, UserService, CacheFactory) {

            /**
             * Yksikkö cache selaimeen
             */
            CacheFactory('yksikkoCache', {
                maxAge : 10 * 60 * 1000, // Items added to this cache expire after 10 minutes
                cacheFlushInterval : 60 * 60 * 1000, // This cache will clear itself every hour
                deleteOnExpire : 'passive', // Cache will do nothing when an item expires. Expired items will remain in the cache until requested, at which point they are removed, and undefined is returned.
                capacity : 50
            // Maximum number of items a cache can hold. Adding more items than the capacity will cause the cache to operate like an LRU cache, removing the least recently used items to stay under capacity. Default: Number.MAX_VALUE.
            });

            /**
             * Yksikko cache loyto/yksikkoValitsin direktiiville
             */
            CacheFactory('dYksikkoCache', {
                maxAge : 10 * 60 * 1000, // Items added to this cache expire after 10 minutes
                cacheFlushInterval : 60 * 60 * 1000, // This cache will clear itself every hour
                deleteOnExpire : 'passive', // Cache will do nothing when an item expires. Expired items will remain in the cache until requested, at which point they are removed, and undefined is returned.
                capacity : 50
            // Maximum number of items a cache can hold. Adding more items than the capacity will cause the cache to operate like an LRU cache, removing the least recently used items to stay under capacity. Default: Number.MAX_VALUE.
            });

			return {
				/*
				 * Hae kaikki yksiköt
				 */
				haeYksikot : function (params, cache) {
					var queryString = ListService.parseQueryString(params);
					var deferred = $q.defer();
					var url = CONFIG.API_URL + 'tutkimusalueen/yksikot/' + queryString;
					$http({
						method : 'GET',
						url : url,
						cache : cache ? cache : null//CacheFactory.get('yksikkoCache') No cache in this
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
				 * Hakee valitun yksikön
				 */
				haeYksikko : function (id) {
					var deferred = $q.defer();
					var url = CONFIG.API_URL + "tutkimusalue/yksikko/" + id;
					$http({
						method : 'GET',
						url : url
					}).then(function successCallback (response) {
						deferred.resolve(response.data.data);
					}, function errorCallback (response) {
						// AlertService.showError("Projektin haku epäonnistui");
						console.log("yksikkoService / haeYksikko - virhe");
						deferred.reject(response);
					});
					return deferred.promise;
				},
                /**
                 * Tallentaa yksikön - luodaan uusi tai päivitetään olemassaolevaa jos id on tiedossa.
                 * @param Yksikko (objekti) jonka tiedot tallennetaan
                 * @return Promise - Luodun / Tallennetun kohteen id
                 */
                luoTallennaYksikko: function(yksikko) {
                    var deferred = $q.defer();
                    // Päivitys
                    if (yksikko.properties.id) {
                        delete yksikko['properties']['luoja'];
                        $http({
                            method : 'PUT',
                            url : CONFIG.API_URL + 'tutkimusalue/yksikko/' + yksikko.properties.id,
                            data : yksikko
                        }).then(function success(response) {
                            // Clear the cache
                            CacheFactory.get('yksikkoCache').removeAll();

                            deferred.resolve(response.data.data);
                        }, function error(response) {
                            deferred.reject(response.data);
                        });
                    }
                    // Luonti, palautetaan luotu yksikkö
                    else {
                        $http({
                            method : 'POST',
                            url : CONFIG.API_URL + 'tutkimusalue/yksikko/',
                            data : yksikko
                        }).then(function success(response) {
                            // Clear the yksikkoCache
                            CacheFactory.get('yksikkoCache').removeAll();

                            deferred.resolve(response.data.data);
                        }, function error(response) {
                            deferred.reject(response);
                        });
                    }
                    return deferred.promise;
                },
                /**
                 * Poistaa yksikön
                 * @param Poistettavan yksikön id
                 * @return Promise - Onnistuessa ei palauteta mitään, virhetilanteessa virheilmoitus
                 */
                poistaYksikko : function(yksikko) {
                    var deferred = $q.defer();
                    $http({
                        method : 'DELETE',
                        url : CONFIG.API_URL + "tutkimusalue/yksikko/" + yksikko.properties.id
                    }).then(function success(response) {

                        // Clear the yksikkoCache
                        CacheFactory.get('yksikkoCache').removeAll();

                        deferred.resolve();
                    }, function error(response) {
                        deferred.reject(response);
                    });
                    return deferred.promise;
                },
				/*
				 * Hakee seuraavan vapaan yksikön numeron per tutkimus
				 */
				luoYksikkoNumero : function (tutkimus_id) {
					var deferred = $q.defer();
					var url = CONFIG.API_URL + "tutkimusalue/yksikkonumero/" + tutkimus_id;
					$http({
						method : 'GET',
						url : url
					}).then(function successCallback (response) {
						deferred.resolve(response.data.data);
					}, function errorCallback (response) {
						// AlertService.showError("Projektin haku epäonnistui");
						console.log("yksikkoService / luoYksikkoNumero - virhe");
						deferred.reject(response);
					});
					return deferred.promise;
				},
				/*
				 * Yksikön tunnuksen on oltava uniikki tutkimuksen sisällä
				 */
				tarkistaYksikonNumero : function (yksikon_numero, tutkimus_id) {
					var deferred = $q.defer();
					var filterParameters = {
						'uniikki_numero' : 'uniikki_numero',
						'yksikon_numero': yksikon_numero,
						'ark_tutkimus_id' : tutkimus_id
					};
					var available = false;
                    CacheFactory.get('yksikkoCache').removeAll();
					this.haeYksikot(filterParameters).then(function success (data) {
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
				 * Hakee yksikön tutkimuksen id:n mukaan.
				 */
				haeTutkimuksenYksikko : function (tutkimus_id, yksikkotunnus) {
					var deferred = $q.defer();
					var filterParameters = {
							'ark_tutkimus_id' : tutkimus_id,
							'yksikkotunnus_haku' : yksikkotunnus
						};

					this.haeYksikot(filterParameters).then(function success (data) {

						var vastaus = null;
						if(data.features.length == 1){
							vastaus = data.features[0].properties;
						}
						deferred.resolve(vastaus);
					}, function error (data) {
						console.log("yksikkoService / haeTutkimuksenYksikko - virhe")
						deferred.reject(data);
					});
					return deferred.promise;
				},
			}
		}
]);