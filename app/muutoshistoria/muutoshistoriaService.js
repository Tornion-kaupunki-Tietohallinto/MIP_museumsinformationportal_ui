
angular.module('mip.muutoshistoria', []);

angular.module('mip.muutoshistoria').factory('MuutoshistoriaService', [
	'$http', '$q', 'CONFIG', '$location', 'AlertService', 'locale', 'ListService', 
	function($http, $q, CONFIG, $location, AlertService, locale, ListService) {

		return {
			
			getKiinteistoMuutosHistoria : function(kiinteistoId) {
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
			getRakennusMuutosHistoria : function(rakennusId) {
				var deferred = $q.defer();
				var url = CONFIG.API_URL + 'rakennus/' + rakennusId +"/historia";
		
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
			getKylaMuutosHistoria : function(kylaId) {
                var deferred = $q.defer();
                var url = CONFIG.API_URL + 'kyla/' + kylaId +"/historia";
        
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
			getPorrashuoneMuutosHistoria : function(porrashuoneId) {
                var deferred = $q.defer();
                var url = CONFIG.API_URL + 'porrashuone/' + porrashuoneId +"/historia";
        
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
			getAlueMuutosHistoria : function(alueId) {
                var deferred = $q.defer();
                var url = CONFIG.API_URL + 'alue/' + alueId +"/historia";
        
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
            getKuntaMuutosHistoria : function(kuntaId) {
                var deferred = $q.defer();
                var url = CONFIG.API_URL + 'kunta/' + kuntaId +"/historia";
        
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
            getSuunnittelijaMuutosHistoria : function(suunnittelijaId) {
                var deferred = $q.defer();
                var url = CONFIG.API_URL + 'suunnittelija/' + suunnittelijaId +"/historia";
        
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
            getInventointiprojektiMuutosHistoria : function(inventointiprojektiId) {
                var deferred = $q.defer();
                var url = CONFIG.API_URL + 'inventointiprojekti/' + inventointiprojektiId +"/historia";
        
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
            getArvoalueMuutosHistoria : function(arvolueId) {
                var deferred = $q.defer();
                var url = CONFIG.API_URL + 'arvoalue/' + arvolueId +"/historia";
        
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
            getInventointijulkaisuMuutosHistoria : function(inventointijulkaisuId) {
                var deferred = $q.defer();
                var url = CONFIG.API_URL + 'inventointijulkaisu/' + inventointijulkaisuId +"/historia";
        
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
            getMatkaraporttiMuutosHistoria : function(matkaraporttiId) {
                var deferred = $q.defer();
                var url = CONFIG.API_URL + 'matkaraportti/' + matkaraporttiId +"/historia";
        
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
            getArkTutkimusMuutoshistoria : function(tutkimusId) {
                var deferred = $q.defer();
                var url = CONFIG.API_URL + 'tutkimus/' + tutkimusId +"/historia";
        
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
            getArkKohdeMuutoshistoria : function(kohdeId) {
                var deferred = $q.defer();
                var url = CONFIG.API_URL + 'kohde/' + kohdeId +"/historia";
        
                $http({
                    method : 'GET',
                    url : url
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