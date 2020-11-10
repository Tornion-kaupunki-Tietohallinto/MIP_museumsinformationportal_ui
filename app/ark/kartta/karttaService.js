/*
 * Service for handling kartat (attachment type)
 */
angular.module('mip.file').factory('KarttaService', [
        '$http', '$q', 'CONFIG', 'ListService', 'AlertService', 'Upload', '$timeout', 'locale', '$rootScope',
        function($http, $q, CONFIG, ListService, AlertService, Upload, $timeout, locale, $rootScope) {
            return {
                /*
                 * Fetches the kartat from the backend with the given search words (100kpl)
                 */
                getArkKartat : function(params) {
                    var queryString = ListService.parseQueryString(params);
                    var deferred = $q.defer();
                    var url = CONFIG.API_URL + 'ark_kartta/' + queryString;

                    $http({
                        method : 'GET',
                        url : url
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
                getArkKartta : function(id) {
                    var deferred = $q.defer();
                    var url = CONFIG.API_URL + "ark_kartta/" + id;
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
                saveArkKartta : function(tiedosto, tiedot, entiteettiTyyppi, entiteettiId, tutkimusId) {
                    /*
                     * When a new kartta is uploaded, we have the tiedot. When an existing kartta is modified, we do not have tiedot.
                     */
                    var deferred = $q.defer();

                    if (!tiedot) {
                        // Existing image--> update properties
                        $http({
                            method : 'PUT',
                            url : CONFIG.API_URL + 'ark_kartta/' + tiedosto.properties.id,
                            data : tiedosto.properties
                        }).then(function success(response) {
                            deferred.resolve(tiedosto.properties.id);
                        }, function error(response) {
                            deferred.reject(response.data);
                        });
                    } else {
                        tiedosto.upload = Upload.upload({
                            url : CONFIG.API_URL + "ark_kartta/",
                            data : {
                                kuvaus : tiedot.kuvaus,
                                piirtaja : tiedot.kuvaaja,
                                entiteetti_tyyppi : entiteettiTyyppi,
                                entiteetti_id : entiteettiId,
                                tiedosto : tiedosto,
                                ark_tutkimus_id : tutkimusId
                            }
                        });

                        tiedosto.upload.then(function(response) {
                            $timeout(function() {
                                tiedosto.result = response.data;
                                deferred.resolve(response.data);
                            });
                        }, function(response) {
                            deferred.reject(response);
                        });
                    }
                    return deferred.promise;
                },
                deleteArkKartta : function(id, entityType, entityId) {
                    var deferred = $q.defer();
                    $http({
                        method : 'DELETE',
                        url : CONFIG.API_URL + "ark_kartta/" + id,
                        params : {
                            entiteetti_tyyppi : entityType,
                            entiteetti_id : entityId
                        }
                    }).then(function success(response) {
                        deferred.resolve(response);
                    }, function error(response) {
                        locale.ready('common').then(function success() {
                            AlertService.showError(locale.getString('common.Error'), AlertService.message(response));
                        });
                        deferred.reject(response);
                    });
                    return deferred.promise;
                },
                isArkKarttanumeroUnique : function(params) {
                    var queryString = ListService.parseQueryString(params);
                    var deferred = $q.defer();
                    var url = CONFIG.API_URL + 'ark_kartta/uniikkikarttanumero/' + queryString;

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
                getNextKarttanumero : function(params) {
                	var queryString = ListService.parseQueryString(params);
                    var deferred = $q.defer();
                    var url = CONFIG.API_URL + 'ark_kartta/seuraavakarttanumero/' + queryString;
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