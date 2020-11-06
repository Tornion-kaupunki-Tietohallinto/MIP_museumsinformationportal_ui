angular.module('mip.search', []);

angular.module('mip.search').factory('SearchService', [
		'$http', '$q', 'CONFIG', 'locale', 'ListService', function ($http, $q, CONFIG, locale, ListService) {
			var params = {};

			return {
				setParam : function (key, value) {
					params[key] = value;
				},
				getParams : function () {
					return params;
				},
				deleteParam : function (key) {
					if (params[key]) {
						delete params[key];
						return true;
					}
					return false;
				},
				/*
				 * Search
				 */
				search : function (params) {
					var deferred = $q.defer();
					var url = CONFIG.API_URL + "solr/";
					var h = "*" + params.hakusana + "*";

					var r = 10;
					if (params.rivit) {
						r = params.rivit;
					}

					var a = 0;
					if (params.rivi) {
						a = params.rivi;
					}

					var k = "combinedSearch";
					if (params.kentat) {
						k = params.kentat;
					}

					$http({
						method : 'GET',
						url : url,
						params : {
							"kentta" : k,
							"hakusana" : h,
							"rivit" : r,
							"rivi" : a
						}
					}).then(function successCallback (response) {
						deferred.resolve(response);
					}, function errorCallback (response) {
						deferred.reject(response);
					});
					return deferred.promise;
				}
			}
		}
]);