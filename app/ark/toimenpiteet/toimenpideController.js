/*
 * Toimenpiteiden UI controller
 */
angular.module('mip.toimenpide').controller(
		'ToimenpideController',
		[
			'$scope', '$rootScope', 'TabService', '$location', '$filter',
			'CONFIG', 'AlertService', 'ModalService', 'ListService', 'locale', 'permissions',
			'olData', 'hotkeys', '$timeout', 'UserService', 'NgTableParams', 'ToimenpideService', '$popover',
			'selectedModalNameId', 'ModalControllerService', 'toimenpide', 'isCreate', 'isCopy',
			'EntityBrowserService', 'KonservointiHallintaService', 'LoytoService', 'NayteService', 'FileService',
			function ($scope, $rootScope, TabService, $location, $filter,
			        CONFIG, AlertService, ModalService, ListService, locale, permissions,
			        olData, hotkeys, $timeout, UserService, NgTableParams, ToimenpideService, $popover,
			        selectedModalNameId, ModalControllerService, toimenpide, isCreate, isCopy,
			        EntityBrowserService, KonservointiHallintaService, LoytoService, NayteService, FileService) {

			    var vm = this;

			    /**
			     * Controllerin set-up.
			     */
			    vm.setUp = function() {

			        angular.extend(vm, ModalControllerService);

                    // Valitun modalin nimi ja järjestysnumero
                    vm.modalNameId = selectedModalNameId;
			        vm.setModalId();
			        vm.entity = 'toimenpide';

                    // Valittu toimenpide
                    if (toimenpide) {
                        vm.toimenpide = toimenpide;
                        vm.original = angular.copy(vm.toimenpide);

                        // Alustetaan listat
                        if(!vm.toimenpide.properties.loydot){
                        	vm.toimenpide.properties.loydot = [];
                        }

                        if(!vm.toimenpide.properties.naytteet){
                        	vm.toimenpide.properties.naytteet = [];
                        }
                    }

                    // Oikeudet
                    vm.permissions = permissions;

                    if(isCreate){
    					vm.edit = true;
                    }
                    if(isCopy){
                    	vm.copy = true;
                    }else{
                    	vm.copy = false;
                    }
                    // Löytö ja näyte-taulujen editointiin
                    vm.editLoyto = false;
                    vm.editNayte = false;
                    vm.editLoytoPaattyy = null;
                    vm.editNaytePaattyy = null;

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
				vm.peruutaMuokkaus = function () {
					vm.edit = false;
					vm.create = false;
                    vm.editLoyto = false;
                    vm.editNayte = false;
					vm.editLoytoPaattyy = null;
					vm.editNaytePaattyy = null;
					// Toimenpiteen kopioinnin peruutuksessa suljetaan dialogi
					if(vm.copy){
						vm.copy = false;
						$scope.close();
					}
					vm.toimenpide = angular.copy(vm.original);
					vm.paivitaLoydot();
					vm.paivitaNaytteet();
 				};

				/**
				 * Muokkaa toimenpidettä
				 */
				vm._editMode = function () {
					vm.original = angular.copy(vm.toimenpide);
					vm.edit = true;
				};

    			/**
    			 * Toimenpiteen löydöt
    			 */
                vm.paivitaLoydot = function (){
                    vm.tpLoydotTable = new NgTableParams({
                        page : 1,
                        count : 1000,
                        total : 1000
                    }, {
                        counts : [],
                        total: 1,
                        data : vm.toimenpide.properties.loydot
                    });
                };
                vm.paivitaLoydot();
                /*
                 * Uusi rivi löytötauluun.
                 */
	            vm.lisaaLoyto = function() {
	            	vm.disableButtons = true;
	            	var luettelointinumero = '';

	            	// Luettelointinumeron alkuosan muodostus
	            	if(vm.toimenpide.properties.loydot.length > 0){
	            		var ed_luettelointinro = vm.toimenpide.properties.loydot[vm.toimenpide.properties.loydot.length - 1].luettelointinumero;
	            		luettelointinumero = vm.kopioiLuettelointinumero(ed_luettelointinro);
	            	}

	            	var rivi = {
	            			'id': null,
	            			'luettelointinumero': luettelointinumero,
	            			'ark_loyto_id': null,
	            			'alkaa': vm.toimenpide.properties.alkaa,
	            			'paattyy': null};

	            	vm.editLoyto = true;
	            	vm.create = true;

	            	// Vain alin rivi aina kerrallaan muokattavissa
	            	vm.aktiiviLoyto = vm.toimenpide.properties.loydot.length;
	            	vm.toimenpide.properties.loydot.push(rivi);
	            	vm.paivitaLoydot();

	            };
	            /*
	             * Enterillä uuden löytörivin lisäys
	             */
	            vm.loytoEnter = function (key){
	            	if(vm.uniikkiLoyto && vm.validiLoyto){
		            	if(key.keyCode === 13){
		            		vm.lisaaLoyto();
		            	}
	            	}
	            };
	            /* Löytö / Näyte
	             * Luettelointinumerosta kopioidaan osa uuden rivin lisäyksessä alla olevan säännön mukaan:
	             *  - kaikki merkit ennen ensimmäistä kaksoispistettä
				 *  - ensimmäisen kaksoispisteen jälkeen kaksi seuraavaa merkkiä, mutta vain, jos ne ovat kirjaimia
	             */
	            vm.kopioiLuettelointinumero = function (ed_luettelointinro){
	            	var l_numero = '';
            		var k_piste = ed_luettelointinro.indexOf(':');
            		if(k_piste > -1){
            			l_numero = ed_luettelointinro.substring(0, k_piste + 1);

            			var loppu = ed_luettelointinro.substring(k_piste + 1, k_piste + 3);

            			if(loppu){
                			var numeroita = loppu.match(/\d+/g);
                			if (numeroita == null) {
                				l_numero = l_numero.concat(loppu);
                			}
            			}
            		}
            		return l_numero;
	            };
	            /*
	             * Tarkistetaan että annettu löytö on olemassa ja sitä ei ole vielä valittuna.
	             */
	            vm.uniikkiLoyto = true;
	            vm.validiLoyto = true;
	            vm.tarkistaLoyto = function (form, rivi){
	            	vm.rivi = rivi;
                	vm.uniikkiLoyto = true;
                	form.luettelointinumero.$setValidity('kaytossa', true);
                	vm.validiLoyto = true;
                	form.luettelointinumero.$setValidity('kaytossa', true);

	            	if(vm.toimenpide.properties.loydot.length > 0){
                        for (var i = 0; i < vm.toimenpide.properties.loydot.length; i++){
                            if(i != rivi){
                            	var loyto = vm.toimenpide.properties.loydot[i];
                                if(loyto.luettelointinumero == form.luettelointinumero.$modelValue){
                                	vm.uniikkiLoyto = false;
                                	form.luettelointinumero.$setValidity('kaytossa', false);
                                	break;
                                }
                            }
                        }
	            	}
	            	if(vm.uniikkiLoyto){
	            		vm.disableButtons = true;
	            		LoytoService.haeLoytoLuettelointinumerolla(form.luettelointinumero.$modelValue).then(function (loyto) {
	            			if(loyto){
	            				vm.toimenpide.properties.loydot[rivi].ark_loyto_id = loyto.properties.id;
	            				vm.disableButtons = false;
	            			}else{
                            	vm.validiLoyto = false;
                            	form.luettelointinumero.$setValidity('kaytossa', false);
	            			}
	            		});
	            	}
	            };
	            // Rivin muokkaus, vain päätöspäivä
	            vm.muokkaaLoyto = function (rivi) {
	            	vm.editLoytoPaattyy = rivi;
	            	vm.original = angular.copy(vm.toimenpide);
	            };
	            /*
	             * Peruutetaan rivin lisäys
	             */
	            vm.peruutaLoyto = function() {
	            	vm.toimenpide.properties.loydot.pop();
	            	vm.disableButtons = false;
		            vm.uniikkiLoyto = true;
		            vm.validiLoyto = true;
	            	vm.paivitaLoydot();
	            }
	            /*
	             * Yhden löytörivin poisto
	             */
	            vm.poistaLoyto = function (loyto){

                	var conf = confirm(locale.getString('common.Confirm_delete'));
                    if (conf) {
                    	// Poistetaan valittu rivi listalta
                    	var ind = vm.toimenpide.properties.loydot.indexOf(loyto);
                    	vm.toimenpide.properties.loydot.splice(ind, 1);
                		// Tallennetaan aina koko toimenpide listoineen
                		vm.save();
                    }
	            };
	            /**
	             * Näytteet
	             */
    			/**
    			 * Toimenpiteen näytteet
    			 */
                vm.paivitaNaytteet = function (){
                    vm.tpNaytteetTable = new NgTableParams({
                        page : 1,
                        count : 1000,
                        total : 1000
                    }, {
                        counts : [],
                        total: 1,
                        data : vm.toimenpide.properties.naytteet
                    });
                };
                vm.paivitaNaytteet();
                /*
                 * Uusi rivi näytetauluun.
                 */
	            vm.lisaaNayte = function() {
	            	vm.disableButtons = true;
	            	var luettelointinumero = '';

	            	// Luettelointinumeron alkuosan muodostus
	            	if(vm.toimenpide.properties.naytteet.length > 0){
	            		var ed_luettelointinro = vm.toimenpide.properties.naytteet[vm.toimenpide.properties.naytteet.length - 1].luettelointinumero;
	            		luettelointinumero = vm.kopioiLuettelointinumero(ed_luettelointinro);
	            	}

	            	var rivi = {
	            			'id': null,
	            			'luettelointinumero': luettelointinumero,
	            			'ark_nayte_id': null,
	            			'alkaa': vm.toimenpide.properties.alkaa,
	            			'paattyy': null};

	            	vm.editNayte = true;
	            	vm.create = true;
	            	// Vain alin rivi aina kerrallaan muokattavissa
	            	vm.aktiiviNayte = vm.toimenpide.properties.naytteet.length;
	            	vm.toimenpide.properties.naytteet.push(rivi);
	            	vm.paivitaNaytteet();

	            };
	            /*
	             * Enterillä uuden näyterivin lisäys
	             */
	            vm.nayteEnter = function (key){
	            	if(vm.uniikkiNayte && vm.validiNayte){
		            	if(key.keyCode === 13){
		            		vm.lisaaNayte();
		            	}
	            	}
	            };
	            /*
	             * Tarkistetaan että annettu näyte on olemassa ja sitä ei ole vielä valittuna.
	             */
	            vm.uniikkiNayte = true;
	            vm.validiNayte = true;
	            vm.tarkistaNayte = function (form, rivi){
	            	vm.rivi = rivi;
                	vm.uniikkiNayte = true;
                	form.luettelointinumero.$setValidity('kaytossa', true);
                	vm.validiNayte = true;
                	form.luettelointinumero.$setValidity('kaytossa', true);

	            	if(vm.toimenpide.properties.naytteet.length > 0){
                        for (var i = 0; i < vm.toimenpide.properties.naytteet.length; i++){
                            if(i != rivi){
                            	var nayte = vm.toimenpide.properties.naytteet[i];
                                if(nayte.luettelointinumero == form.luettelointinumero.$modelValue){
                                	vm.uniikkiNayte = false;
                                	form.luettelointinumero.$setValidity('kaytossa', false);
                                	break;
                                }
                            }
                        }
	            	}
	            	if(vm.uniikkiNayte){
	            		vm.disableButtons = true;
	            		NayteService.haeNayteLuettelointinumerolla(form.luettelointinumero.$modelValue).then(function (nayte) {
	            			if(nayte){
	            				vm.toimenpide.properties.naytteet[rivi].ark_nayte_id = nayte.properties.id;
	            				vm.disableButtons = false;
	            			}else{
                            	vm.validiNayte = false;
                            	form.luettelointinumero.$setValidity('kaytossa', false);
	            			}
	            		});
	            	}
	            };
	            vm.muokkaaNayte = function (rivi) {
	            	vm.editNaytePaattyy = rivi;
	            	vm.original = angular.copy(vm.toimenpide);
	            };
	            /*
	             * Peruutetaan rivin lisäys
	             */
	            vm.peruutaNayte = function() {
	            	vm.toimenpide.properties.naytteet.pop();
	            	vm.disableButtons = false;
		            vm.uniikkiNayte = true;
		            vm.validiNayte = true;
	            	vm.paivitaNaytteet();
	            }
	            /*
	             * Yhden näyterivin poisto
	             */
	            vm.poistaNayte = function (nayte){

                	var conf = confirm(locale.getString('common.Confirm_delete'));
                    if (conf) {
                    	// Poistetaan valittu rivi listalta
                    	var ind = vm.toimenpide.properties.naytteet.indexOf(nayte);
                    	vm.toimenpide.properties.naytteet.splice(ind, 1);
                		// Tallennetaan aina koko toimenpide listoineen
                		vm.save();
                    }
	            };
	            /**
	             * Tultu löydön toiminnoista lisäämään toimenpide
	             */
	            vm.lisaaLoytoLuotaessa = function (loyto_id) {
	            	var loyto = {
	            			'id': null,
	            			'luettelointinumero': '',
	            			'ark_loyto_id': loyto_id,
	            			'alkaa': vm.toimenpide.properties.alkaa,
	            			'paattyy': null};

	            	vm.toimenpide.properties.loydot.push(loyto);
	            };

	            /**
	             * Tultu näytteen toiminnoista lisäämään toimenpide
	             */
	            vm.lisaaNayteLuotaessa = function (nayte_id) {
	            	var nayte = {
	            			'id': null,
	            			'luettelointinumero': '',
	            			'ark_nayte_id': nayte_id,
	            			'alkaa': vm.toimenpide.properties.alkaa,
	            			'paattyy': null};

	            	vm.toimenpide.properties.naytteet.push(nayte);
	            };

	            /*
	             * Avataan uuden toimenpiteen lisääminen jolle välitetään löydöt ja näytteet valmiiksi.
	             */
	            vm.kopioiToimenpide = function (){
	            	// Resetoidaan löytöjen päivät
	            	for (var l = 0; l < vm.toimenpide.properties.loydot.length; l++) {
	            		vm.toimenpide.properties.loydot[l].alkaa = null;
	            		vm.toimenpide.properties.loydot[l].paattyy = null;
					}
	            	// Resetoidaan näytteiden päivät
	            	for (var k = 0; k < vm.toimenpide.properties.naytteet.length; k++) {
	            		vm.toimenpide.properties.naytteet[k].alkaa = null;
	            		vm.toimenpide.properties.naytteet[k].paattyy = null;
					}
	            	var kopio = {
	            			'properties' : {
	            				'loydot': vm.toimenpide.properties.loydot,
	            				'naytteet': vm.toimenpide.properties.naytteet,
	            				'toimenpide': {},
	            				'menetelma': {},
	                            'alkaa': new Date(),
	                            'tekija': vm.toimenpide.properties.tekija
	            			}
	                	};
	            	ModalService.toimenpideModal(kopio, true, true);
	            	AlertService.showInfo(locale.getString('ark.Operation_copy_notice'));
	            };

				/**
				 * Tallenna konservointitoimenpide
				 */
                vm.save = function () {
									if($scope.form.$invalid) {
										return;
								  }
                	vm.disableButtons = true;

                	// Tultu löydön toiminnoista lisäämään toimenpide
                	if(vm.toimenpide.properties.ark_loyto_id){
                		vm.lisaaLoytoLuotaessa(vm.toimenpide.properties.ark_loyto_id);
                	}
                	// Tultu näytteen toiminnoista lisäämään toimenpide
                	if(vm.toimenpide.properties.ark_nayte_id){
                		vm.lisaaNayteLuotaessa(vm.toimenpide.properties.ark_nayte_id);
                	}

                    ToimenpideService.luoTallennaToimenpide(vm.toimenpide).then(function (toimenpide) {

                        // "update" the original after successful save
                        vm.original = angular.copy(toimenpide);

                        // Päivitetty toimenpide
                        vm.toimenpide = toimenpide;

                        AlertService.showInfo(locale.getString('common.Save_ok'), "");

                        vm.disableButtons = false;

                    	// Katselutila päälle
                    	vm.edit = false;
                    	vm.create = false;
                    	vm.copy = false;
                        vm.editLoyto = false;
                        vm.editNayte = false;
                        vm.editLoytoPaattyy = null;
                        vm.editNaytePaattyy = null;
                    	// Taulukoiden päivitys
                    	vm.paivitaLoydot();
                    	vm.paivitaNaytteet();

                    }, function error () {
                        AlertService.showError(locale.getString('common.Error'), locale.getString('common.Save_failed'));
                        vm.disableButtons = false;
                    });
                };
                /**
                 * Toimenpiteen soft delete
                 */
                vm.poistaToimenpide = function (){
                	var conf = confirm(locale.getString('common.Confirm_delete'));
                	if (conf) {
                        ToimenpideService.poistaToimenpide(vm.toimenpide).then(function() {
                            vm.close();
                            $scope.$destroy();

                            AlertService.showInfo(locale.getString('ark.Operation'), locale.getString('common.Deleted'));

                        }, function error(data) {

                           AlertService.showError(locale.getString('common.Delete_failed'), AlertService.message(data));

                        });
                	}
                };
                /*
                 * Toimenpidettä vaihdettaessa haetaan sille kuuluvat menetelmät.
                 */
                vm.vaihdaToimenpide = function (tp){

                	var filterParameters = {
							'id': tp.toimenpide.id
						};

                    vm.toimenpiteetPromise = KonservointiHallintaService.haeToimenpiteet(filterParameters);
                    vm.toimenpiteetPromise.then(function(data) {

                    	// Tyhjä valinta
                    	vm.menetelmat = [{'id': null, 'nimi': 'Valitse'}];

                        if (data.features) {
                            for(i=0; i < data.features[0].properties.menetelmat.length; i++){
                            	// Vain aktiiviset mukaan
                            	if(data.features[0].properties.menetelmat[i].aktiivinen){
                            		vm.menetelmat.push(data.features[0].properties.menetelmat[i]);
                            	}
                            }
                        }
                        $defer.resolve(data.features);
                    }, function(data) {
                        locale.ready('common').then(function() {
                            AlertService.showWarning(locale.getString('common.Error'), AlertService.message(data));
                        });
                        $defer.resolve([]);
                    });
                };
                // Valitun toimenpiteen mukaisten materiaalien haku
                if(vm.toimenpide.properties.toimenpide.id){
                	var tp = {
                			'toimenpide': vm.toimenpide.properties.toimenpide
                	}
                	vm.vaihdaToimenpide(tp);
                }
                /*
                 * Menetelmän valinta päivittää kuvauskenttään valitun menetelmän kuvauksen.
                 */
                vm.vaihdaMenetelmanKuvaus = function (menetelma){
                	if(menetelma){
                		vm.toimenpide.properties.menetelman_kuvaus = menetelma.kuvaus;
                	}
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
                /*
                 * Käyttäjien haku
                 */
                vm.kayttajat = [];
                vm.getUsers = function() {
                    UserService.getUsers({
                        'rivit' : 10000000,
                        'aktiivinen' : 'true'
                    }).then(function success(data) {
                    	vm.kayttajat = [];
                        // Otetaan vain tarvittavat tiedot niin toimii ui selectissä
                        for (var i = 0; i < data.features.length; i++){
                            var user = data.features[i].properties;
                            vm.kayttajat.push(user);
                        }
                    }, function error(data) {
                        locale.ready('error').then(function() {
                            AlertService.showError(locale.getString("error.Getting_users_failed"), AlertService.message(data));
                        });
                    });
                };

                vm.getUsers();

				hotkeys.bindTo($scope).add({
					combo : 'ä',
					description : 'vm.features',
					callback : function () {
						console.log(angular.copy(vm.toimenpide.properties));
					}
				});

				/*
                 * Liitetiedostot
                 */
                vm.lisaaTiedosto = function() {
			        //Avataan arkfileUploadController
			        ModalService.arkFileUploadModal('toimenpide', vm.toimenpide/*, vm.tutkimusId*/);
                }

                vm.files = [];
                vm.getFiles = function() {
                    if (vm.toimenpide.properties.id > 0) {
                        FileService.getArkFiles({
                            'jarjestys_suunta' : 'nouseva',
                            'rivit' : 1000,
                            'ark_kons_toimenpiteet_id' : vm.toimenpide.properties.id
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
                    ModalService.arkFileModal(file, 'toimenpide', vm.toimenpide, vm.permissions/*, vm.tutkimusId*/);
                };

                /*
                 * files were modified, fetch them again
                 */
                $scope.$on('arkFile_modified', function(event, data) {
                	vm.getFiles();
                });
		}
]);
