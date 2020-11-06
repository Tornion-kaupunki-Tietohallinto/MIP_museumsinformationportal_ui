/*
 * Konservoinnin service
 */
angular.module('mip.konservointi', []);

angular.module('mip.konservointi').factory('KonservointiService', [
		'$rootScope', '$http', '$q', 'CONFIG', '$location', 'AlertService', '$route', 'ListService', 'UserService', 'CacheFactory', 
		function ($rootScope, $http, $q, CONFIG, $location, AlertService, $route, ListService, UserService, CacheFactory) {
			
			return {
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