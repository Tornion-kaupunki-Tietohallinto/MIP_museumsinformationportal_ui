/*
 * Yksikön löytöjen listaus controller
 */
angular.module('mip.nayte').controller('YksikonNayteListController', [
		'$scope', 'TabService', '$location', 'CONFIG', '$filter', 'NgTableParams', 'NayteService', 'ModalService', 
		'AlertService', 'ListService', 'locale', '$rootScope', 'Auth', 'ListControllerService', 'selectedModalNameId', 'ModalControllerService',
		'naytekoodi', 'yksikko', 'tutkimusalue', 'permissions', 'EntityBrowserService',
		function($scope, TabService, $location, CONFIG, $filter, NgTableParams, NayteService, ModalService, 
				AlertService, ListService, locale, $rootScope, Auth, ListControllerService, selectedModalNameId, ModalControllerService,
				naytekoodi, yksikko, tutkimusalue, permissions, EntityBrowserService) {
			
			var vm = this;
			
            /**
             * Setup-metodi
             */
            vm.setUp = function() {
                
                angular.extend(vm, ListControllerService);
                angular.extend(vm, ModalControllerService);
                
                // Valitun modalin nimi ja järjestysnumero
                vm.modalNameId = selectedModalNameId;	                    
		        vm.setModalId();
                
		        vm.getColVisibilities('nayte');
		        
		        // yksikkö jolle löytö kuuluu
		        if(yksikko){
		        	vm.yksikko = yksikko;
		        }
                
            };  
            vm.setUp();
            
            /**
             * ModalHeader kutsuu scopesta closea
             */
            $scope.close = function() {
            	vm.close();
                $scope.$destroy();
            };

			/*
			 * Näytteet
			 */
            vm.naytteetTable = new NgTableParams({
                page : 1,
                count : 50,
                total : 25
            }, {
                defaultSort : "asc",
                getData : function($defer, params) {
                        	
                    filterParameters = ListService.parseParameters(params);
                    
                    // Lisätään yksikön id hakuun
                    filterParameters['ark_tutkimusalue_yksikko_id'] = yksikko.properties.id;

                    // Asetetaan naytekoodin id arvo hakuun. Tämä näin toistaiseksi koska oletusarvon asetus monivalintaan tökkii.
                    var valitutKoodit = filterParameters.naytekoodit;
                    if(valitutKoodit){
                        var nKoodit = '';

                        for (var i = 0; i < valitutKoodit.length; i++){
                            var materiaali = valitutKoodit[i];
                            if(materiaali['id']) {
                            	nKoodit = nKoodit + materiaali.id + ',';
                            } else {
                            	nKoodit = nKoodit + materiaali + ',';
                            }
                        }
                        // viimeinen pilkku pois
                        nKoodit = nKoodit.slice(0,-1);
                        
                        if(nKoodit){
                        	filterParameters['naytekoodit'] = nKoodit;
                        }
                    }
                    
                    vm.naytteetPromise = NayteService.haeNaytteet(filterParameters);
                    vm.naytteetPromise.then(function(data) {
                    	
                        if (data.count) {
                            vm.searchResults = data.count;
                        } else {
                            vm.searchResults = 0;
                        }                                        
                        
                        params.total(data.total_count);
                        $defer.resolve(data.features);
                        
                    }, function(data) {
                        locale.ready('common').then(function() {
                            AlertService.showWarning(locale.getString('common.Error'), AlertService.message(data));
                        });
                        orderedData = [];
                        $defer.resolve(orderedData);
                    });
                }
            });
            
            /*
             * Näytetaulukon suodatusten oletukset asetetaan yksikkö-sivun valinnan mukaan.
             */
            vm.hakuOletukset = function() {
                // Luodaan properties
                var filter = {
                        'properties' : {}
                    };
		        
		        // Näytekoodi 
		        if(naytekoodi){
		        	filter['properties']['naytekoodit'] = naytekoodi;
		        }
                
		        // Lisätään taulukon filttereihin
                angular.extend(vm.naytteetTable.filter(), filter);
            };

            vm.hakuOletukset();

			/*
			 * Avaa näyte katselutilaan
			 */ 
			vm.avaaNayte = function(valittu_nayte) {
            	NayteService.haeNayte(valittu_nayte.properties.id).then(function(nayte) {
            		EntityBrowserService.setQuery('nayte', nayte.properties.id, filterParameters, vm.naytteetTable.data.length);
            		ModalService.nayteModal(nayte, false);
				});
			};
			
			/*
			 * Päivitetään yksikön näytteiden taulukko, jos tiedot päivittyneet
			 */
            $scope.$on('Update_data', function(event, data) {                        
                if (data.type == 'nayte') {
                    vm.naytteetTable.reload();
                }
            });
			
			vm.curLocale = locale.getLocale();
			
		}
]);
