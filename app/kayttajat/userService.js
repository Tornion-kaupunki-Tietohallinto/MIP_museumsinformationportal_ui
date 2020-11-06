/*
 * Service for managing the users
 */
angular.module('mip.user').factory('UserService', [
		'$http', '$q', 'CONFIG', '$location', 'SessionService', '$route', 'AlertService', 'ListService', 'locale', '$rootScope', function ($http, $q, CONFIG, $location, SessionService, $route, AlertService, ListService, locale, $rootScope) {
			/*
			 * Service properties. props.user = The currently logged in user.
			 */
			var props = {
				user : {
					id : '',
					aktiivinen : '',
					etunimi : '',
					sukunimi : '',
					sahkoposti : '',
					kieli : '',
					organisaatio : '',
					pvm_luotu : '',
					pvm_muokattu : ''
				}
			};

			return {
				/*
				 * Fetches the user from the backend. 
				 * Parameters: If id is given, that user will be fetched. 
				 * If id is empty, the currently logged in user is fetched.
				 * 
				 */
				getUser : function (id) {
					var deferred = $q.defer();
					var url = CONFIG.API_URL + 'kayttaja/';
					
					if (!id) {
						// Get the current user id from the backend
						this.getUserId().then(function (response) {						    
						    props.user = response; //The response is set already in the getUserId.
						    deferred.resolve(props.user);
						});
					} else {
						// Get the user of id that was given as parameter
						url = url + id;
						$http({
							method : 'GET',
							url : url,
						}).then(function successCallback (response) {
							props.userToModify = response.data.data.properties;
							deferred.resolve(props.userToModify);
						}, function errorCallback (response) {
							if (response.status != '403') {
								locale.ready('common').then(function() {
									AlertService.showError(locale.getString('common.Error'), AlertService.message(response));
								});
							}
							deferred.reject(response);
						});
					}
					return deferred.promise;
				},
				/*
				 * Fetches the current user from the backend.
				 */
				getUserId : function () {
					var deferred = $q.defer();
					$http.get(CONFIG.API_URL + 'kayttaja/kirjaudu').then(function successCallback (response) {					    
						// Extra check, something went wrong with getting correct response.
						if (!response.data.data) {
							SessionService.unset('token');
							SessionService.setAuthenticated(false);
							$location.path('/kirjaudu');
							locale.ready('common').then(function() {
								AlertService.showError(locale.getString('common.Error'));
							});
						}
						props.user = response.data.data.content.kayttaja;
						deferred.resolve(props.user);
					}, function errorCallback (response) {
						deferred.reject(response);
					});
					return deferred.promise;
				},
				/*
				 * Returns the properties, does not fetch anything from the server.
				 */
				getProperties : function () {
					return props;
				},
				setUser : function(user) {
				    props.user = user;
				},
				/*
				 * Fetches all of the users from the backend.
				 */
				getUsers : function (params) {
					var deferred = $q.defer();
					var queryString = ListService.parseQueryString(params);

					$http.get(CONFIG.API_URL + 'kayttaja/' + queryString).then(function successCallback (response) {
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
				 * Saves the user to the backend. Can be a new user (no id) or existing user (has id). Reloads the window location (used for refreshing the shown data)
				 */
				saveUser : function (user) {
					var deferred = $q.defer();
					// Existing user - update
					if (user.id) {
						$http({
							method : 'PUT',
							url : CONFIG.API_URL + 'kayttaja/' + user.id,
							data : user
						}).then(function successCallback (response) {
						    
						    $rootScope.$broadcast('Update_data', {
                                'type' : 'kayttaja'
                            });
						    
							deferred.resolve(response.data.data.properties.id);
						}, function errorCallback (response) {
							deferred.reject(response.data);
						});
					} else {
						// New user - create
						$http({
							method : 'POST',
							url : CONFIG.API_URL + 'kayttaja',
							data : user
						}).then(function successCallback (response) {
						    
						    $rootScope.$broadcast('Update_data', {
                                'type' : 'kayttaja'
                            });

							deferred.resolve(response.data.data.properties.id);
						}, function errorCallback (response) {
							deferred.reject(response.data);
						});

					}
					return deferred.promise;
				},
				/*
				 * Delete user and reload the window location (used for refreshing the data)
				 */
				deleteUser : function (user) {
					var deferred = $q.defer();
					$http({
						method : 'DELETE',
						url : CONFIG.API_URL + 'kayttaja/' + user.id
					}).then(function successCallback (response) {
					    
					    $rootScope.$broadcast('Update_data', {
                            'type' : 'kayttaja'
                        });
					    
						deferred.resolve();
					}, function errorCallback (response) {
						deferred.reject(response);
					});
					return deferred.promise;
				},
				getUserInventoryProjects : function (id) {
					var deferred = $q.defer();
					$http.get(CONFIG.API_URL + 'kayttaja/' + id + '/inventointiprojektit').then(function successCallback (data) {		
						deferred.resolve(data.data.data.features);
					}, function errorCallback (response) {
						deferred.reject(response);
					});
					return deferred.promise;
				}				
			}
		}
]);