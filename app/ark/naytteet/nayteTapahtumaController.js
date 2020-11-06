/*
 * Näytteen tapahtumien UI controller
 */
angular.module('mip.nayte').controller(
		'NayteTapahtumaController',
		[
			'$scope', '$rootScope', 'TabService', '$location', '$filter', 
			'CONFIG', 'AlertService', 'ModalService', 'ListService', 'locale', 'permissions',
			'olData', 'hotkeys', '$timeout', 'UserService', 'NgTableParams', 'NayteService', '$popover', 
			 'selectedModalNameId', 'ModalControllerService', 'tapahtuma', 'nayte', 'EntityBrowserService', 'KoriService',
			function ($scope, $rootScope, TabService, $location, $filter,  
			        CONFIG, AlertService, ModalService, ListService, locale, permissions,
			        olData, hotkeys, $timeout, UserService, NgTableParams, NayteService, $popover,
			        selectedModalNameId, ModalControllerService, tapahtuma, nayte, EntityBrowserService, KoriService) {
			    
			    var vm = this;

			    /**
			     * Controllerin set-up. 
			     */
			    vm.setUp = function() {
			        
			        angular.extend(vm, ModalControllerService);

                    // Valitun modalin nimi ja järjestysnumero
                    vm.modalNameId = selectedModalNameId;	                    
			        vm.setModalId();
			        vm.entity = 'tapahtuma';
			        
			        if(tapahtuma){
			        	vm.tapahtuma = tapahtuma;
			        }
			        if(nayte){
			        	vm.nayte = nayte;
			        }
                    
                    // Oikeudet
                    vm.permissions = permissions;
			    };
			    vm.setUp();			

			    
                /**
                 * Sulkemisruksi.
                 */
                $scope.close = function() {
               		vm.close();
                    $scope.$destroy();
                };
				
                /*
                 * Näytteiden taulu
                 */ 
                vm.naytteetTable = new NgTableParams({
                	page : 1,
                    count : 15,
                    total : 15}
                	, { 
                		getData : function($defer, params) {
                			var naytteet = [];
                			// Näytteiden haku joilla sama tapahtuman luotu leima
                        	NayteService.haeKoriTapahtumat(vm.tapahtuma.tapahtuma_tyyppi.id, vm.tapahtuma.luotu).then(function(data) {

                                if (data.count) {
                                    vm.searchResults = data.count;
                                } else {
                                    vm.searchResults = 0;
                                }
                                
                                // Näytteiden id:t kerätään mahdollista koriin lisäämistä varten
                                vm.koriIdLista = data.idlist;                                
                                
                                params.total(data.total_count);
                                $defer.resolve(data.features);
            				});
                		}
                	});
                
    			/*
    			 * Avaa näyte katselutilaan
    			 */ 
    			vm.avaaNayte = function(valittu_nayte) {
                	NayteService.haeNayte(valittu_nayte.properties.id).then(function(nayte) {
                		EntityBrowserService.setQuery('nayte', nayte.properties.id, {'tapahtuma': vm.tapahtuma}, vm.naytteetTable.data.length);
                		ModalService.nayteModal(nayte, false);
    				});
    			};
    			
                /**
                 * Avaa korin hakutulosten lisäämisen ikkunaan. Välitetään lista haetuista näytteen id:stä
                 */                
                vm.lisaaKoriin = function(){
                	// Haetaan näytteiden korityyppi
                	vm.koriPromise = KoriService.haeKorityyppi('ark_nayte');
    				vm.koriPromise.then(function (korityyppi){
    					if(korityyppi){
    						ModalService.lisaaKoriModal(vm.koriIdLista, korityyppi, 'ARK');
    					}
    				}, function(data) {
                        locale.ready('common').then(function() {
                            AlertService.showWarning(locale.getString('common.Error'), AlertService.message(data));
                        });
                    });  
                };
                
                /**
                 * Taulukon kolumnien tekstien haku
                 */
                vm.getColumnName = function(column, lang_file) {
                    var str;

                    if (lang_file) {
                        str = lang_file + '.' + column;
                    } else {
                        str = 'common.' + column;
                    }

                    return locale.getString(str);
                }
                
                /**
                 * Avaa linkistä valitun tutkimuksen omaan ikkunaan
                 */
                vm.avaaTutkimus = function(){
					TutkimusService.haeTutkimus(vm.tutkimus.id).then(function(tutkimus) {
						EntityBrowserService.setQuery('tutkimus', tutkimus.properties.id, {'tutkimus_id': tutkimus.properties.id}, 1);
						ModalService.tutkimusModal(true, tutkimus, null);
					});
                };

			}
		]);
