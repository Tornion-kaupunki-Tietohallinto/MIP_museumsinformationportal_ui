/*
 * Service for the authentication
 */
angular.module('mip.auth', []);

angular.module('mip.auth').factory(
    'Auth', [
        '$http', '$location', '$window', '$q', 'CONFIG', 'SessionService', 'UserService', 'AlertService',
        'locale', '$cookies', 'ListService', '$rootScope', 'RaporttiService', 'CacheFactory', '$injector',
        function ($http, $location, $window, $q, CONFIG, SessionService, UserService, AlertService,
            locale, $cookies, ListService, $rootScope, RaporttiService, CacheFactory, $injector) {
            return {
                /*
                 * 1. Handles the login 2. Stores the returned token in the sessionStorage and sets Authenticated to true (Is this needed?) 3. Stores the logged in user in the UserService.props.user
                 */
                login: function (loginData) {
                    var deferred = $q.defer();
                    $http({
                        method: 'POST',
                        url: CONFIG.API_URL + 'kayttaja/kirjaudu',
                        data: loginData
                    }).then(function (response) {
                        if (response.data.data.properties.token && response.data.data.properties.kayttaja) {
                            SessionService.set('token', response.data.data.properties.token);
                            SessionService.setAuthenticated(true);

                            var user = response.data.data.properties.kayttaja;

                            UserService.setUser(user);

                            //LangString is used only for setting the locale correctly. The locale does not accept the "lang" value directly, it requires it without the escaped quotes.
                            var langString = "";

                            if (user.kieli == "se") {
                                lang = "\"sv-FI\"";
                                langString = 'sv-FI';
                            } else if (user.kieli == "en") {
                                lang = "\"en-US\"";
                                langString = 'en-US';
                            } else {
                                lang = "\"fi-FI\"";
                                langString = 'fi-FI';
                            }

                            $cookies.put("COOKIE_LOCALE_LANG", lang);
                            locale.setLocale(langString);

                            $location.path(SessionService.getDestination()); // Redirect);
                            SessionService.setDestination(""); // clear the destination

                            //Näytetään katselijalle infoteksti kirjautumisen jälkeen
                            if (user.rooli == 'katselija') {
                                var ModalService = $injector.get('ModalService');
                                ModalService.showKatselijaInfoModal();
                            }
                            deferred.resolve();
                        } else {
                            locale.ready('common').then(function () {
                                AlertService.showError(locale.getString('common.Login_problem'), locale.getString('common.Try_again_later'));
                            });
                            deferred.reject(response);
                        }
                    }, function (data) {
                        locale.ready('common').then(function () {
                            AlertService.showError(locale.getString('common.Login_failed'), AlertService.message(data));
                        });
                        deferred.reject(data);
                    });
                    return deferred.promise;
                },
                /*
                 * Logout. * Removes the token from teh sessionStorage, * sets the Authenticated to false and * removes the user from the properties.
                 */
                logout: function () {
                    var deferred = $q.defer();
                    $http.get(CONFIG.API_URL + 'kayttaja/kirjaudu_ulos').then(function (data) {
                        SessionService.unset('token');

                        SessionService.setAuthenticated(false);
                        UserService.getProperties().user = {};

                        // Clear search properties
                        ListService.clearProps();
                        // Reset show hide properties
                        ListService.resetColumnVisibilities();

                        //Clear report related stuff
                        RaporttiService.cancelIntervals();
                        RaporttiService.deleteRunningReports();

                        //Clear caches
                        CacheFactory.clearAll();

                        //Clear tabs from the rootScope. Otherwise after changing user the tabs could be wrong (katselija sees admin tab etc)
                        $rootScope.tabs = [];
                        $rootScope.activeTab = "";
                        $rootScope.subTabs = [];
                        $rootScope.activeSubTab = "";

                        $location.url('/kirjaudu');
                        deferred.resolve(data);
                    }, function (data) {
                        locale.ready('common').then(function () {
                            AlertService.showError(locale.getString('common.Login_failed'), AlertService.message(data));
                        });
                        deferred.reject(data);
                    });
                    return deferred.promise;
                },
                /*
                 * Check permissions
                 * For the rakennusinventointi the permissions are returned within the user object.
                 * The permissions are then checked without network action IF the user object has already been resolved.
                 * If the user object is not resolved OR the side is arkeologia, we check the permissions from backend.
                 */
                checkPermissions: function (side, entity, id) {
                    var deferred = $q.defer();
                    var path;
                    var u = UserService.getProperties().user;

                    if ((id === null || id === undefined) && (u.id && u.id != '')) {
                        var permissions = u.oikeudet;
                        // Return the permissions from the user object
                        if (permissions[entity]) {
                            deferred.resolve(permissions[entity]);
                        } else {
                            //Incorrect type of entity for rakennusinventointi
                            deferred.reject({
                                data: {
                                    response: {
                                        message: [
                                            "INTERNAL ERROR"
                                        ]
                                    }
                                }
                            });
                        }
                        return deferred.promise;
                    } else {
                        // Get the permissions from the backend separately. This occurs after page reload as the user is not yet fetched.
                        if (side == "arkeologia" && id != null) {
                            path = "oikeus";
                        } else if (side == "arkeologia" && id == null) {
                            path = "rooli";
                        } else if (side == "rakennusinventointi") {
                            path = "rooli";
                        } else {
                            throw "Unknown side!";
                        }

                        var url = CONFIG.API_URL + path + "/" + side + "/" + entity;

                        if (typeof id !== "undefined" && id != null) {
                            url += "/" + id;
                        }

                        $http.get(url).then(function (data) {
                            deferred.resolve(data.data.data.content);
                        }, function (data) {
                            deferred.reject(data);
                        });
                    }
                    return deferred.promise;
                },
                checkArkTutkimusSubPermissions : function(tutkimusId) {
                    var deferred = $q.defer();
                    var url = CONFIG.API_URL + 'oikeus/arkeologia/ark_tutkimus_sub' + '/' + tutkimusId;

                    $http.get(url).then(function (data) {
                        deferred.resolve(data.data.data.content);
                    }, function (data) {
                        deferred.reject(data);
                    });
                    return deferred.promise;
                },
                /*
                 * Password restoration
                 */
                restorePassword: function (passwordRestorationData) {
                	if(!passwordRestorationData || !passwordRestorationData.kayttajatunnus){
                		return;
                	}
                    var deferred = $q.defer();
                    $http({
                        method: 'POST',
                        url: CONFIG.API_URL + 'kayttaja/' + passwordRestorationData.kayttajatunnus + '/salasana_unohtunut'
                    }).then(function (response) {
                        locale.ready('common').then(function () {
                            AlertService.showInfo(AlertService.message(response));
                        });
                        deferred.resolve(response);
                    }, function (data) {
                        locale.ready('common').then(function () {
                            AlertService.showError(locale.getString('common.Password_restoration_failed'), AlertService.message(data));
                        });
                        deferred.reject(data);
                    });
                    return deferred.promise;
                }
            }
        }
    ]);