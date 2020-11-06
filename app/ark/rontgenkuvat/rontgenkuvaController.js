/*
 * XRAY UI controller
 */
angular.module('mip.file').controller(
		'RontgenkuvaController',
		[
			'$scope', '$rootScope', 'TabService', '$location', '$filter',
			'CONFIG', 'AlertService', 'ModalService', 'ListService', 'locale', 'permissions',
			'hotkeys', '$timeout', 'UserService', 'NgTableParams', 'RontgenkuvaService',
			'selectedModalNameId', 'ModalControllerService', 'xray', 'existing',
			'EntityBrowserService', 'FileService', 'relatedObjectType', 'relatedObject','tutkimusId',
			'LoytoService', 'NayteService',
			function ($scope, $rootScope, TabService, $location, $filter,
			        CONFIG, AlertService, ModalService, ListService, locale, permissions,
			        hotkeys, $timeout, UserService, NgTableParams, RontgenkuvaService,
			        selectedModalNameId, ModalControllerService, xray, existing,
			        EntityBrowserService, FileService, relatedObjectType, relatedObject, tutkimusId,
			        LoytoService, NayteService) {

			    var vm = this;

			    /**
			     * Controllerin set-up.
			     */
			    vm.setUp = function() {

			        angular.extend(vm, ModalControllerService);

                    // Valitun modalin nimi ja järjestysnumero
                    vm.modalNameId = selectedModalNameId;
			        vm.setModalId();
			        vm.entity = 'xray';
			        vm.tutkimusId = tutkimusId;

			        //RelatedObjectTypes (app.js):
			        //loyto: 17
			        //nayte: 18
                    // Valittu xray
                    if (existing) {
                        vm.xray = xray;
                        if(relatedObjectType === 'loyto') {
                            vm.xray.properties.entiteetti_tyyppi = 17;
                        } else {
                            vm.xray.properties.entiteetti_tyyppi = 18;
                        }
                        vm.xray.properties.entiteetti_id = relatedObject.properties.id;
                        vm.xray.properties.ark_tutkimus_id = vm.tutkimusId;


                        //Tallennetaan alkuperäinen mahdollisen peruuttamisen vuoksi
                        vm.original = angular.copy(vm.xray);
                        vm.edit = false;
                    } else {
                    	vm.xray =  { properties: { ark_tutkimus_id: vm.tutkimusId} };

                    	// Oletuksena kuluva päivä
                    	vm.xray.properties.pvm = new Date();
                    	vm.xray.properties.kuvaaja = UserService.getProperties().user.etunimi + " " + UserService.getProperties().user.sukunimi;
                    	if(relatedObjectType === 'loyto') {
                            vm.xray.properties.entiteetti_tyyppi = 17;
                            vm.xray.properties.loydot = [relatedObject.properties];
                        } else if(relatedObjectType === 'nayte') {
                            vm.xray.properties.entiteetti_tyyppi = 18;
                            vm.xray.properties.naytteet = [relatedObject.properties];
                        } else {
                        	throw error("Invalid relatedObject type!");
                        }
                    	vm.xray.properties.entiteetti_id = relatedObject.properties.id;
                    	vm.create = true;
                    	vm._editMode();
                    }

                    // Oikeudet
                    vm.permissions = permissions;
                    vm.uniikkiNumero = true;
			    };


				/**
				 * Peruuta muokkaus. Varmista pakollisten syöttö
				 */
				vm._cancelEdit = function () {
					vm.edit = false;
					vm.xray = angular.copy(vm.original);
 				};

				/**
				 * Muokkaa
				 */
				vm._editMode = function () {
					vm.edit = true;
					$scope.focusInput=true;
					//Linkkausdirektiivi vaatii id:n, jotta tiedetään mihin entiteettiin
					//direktiivi ja linkatut itemit liittyvät. Käytetään modalIdtä
					//avuksi väliaikaisesti.
					if(vm.xray.properties.id === undefined) {
						vm.xray.properties.id = -1*vm.modalId;
					}
					if(vm.xray.properties.loydot === undefined) {
						vm.xray.properties.loydot = [];
					}
					if(vm.xray.properties.naytteet === undefined) {
						vm.xray.properties.naytteet = [];
					}
					$timeout(function() {
                        $rootScope.$broadcast('mip-linkitys', {
                        	mode : 'xray',
                        	entityId : vm.xray.properties.id,
                        	nayteCount : vm.xray.properties.naytteet.length,
                        	loytoCount : vm.xray.properties.loydot.length,
                        	yksikkoCount : 0
                        });
					},100);
				};


			    vm.setUp();
				/**
				 * Tallenna
				 */
                vm.save = function () {
                    vm.disableButtonsFunc();
                    //Poistetaan väliaikainen id, jos sellainen oli käytössä ennen tallennusta
                    if(vm.xray.properties.id < 0) {
                    	delete vm.xray.properties.id;
                    }

                    RontgenkuvaService.luoTallennaRontgenkuva(vm.xray).then(function (xray) {
                        // Päivitetty löytö
                        vm.xray = xray;
                        vm.xray.properties.ark_tutkimus_id = vm.tutkimusId;

                        // "update" the original after successful save
                        vm.original = angular.copy(vm.xray);

                        AlertService.showInfo(locale.getString('common.Save_ok'), "");

                    	vm.disableButtonsFunc();

                    	// Katselutila päälle
                    	vm.edit = false;
                    	vm.create = false;

                    }, function error () {
                        AlertService.showError(locale.getString('common.Error'), locale.getString('common.Save_failed'));
                        vm.disableButtonsFunc();
                    });
                };
                /**
				 * Poista
				 */
                vm.deleteRontgenkuva = function () {
                	 var conf = confirm(locale.getString('common.Confirm_delete2', {'item': vm.xray.properties.numero}));
                     if (conf) {
                         RontgenkuvaService.poistaRontgenkuva(vm.xray).then(function() {
                             vm.close();
                             locale.ready('common').then(function() {
                                 AlertService.showInfo(locale.getString('common.Deleted'));
                             });
                         }, function error(data) {
                             locale.ready('error').then(function() {
                                 AlertService.showError(locale.getString('error.Delete_failed'), AlertService.message(data));
                             });
                         });
                     }
                };

                //Numeron tulee olla uniikki koko järjestelmässä
                vm.tarkistaNumero = function() {
                	RontgenkuvaService.haeRontgenkuvat({tarkka: true, numero: vm.xray.properties.numero}).then(function s(data) {
                		if(data.count == 0) {
                			vm.uniikkiNumero = true;
                		} else if(data.count == 1 && data.features[0].properties.id === vm.xray.properties.id) {
                			vm.uniikkiNumero = true;
                		} else {
                    		vm.uniikkiNumero = false;
                		}
                	}, function e(data) {
                		AlertService.showError(locale.getString('common.Error'), AlertService.showMessage(data));
                	});
                };

                $scope.close = function() {
            		vm.close();
                    $scope.$destroy();
                };

                vm.avaaLoyto = function(loyto) {
                	LoytoService.haeLoyto(loyto.id).then(function(l) {
                		EntityBrowserService.setQuery('loyto', l.properties.id, {'ark_kuva_id': vm.xray.properties.id}, vm.xray.properties.loydot.length, vm.xray.properties.loydot);
						ModalService.loytoModal(l, false);
					});
                };

                vm.avaaNayte = function(nayte) {
                	NayteService.haeNayte(nayte.id).then(function(n) {
                		EntityBrowserService.setQuery('nayte', n.properties.id, {'ark_kuva_id': vm.xray.properties.id}, vm.xray.properties.naytteet.length, vm.xray.properties.naytteet);
						ModalService.nayteModal(n, false);
					});
                };

                vm.lisaaTiedosto = function() {
			        //Avataan arkfileUploadController
			        ModalService.arkFileUploadModal('rontgenkuva', vm.xray, vm.tutkimusId);
                }

                /*
                 * Kartat
                 */
                vm.files = [];
                vm.getFiles = function() {
                    if (vm.xray.properties.id > 0) {
                        FileService.getArkFiles({
                            'jarjestys_suunta' : 'nouseva',
                            'rivit' : 1000,
                            'ark_rontgenkuva_id' : vm.xray.properties.id,
                            'ark_tutkimus_id': vm.tutkimusId
                        }).then(function success(files) {
                            vm.files = files.features;
                            // Tiedostojen määrä
                            vm.kpl_maara = vm.files.length;
                        }, function error(data) {
                            locale.ready('error').then(function() {
                                AlertService.showError(locale.getString("error.Getting_maps_failed"), AlertService.message(data));
                            });
                        });
                    }
                };
                vm.getFiles();

                /*
                 * Open the selected file for viewing
                 */
                vm.openFile = function(file) {
                    ModalService.arkFileModal(file, 'rontgenkuva', vm.xray, vm.permissions, vm.tutkimusId);
                };

                /*
                 * files were modified, fetch them again
                 */
                $scope.$on('arkFile_modified', function(event, data) {
                	vm.getFiles();
                });

		}
]);
