/*
 * Käsittelyn UI controller
 */
angular.module('mip.kasittely').controller(
		'KasittelyController',
		[
			'$scope', '$rootScope', 'TabService', '$location', '$filter',
			'CONFIG', 'AlertService', 'ModalService', 'ListService', 'locale', 'permissions',
			'olData', 'hotkeys', '$timeout', 'UserService', 'NgTableParams', '$popover',
			'selectedModalNameId', 'ModalControllerService', 'kasittely', 'isCreate',
			'EntityBrowserService', 'KasittelyService', 'TutkimusService', 'LoytoService', 'NayteService', 'FileService',
			function ($scope, $rootScope, TabService, $location, $filter,
			        CONFIG, AlertService, ModalService, ListService, locale, permissions,
			        olData, hotkeys, $timeout, UserService, NgTableParams, $popover,
			        selectedModalNameId, ModalControllerService, kasittely, isCreate,
			        EntityBrowserService, KasittelyService, TutkimusService, LoytoService, NayteService, FileService) {

			    var vm = this;

			    /**
			     * Controllerin set-up.
			     */
			    vm.setUp = function() {

			        angular.extend(vm, ModalControllerService);

                    // Valitun modalin nimi ja järjestysnumero
                    vm.modalNameId = selectedModalNameId;
			        vm.setModalId();
			        vm.entity = 'kasittely';

                    // Käsittely välitetty
                    if (kasittely) {
                        vm.kasittely = kasittely;
                        vm.tapahtumat = vm.kasittely.properties.tapahtumat;
                    }

                    // Oikeudet
                    vm.permissions = permissions;

                    vm.editTapahtuma = null;

                    if(isCreate){
    					vm.edit = true;
    					vm.create = true;
                    }

			    };
			    vm.setUp();


                /**
                 * Sulkemisruksi.
                 */
                $scope.close = function() {
            		vm.close();
                    $scope.$destroy();
                };

				/**
				 * Peruuta muokkaus.
				 */
				vm._cancelEdit = function () {
					vm.edit = false;
					vm.create = false;
					vm.kasittely = angular.copy(vm.original);
 				};

				/**
				 * Muokkaa käsittelyä
				 */
				vm._editMode = function () {
					vm.original = angular.copy(vm.kasittely);
					vm.edit = true;
				};

				/**
				 * Tallenna käsittely
				 */
                vm.save = function (form) {
                	vm.disableButtons = true;

                	// Tapahtumien asetus
                	vm.kasittely.properties.tapahtumat = vm.tapahtumat;

                	KasittelyService.luoTallennaKasittely(vm.kasittely).then(function (kasittely) {

                        // "update" the original after successful save
                        vm.original = angular.copy(vm.kasittely);

                        // Päivitetty käsittely
                        vm.kasittely = kasittely;

                        AlertService.showInfo(locale.getString('common.Save_ok'), "");

                        vm.disableButtons = false;

                    	// Katselutila päälle
                    	vm.edit = false;
                    	vm.create = false;
                		vm.editTapahtuma = null;

                    	// Tapahtumataulukon arvot
                    	vm.tapahtumat = kasittely.properties.tapahtumat;

                    	// Taulukoiden päivitys
                    	vm.paivitaTapahtumat();
                    	vm.paivitaLoydotNaytteet();

                    }, function error () {
                        AlertService.showError(locale.getString('common.Error'), locale.getString('common.Save_failed'));
                        vm.disableButtons = false;
                    });
                };

    			/*
    			 *  Toimenpiteen nimen oltava uniikki
    			 */
    			vm.uniikkiKasittelytunnus = true;
    			vm.tarkistaUniikkiKasittelytunnus = function (form) {
    				if(vm.kasittely.properties.kasittelytunnus){
    					var available = KasittelyService.tarkistaKasittelytunnus(vm.kasittely.properties.kasittelytunnus).then(function success (data) {
    						if (data) {
    							form.kasittelytunnus.$setValidity('kaytossa', true);
    							vm.uniikkiKasittelytunnus = true;
    						} else {
    							form.kasittelytunnus.$setValidity('kaytossa', false);
    							vm.uniikkiKasittelytunnus = false;
    						}
    					});
    					return available;
    				}
    			};

    			/**
    			 * Käsittelytapahtumat taulu
    			 */
                vm.paivitaTapahtumat = function (){
                    vm.tapahtumatTable = new NgTableParams({
                        page : 1,
                        count : 500,
                        total : 500
                    }, {
                        defaultSort : "asc",
                        data : vm.tapahtumat
                    });
                };
                vm.paivitaTapahtumat();

               /*
                * Uuden rivin lisäys
                */
                vm.lisaaTapahtuma = function() {
                	var rivi = {'id': null, 'paivamaara': new Date(), 'kasittelytoimenpide': '', 'huomiot': ''};
                	vm.tapahtumatTable.data.push(rivi);
                	vm.muokkaaTapahtuma(rivi)
                };

                /*
                 * Muokataan riviä
                 */
                vm.muokkaaTapahtuma = function (rivi) {
                	vm.originalTapahtuma = angular.copy(rivi);
                	vm.editTapahtuma = rivi;
                };

                /*
                 * Rivikohtainen tallennus
                 */
                vm.tallennaTapahtuma = function() {
                	// Rivi lisätty
                	if(vm.editTapahtuma.id === null) {
                		vm.tapahtumat.push(vm.editTapahtuma);
                	}

            		// Tallennetaan aina koko käsittely listoineen
            		vm.save();
                };

                /*
                 * Peruuta uuden rivin lisäys
                 */
                vm.peruutaTapahtuma = function(tapahtuma) {
                	// Viimeisin lisätty tapahtuma poista listalta
                	if(tapahtuma.id === null) {
                		vm.tapahtumatTable.data.pop();
                	}
                	//vm.tapahtumatTable.reload();
                	vm.editTapahtuma = null;
                }

                /*
                 * Rivikohtainen tapahtuman poisto
                 */
                vm.poistaTapahtuma = function(tapahtuma) {
                	var conf = confirm(locale.getString('common.Confirm_delete2', {'item': vm.kasittely.properties.kasittelytunnus}));
                    if (conf) {
                    	// Poistetaan valittu rivi listalta
                    	var ind = vm.tapahtumat.indexOf(tapahtuma);
                    	vm.tapahtumat.splice(ind, 1);

                		// Tallennetaan aina koko käsittely listoineen
                		vm.save();
                    }
                };

    			/**
    			 * Löytöjen ja näytteiden taulu
    			 */
                vm.paivitaLoydotNaytteet = function (){
                    vm.loydotNaytteetTable = new NgTableParams({
                        page : 1,
                        count : 500,
                        total : 500
                    }, {
                        defaultSort : "asc",
                        data : vm.kasittely.properties.loydot_naytteet
                    });
                };
                vm.paivitaLoydotNaytteet();

                /**
                 * Avaa linkistä valitun tutkimuksen omaan ikkunaan
                 */
                vm.avaaTutkimus = function(tutkimus_id){
					TutkimusService.haeTutkimus(tutkimus_id).then(function(tutkimus) {
						// Entiteetti-selain deaktivoidaan näin tarkoituksella, koska ei voida selaille erityyppisiä arvoja samasta taulukosta
						EntityBrowserService.setQuery('tutkimus', tutkimus.properties.id, {'tutkimus_id': tutkimus.properties.id}, 1);
						ModalService.tutkimusModal(true, tutkimus, null);
					});
                };

                /**
                 * Avaa linkistä valitun löydön omaan ikkunaan
                 */
                vm.avaaLoyto = function(loyto_id){
                	LoytoService.haeLoyto(loyto_id).then(function(loyto) {
                		EntityBrowserService.setQuery('loyto', loyto.properties.id, {'loyto_id': loyto.properties.id}, 1);
                		ModalService.loytoModal(loyto, false);
					});
                };

                /**
                 * Avaa linkistä valitun näytteen omaan ikkunaan
                 */
                vm.avaaNayte = function(nayte_id){
                	NayteService.haeNayte(nayte_id).then(function(nayte) {
                		EntityBrowserService.setQuery('nayte', nayte.properties.id, {'nayte_id': nayte.properties.id}, 1);
                		ModalService.nayteModal(nayte, false);
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

				hotkeys.bindTo($scope).add({
					combo : 'ä',
					description : 'vm.features',
					callback : function () {
						console.log(angular.copy(vm.kasittely.properties));
					}
				});

				/*
                 * Liitetiedostot
                 */
                vm.lisaaTiedosto = function() {
			        //Avataan arkfileUploadController
			        ModalService.arkFileUploadModal('kasittely', vm.kasittely/*, vm.tutkimusId*/);
                }

                vm.files = [];
                vm.getFiles = function() {
                    if (vm.kasittely.properties.id > 0) {
                        FileService.getArkFiles({
                            'jarjestys_suunta' : 'nouseva',
                            'rivit' : 1000,
                            'ark_kons_kasittely_id' : vm.kasittely.properties.id
                            //'ark_tutkimus_id': vm.tutkimusId
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
                    ModalService.arkFileModal(file, 'kasittely', vm.kasittely, vm.permissions/*, vm.tutkimusId*/);
                };

                /*
                 * files were modified, fetch them again
                 */
                $scope.$on('arkFile_modified', function(event, data) {
                	vm.getFiles();
                });
		}
]);
