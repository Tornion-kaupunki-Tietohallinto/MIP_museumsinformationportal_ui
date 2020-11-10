/*
 * Yksikkö UI controller
 */
angular.module('mip.yksikko').controller(
		'YksikkoController',
		[
				'$scope', '$rootScope', 'TabService', '$location', '$filter',
				'CONFIG', 'AlertService', 'ModalService', 'ListService', 'locale', 'permissions',
				'olData', 'hotkeys', '$timeout', 'UserService', 'NgTableParams', 'YksikkoService', '$popover',
				 'selectedModalNameId', 'ModalControllerService', 'yksikko', 'tutkimusalue', 'FileService', 'KarttaService',
				function ($scope, $rootScope, TabService, $location, $filter,
				        CONFIG, AlertService, ModalService, ListService, locale, permissions,
				        olData, hotkeys, $timeout, UserService, NgTableParams, YksikkoService, $popover,
				        selectedModalNameId, ModalControllerService, yksikko, tutkimusalue, FileService, KarttaService) {

				    var vm = this;

				    /**
				     * Controllerin set-up.
				     */
				    vm.setUp = function() {

				        angular.extend(vm, ModalControllerService);

	                    // Valitun modalin nimi ja järjestysnumero
	                    vm.modalNameId = selectedModalNameId;
				        vm.setModalId();
				        vm.entity = 'yksikko';


	                    // Valittu yksikkö
	                    if (yksikko) {
	                        vm.yksikko = yksikko;
	                        vm.tutkimusalue = vm.yksikko.properties.tutkimusalue;
	                        vm.tutkimus = vm.tutkimusalue.tutkimus;
	                    }
	                    //Tallennetaan alkuperäinen mahdollisen peruuttamisen vuoksi
	                    vm.original = angular.copy(vm.yksikko);

	                    // Tilan päättelyt:
	                    if(vm.yksikko.properties.kaivaus_valmis){
	                    	// Kaivaus valmis
	                    	vm.edit = false;
	                    	vm.showNotes = false;
	                    	vm.create = false;
	                    	$scope.focusInput = false;
	                    	$scope.focusInput2 = false;
	                    }else{
	                    	// Kaivaus kesken
	                    	vm.edit = false;
	                    	vm.showNotes = false;
	                    	vm.create = true;
	                    	$scope.focusInput = false;
	                    	$scope.focusInput2 = true;
	                    }

	                    // Oikeudet
	                    vm.permissions = permissions;
				    };
				    vm.setUp();


                    // Roolien alustus
                    vm.omistaja = false;
                    vm.tutkija = false;
                    vm.katselija = false;

                    /**
                     * ModalHeader kutsuu scopesta closea
                     */
                    $scope.close = function() {
                        vm.close();
                        $scope.$destroy();
                    };

					/**
					 * Peruuta muokkaus
					 */
					vm._cancelEdit = function () {
                        vm.edit = false;
                        vm.showNotes = false;
					};

					/**
					 * Vain muistiinpanojen katselu
					 */
					vm.viewNotes = function (){
						vm.create = false;
						vm.edit = false;
						vm.showNotes = true;
					};

					/**
					 * Muokkaa yksikköä, yksikön jälkityöt
					 */
					vm._editMode = function () {
						//vm.originalFeatures = angular.copy(vm.features);
						vm.create = false;
						vm.edit = true;
						vm.showNotes = true;
						$scope.focusInput = true;
					};

					/**
					 * Muokkaa muistiinpanoja
					 */
					vm.editNotes = function (){
						vm.create = true;
						vm.edit = false;
						vm.showNotes = false;
						$scope.focusInput2 = true;
					};

					/**
					 * Tallenna yksikkö
					 */
                    vm.save = function () {
                        vm.disableButtonsFunc();

                        YksikkoService.luoTallennaYksikko(vm.yksikko).then(function (yksikko) {

                        	// Päivitetään tutkimusalue-sivun yksiköt taulukko
                            $rootScope.$broadcast('Paivita_yksikko_table', {
                                'toiminto' : 'tallenna',
                                'ark_tutkimusalue_id': vm.yksikko.properties.ark_tutkimusalue_id,
                                'ark_vanha_tutkimusalue_id': vm.original.properties.ark_tutkimusalue_id
                            });

                        	// Jos muistiinpanot merkitään valmiiksi, suljetaan avoin modaali ja avataan yksikkö katselutilaan
                        	if(vm.yksikko.properties.kaivaus_valmis && vm.create){

                        		AlertService.showInfo(locale.getString('common.Save_ok'), locale.getString('unit.Digging_ready_confirm'));

                        		// Haetaan tallennettu yksikkö, jotta muistiinpanokenttien arvot näkyvät varsinaisissa kentissä
                        		YksikkoService.haeYksikko(vm.yksikko.properties.id).then(function (yksikko){
                        			vm.yksikko = yksikko;
                        		});

                        		vm.close();
                                $scope.$destroy();

                        		ModalService.yksikkoModal(vm.yksikko, vm.tutkimusalue, vm.permissions);
                        	}else{
                        		vm.create = false;
                                vm.edit = false;

                                // Valmiille ei näytetä muistiinpanoja katselutilassa
                                if(vm.yksikko.properties.kaivaus_valmis){
                                	vm.showNotes = false;
                                }else{
                                	vm.showNotes = true;
                                }

                                // Jos valmis muutetaan takaisin keskeneräiseksi, ilmoitus ja suljetaan modaali
                                if(!vm.yksikko.properties.kaivaus_valmis){
                                	AlertService.showInfo(locale.getString('common.Save_ok'), locale.getString('unit.Unit_set_unfinished'));
                                	vm.close();
                                    $scope.$destroy();
                                }else{
                                    // "update" the original after successful save
                                    vm.original = angular.copy(vm.yksikko);

                                    AlertService.showInfo(locale.getString('common.Save_ok'), "");
                                }
                         	}

                        	vm.disableButtonsFunc();

                        }, function error () {
                            AlertService.showError(locale.getString('common.Error'), locale.getString('common.Save_failed'));
                            vm.disableButtonsFunc();
                        });
                    };

                    /**
                     * Löytojen listaussivun avaus. Asetetaan hakuparametrit valmiiksi valinnan mukaan.
                     * Ajoitus ja valittu materiaalikoodi välitetään.
                     * Vaihtoehdot: 'ajoitettu', 'ajoittamaton' tai 'poistettu'.
                     */
                    vm.listaaLoydot = function (materiaalikoodit, ajoitettu){

                    	// Samaa materiaalia voi olla useita, joten otetaan aina ensimmäinen
                    	var materiaali = [];
                    	materiaali.push(materiaalikoodit[0]);

                    	ModalService.yksikonLoydotModal(materiaali, vm.yksikko, tutkimusalue, ajoitettu, vm.permissions);
                    };

                    /**
                     * Näytteiden listaussivun avaus. Asetetaan hakuparametri näytekoodi valmiiksi valinnan mukaan.
                     */
                    vm.listaaNaytteet = function (naytekoodit){

                    	// Näytekoodeja voi olla useita, joten otetaan aina ensimmäinen
                    	var naytekoodi = [];
                    	naytekoodi.push(naytekoodit[0]);

                    	ModalService.yksikonNaytteetModal(naytekoodi, vm.yksikko, tutkimusalue, vm.permissions);
                    };

					/**
					 * Poista yksikkö
					 */
                    vm.poistaYksikko = function() {
                    	// Poisto estetty jos yksiköllä on löytöjä
                        if(vm.yksikko.properties.loydot.length > 0 ||
                        		vm.yksikko.properties.naytteet.length > 0 ||
                        		vm.kartat.length > 0 ||
                        		(vm.images && vm.images.length > 0)){ //TODO: Lisää tarkastukseen liitetiedostot kun toteutettu
                        	AlertService.showError(locale.getString('unit.Delete_failed'), locale.getString('unit.Unit_delete_error'));
                        }else{
	                        var conf = confirm(locale.getString('common.Confirm_delete2', {'item': vm.yksikko.properties.yksikkotunnus}));
	                        if (conf) {
	                            YksikkoService.poistaYksikko(vm.yksikko).then(function() {
	                            	// Päivitetään tutkimusalue-sivun yksiköt taulukko
	                                $rootScope.$broadcast('Paivita_yksikko_table', {
	                                    'toiminto' : 'poista',
	                                    'ark_tutkimusalue_id': vm.yksikko.properties.ark_tutkimusalue_id
	                                });
	                                vm.close();
	                                $scope.$destroy();
	                                locale.ready('common').then(function() {
	                                    AlertService.showInfo(locale.getString('common.Deleted'));
	                                });
	                            }, function error(data) {
	                                locale.ready('area').then(function() {
	                                    AlertService.showError(locale.getString('ark.Research_delete_failed'), AlertService.message(data));
	                                });
	                            });
	                        }
                        }
                    };

                    /*
                     * Add image to the alue
                     */
                    vm.addImage = function(luetteloi) {
                        ModalService.arkImageUploadModal('yksikko', vm.yksikko, luetteloi, vm.tutkimus.id);
                    };

                    /*
                     * Open the selected image for viewing
                     */
                    vm.openImage = function(image, kuvat) {
                        ModalService.arkImageModal(image, 'yksikko', vm.yksikko, vm.permissions, kuvat, vm.tutkimus.id);
                    };

                    /*
                     * Images were modified, fetch them again
                     */
                    $scope.$on('arkKuva_modified', function(event, data) {
                    	vm.getImages();
                    });

                    /*
                     * Add kartta to the alue
                     */
                    vm.addKartta = function() {
                        ModalService.arkKarttaUploadModal('yksikko', vm.yksikko, vm.tutkimus.id);
                    };

                    /*
                     * kartat
                     */
                    vm.kartat = [];
                    vm.getKartat = function() {
                        if (vm.yksikko.properties.id) {
                            KarttaService.getArkKartat({
                                'jarjestys' : 'ark_kartta.karttanumero',
                                'jarjestys_suunta' : 'nouseva',
                                'rivit' : 1000,
                                'ark_yksikko_id' : vm.yksikko.properties.id,
                                'ark_tutkimus_id': vm.tutkimus.id //Käyttäjäoikeuksien tarkastusta varten
                            }).then(function success(kartat) {
                            	if(kartat.features) {
                            		vm.kartat = kartat.features;
                            	}
                            }, function error(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString("error.Getting_maps_failed"), AlertService.message(data));
                                });
                            });
                        }
                    };
                    vm.getKartat();

                    /*
                     * Open the selected image for viewing
                     */
                    vm.openKartta = function(kartta) {
                        ModalService.arkKarttaModal(kartta, 'yksikko', vm.yksikko, vm.permissions, vm.kartat, vm.tutkimus.id);
                    };

                    /*
                     * Images were modified, fetch them again
                     */
                    $scope.$on('arkKartta_modified', function(event, data) {
                    	vm.getKartat();
                    });

                    /*
                     * Liitetiedostot
                     */
                    vm.lisaaTiedosto = function() {
    			        //Avataan arkfileUploadController
    			        ModalService.arkFileUploadModal('yksikko', vm.yksikko, vm.tutkimus.id);
                    }

                    vm.files = [];
                    vm.getFiles = function() {
                        if (vm.yksikko.properties.id > 0) {
                            FileService.getArkFiles({
                                'jarjestys_suunta' : 'nouseva',
                                'rivit' : 1000,
                                'ark_yksikko_id' : vm.yksikko.properties.id,
                                'ark_tutkimus_id': vm.tutkimus.id
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
                        ModalService.arkFileModal(file, 'yksikko', vm.yksikko, vm.permissions, vm.tutkimus.id);
                    };

                    /*
                     * files were modified, fetch them again
                     */
                    $scope.$on('arkFile_modified', function(event, data) {
                    	vm.getFiles();
                    });

					hotkeys.bindTo($scope).add({
						combo : 'ä',
						description : 'vm.features',
						callback : function () {
							console.log(angular.copy(vm.map));
						}
					});
				}
		]);
