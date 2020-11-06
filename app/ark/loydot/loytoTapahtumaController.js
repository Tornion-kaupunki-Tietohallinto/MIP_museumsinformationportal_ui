/*
 * Löydön tapahtumien UI controller
 */
angular.module('mip.loyto').controller(
		'LoytoTapahtumaController',
		[
			'$scope', '$rootScope', 'TabService', '$location', '$filter', 
			'CONFIG', 'AlertService', 'ModalService', 'ListService', 'locale', 'permissions',
			'olData', 'hotkeys', '$timeout', 'UserService', 'NgTableParams', 'LoytoService', '$popover', 
			 'selectedModalNameId', 'ModalControllerService', 'tapahtuma', 'loyto', 'EntityBrowserService', 'KoriService',
			function ($scope, $rootScope, TabService, $location, $filter,  
			        CONFIG, AlertService, ModalService, ListService, locale, permissions,
			        olData, hotkeys, $timeout, UserService, NgTableParams, LoytoService, $popover,
			        selectedModalNameId, ModalControllerService, tapahtuma, loyto, EntityBrowserService, KoriService) {
			    
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
			        if(loyto){
			        	vm.loyto = loyto;
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
                 * Löytöjen taulu
                 */ 
                vm.loydotTable = new NgTableParams({
                	page : 1,
                    count : 15,
                    total : 15}
                	, { 
                		getData : function($defer, params) {
                			var loydot = [];
                			// Löytöjen haku joilla sama tapahtuman luotu leima
                        	LoytoService.haeKoriTapahtumat(vm.tapahtuma.tapahtuma_tyyppi.id, vm.tapahtuma.luotu).then(function(data) {

                                if (data.count) {
                                    vm.searchResults = data.count;
                                } else {
                                    vm.searchResults = 0;
                                }
                                
                                // Löytöjen id:t kerätään mahdollista koriin lisäämistä varten
                                vm.koriIdLista = data.idlist;                                
                                
                                params.total(data.total_count);
                                $defer.resolve(data.features);
            				});
                		}
                	});
                
    			/*
    			 * Avaa löytö katselutilaan
    			 */ 
    			vm.avaaLoyto = function(valittu_loyto) {
                	LoytoService.haeLoyto(valittu_loyto.properties.id).then(function(loyto) {
                		EntityBrowserService.setQuery('loyto', loyto.properties.id, {'tapahtuma': vm.tapahtuma}, vm.loydotTable.data.length);
                		ModalService.loytoModal(loyto, false);
    				});
    			};
    			
                /**
                 * Avaa korin hakutulosten lisäämisen ikkunaan. Välitetään lista haetuista löytö id:stä
                 */                
                vm.lisaaKoriin = function(){
                	// Haetaan löytöjen korityyppi
                	vm.koriPromise = KoriService.haeKorityyppi('ark_loyto');
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
