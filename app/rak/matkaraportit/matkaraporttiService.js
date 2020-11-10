/*
 * Service for handling the matkaraportti CRUD
 */

angular.module('mip.matkaraportti', []);


angular.module('mip.matkaraportti').factory('MatkaraporttiService', [
                '$http', '$q', 'CONFIG', 'AlertService', 'ListService', 'locale', '$route', 'CacheFactory', '$rootScope', 
        function ($http, $q, CONFIG, AlertService, ListService, locale, $route, CacheFactory, $rootScope) {
             
            CacheFactory('matkaraporttiCache', {
                maxAge: 10 * 60 * 1000, // Items added to this cache expire after 10 minutes
                cacheFlushInterval: 60 * 60 * 1000, // This cache will clear itself every hour
                deleteOnExpire: 'passive', // Cache will do nothing when an item expires. Expired items will remain in the cache until requested, at which point they are removed, and undefined is returned.
                capacity: 50 //Maximum number of items a cache can hold. Adding more items than the capacity will cause the cache to operate like an LRU cache, removing the least recently used items to stay under capacity. Default: Number.MAX_VALUE.                  
              });
            
            return {
                /*
                 * Fetches the matkaraportit from the backend with the given search words (100kpl)
                 */
                getMatkaraportit : function (params) {
                    var queryString = '';

                    for ( var parameter in params) {
                        if (params.hasOwnProperty(parameter)) {
                            if (queryString.length == 0) {
                                queryString = '?' + parameter + "=" + params[parameter];
                            } else {
                                queryString += '&' + parameter + "=" + params[parameter];
                            }
                        }
                    }

                    /*
                     * uncomment for Mäntymäki if (queryString == '') { queryString = "?rivit=50&rivi=1450" }
                     */

                    var deferred = $q.defer();
                    var url = CONFIG.API_URL + 'matkaraportti/' + queryString;
                    $http({
                        method : 'GET',
                        url : url,
                        cache : CacheFactory.get('matkaraporttiCache')
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
                 * Fetches the kiinteisto details from the backend when kiinteisto has been selected
                 */
                fetchMatkaraportti : function (id) {
                    var deferred = $q.defer();
                    var url = CONFIG.API_URL + "matkaraportti/" + id;
                    $http({
                        method : 'GET',
                        url : url
                    }).then(function successCallback (response) {
                        deferred.resolve(response.data.data);
                    }, function errorCallback (response) {                      
                        deferred.reject(response);
                    });
                    return deferred.promise;
                },
                saveMatkaraportti: function (matkaraportti) {
                    var deferred = $q.defer();
                    if (matkaraportti.properties.id) {
                        $http({
                            method : 'PUT',
                            url : CONFIG.API_URL + 'matkaraportti/' + matkaraportti.properties.id,
                            data : matkaraportti.properties
                        }).then(function success (response) {
                            
                            //Clear the cache
                            CacheFactory.get('matkaraporttiCache').removeAll();               
                                
                            $rootScope.$broadcast('Update_data', {
                                'type' : 'matkaraportti'
                            });
                            
                            deferred.resolve(response.data.data.properties.id);
                        }, function error (response) {
                            deferred.reject(response.data);
                        });
                    } else {
                        $http({
                            method : 'POST',
                            url : CONFIG.API_URL + 'matkaraportti',
                            data : matkaraportti.properties
                        }).then(function success (response) {
                            
                            CacheFactory.get('matkaraporttiCache').removeAll();
                            
                            $rootScope.$broadcast('Update_data', {
                                'type' : 'matkaraportti'
                            });
                            
                            deferred.resolve(response.data.data.properties.id);
                        }, function error (response) {                          
                            deferred.reject(response);
                        });
                    }
                    return deferred.promise;
                },
                deleteMatkaraportti : function (matkaraportti) {
                    var deferred = $q.defer();
                    $http({
                        method : 'DELETE',
                        url : CONFIG.API_URL + "matkaraportti/" + matkaraportti.properties.id
                    }).then(function success (response) {

                        CacheFactory.get('matkaraporttiCache').removeAll();
                        
                        $rootScope.$broadcast('Update_data', {
                            'type' : 'matkaraportti'
                        });
                        
                        deferred.resolve();
                    }, function error (response) {
                        deferred.reject(response);
                    });
                    return deferred.promise;
                }               
            }
        }
]);