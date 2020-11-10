/**
 * Tutkimusalue controller
 */
angular.module('mip.tutkimus').controller(
        'TutkimusalueController',
        [
                '$scope', 'CONFIG', 'ModalService', 'AlertService', 'MapService','$timeout', '$rootScope', 'olData',
                'hotkeys', 'ListService', 'FileService', 'locale', 'MuutoshistoriaService', 'UserService', 'permissions', '$filter',
                'SessionService', 'selectedModalNameId', 'TutkimusalueService', 'existing', 'tutkimusalue', 'ModalControllerService',
                '$q', 'TutkimusalueService', 'parentModalId', 'tutkimus', 'NgTableParams', 'Auth', 'YksikkoService', 'LoytoService',
                'EntityBrowserService', 'NayteService',
                function($scope,  CONFIG, ModalService, AlertService, MapService, $timeout, $rootScope, olData,
                        hotkeys, ListService, FileService, locale, MuutoshistoriaService, UserService, permissions, $filter,
                        SessionService, selectedModalNameId, KohdeService, existing, tutkimusalue, ModalControllerService,
                        $q, TutkimusalueService, parentModalId, tutkimus, NgTableParams, Auth, YksikkoService, LoytoService,
                        EntityBrowserService, NayteService) {

                	var vm = this;

                    /**
                     * Controllerin set-up. Suoritetaan ainoastaan kerran.
                     * Pidetään huoli siitä, että kun näkymä on ladattu, niin kartta on valmiina ja käytettävissä.
                     *
                     */
                    vm.setUp = function() {
                        angular.extend(vm, ModalControllerService);
                        vm.entity = 'tutkimusalue';
                        vm.setModalId();

                        vm.setMapId('tutkimusalue');
                        vm.setMapPopupId();
                        // Valitun modalin nimi ja järjestysnumero
                        vm.modalNameId = selectedModalNameId;

                        vm.center = {
                                lat : null,
                                lon : null,
                                autodiscover : false,
                                bounds: []
                            };

                        // Tutkimus välitetty
                        if(tutkimus){
                        	vm.tutkimus = tutkimus;
                        }


                        // Tutkimusalue välitetty
                        if (tutkimusalue) {
                            vm.tutkimusalue = tutkimusalue;

                        } else {
                            // Uusi tutkimusalue, alustetaan default arvot
                            vm.tutkimusalue = {
                                'properties' : {
                                    'ark_tutkimus_id': tutkimus.properties.id,
                                    'yksikot': []
                                },
                                geometry : {},
                                type: 'Feature'
                            };
                        }

                        // Store the original kohde for possible
                        // cancel operation
                        vm.original = angular.copy(vm.tutkimusalue);

                        // existing = true when viewing an existing property
                        // false when creating a new one
                        if (!existing) {
                            vm.edit = true;
                            vm.create = true;
                        }

                        // Käyttöoikeudet talteen
                        vm.permissions = permissions;

                        // Uuden yksikön lisäys
                        if (permissions.luonti) {
                            vm.showCreateNewButton = true;
                        }

                        // all possible layers; shown in dropdown button
                        vm.objectLayers = [
                            {
                                "value" : "Tutkimusalueet",
                                "label" : locale.getString('ark.Research_areas')
                            }
                        ];
                        /*
                         * Array for holding all of the visible layers we have for the map
                         */
                        vm.mapLayers = [];
                        vm.selectedMapLayers = [];

                        // layers selected for showing; note, vm.mapLayers holds
                        // the "real" layers that are
                        // drawn on the map; these are object (feature) layers
                        vm.selectedLayers = [];

                        vm.extent = null;

                        /**
                         * Extendataan kartta (MapService.map() palauttama map) viewmodeliin
                         */
                        angular.extend(vm, MapService.map(vm.mapLayers));

                        /*
                         * Ladataan kartta
                         */
                        olData.getMap(vm.mapId).then(function (map) {
                            vm.map = map;

                            vm.getAvailableMapLayers(true);

                            vm.selectDefaultObjectLayers();


                            /**
                             * Keskitetään kartta
                             */
                            vm.centerToExtent([vm.tutkimusalue]);

                        });

                        $scope.focusInput = false;

                    };
                    vm.setUp();

                    /**
                     * Keskitetään kartta. Pitää olla timeoutin sisällä, muuten ei vaikutusta
                     */
                    vm.centerToExtent = function(data) {
                        $timeout(function() {
                            var taExtent = MapService.calculateExtentOfFeatures(data);

                            var oldExtent = angular.copy(vm.extent);
                            vm.extent = MapService.getBiggestExtent(vm.extent, taExtent);

                            if(oldExtent !== vm.extent) {
                                MapService.centerToExtent(vm.map, vm.extent);
                            }
                        });
                    }
                    /**
                     * ModalHeader kutsuu scopesta closea
                     */
                    $scope.close = function() {
                        vm.close();
                        $scope.$destroy();
                    };

                    /**
                     * Cancel edit mode additional steps
                     */
                    vm._cancelEdit = function () {
                    	//Jos ollaan luontimoodissa, ei tutkimusalueita koiteta päivittää
                    	if(!vm.create) {
                    		vm.updateLayerData('Tutkimusalueet');
                    	}
                        vm.edit = false;
                    };

                    /**
                     * Readonly / edit mode - additional steps
                     */
                    vm._editMode = function () {
                        //vm.originalFeatures = angular.copy(vm.features);
                    	$scope.focusInput = true;
                    };

                    /**
                     * Save changes
                     */
                    vm.save = function () {
                        vm.disableButtonsFunc();

                        TutkimusalueService.saveTutkimusalue(vm.tutkimusalue).then(function (id) {
                            if (vm.create) {
                                vm.tutkimusalue.properties["id"] = id;
                                vm.create = false;
                            }
                            vm.edit = false

                            // "update" the original after successful save
                            vm.original = angular.copy(vm.tutkimusalue);

                            $rootScope.$broadcast('Tutkimusalue_lisatty', {
                                'tutkimusalue' : vm.tutkimusalue,
                                'modalId' : parentModalId
                            });

                            vm.disableButtonsFunc();
                            AlertService.showInfo(locale.getString('common.Save_ok'), "");
                        }, function error () {
                            AlertService.showError(locale.getString('common.Error'), locale.getString('common.Save_failed'));
                            vm.disableButtonsFunc();
                        });
                    };

                    /*
                     * Tutkimusalueen soft delete. Ei voi poistaa jos löytyy yksiköitä.
                     */
                    vm.deleteTutkimusalue = function(modalNameId) {
                        if(vm.yksikotTable.data.length > 0 ||
                        		vm.loydotTable.data.length > 0 ||
                        		vm.naytteetTable.data.length > 0){
                        	AlertService.showError(locale.getString('area.Delete_failed'), locale.getString('ark.Research_area_delete_error'));
                        }else{
                            var conf = confirm(locale.getString('common.Confirm_delete2', {'item': vm.tutkimusalue.properties.nimi}));
                            if (conf) {
                                TutkimusalueService.deleteTutkimusalue(vm.tutkimusalue).then(function() {
                                    vm.close();
                                    $scope.$destroy();
                                    locale.ready('common').then(function() {
                                        AlertService.showInfo(locale.getString('ark.Research_area'), locale.getString('common.Deleted'));
                                    });
                                    $rootScope.$broadcast('Tutkimusalue_poistettu', {
                                        'tutkimusalue' : vm.tutkimusalue,
                                        'modalId' : parentModalId
                                    });
                                }, function error(data) {
                                    locale.ready('area').then(function() {
                                        AlertService.showError(locale.getString('area.Delete_failed'), AlertService.message(data));
                                    });
                                });
                            }
                        }
                    };

					/*
					 *  Tutkimusalueen nimen oltava uniikki
					 */
					vm.uniikkiNimi = true;
					vm.tarkistaUniikkiNimi = function (form) {
						if(vm.tutkimusalue.properties.nimi){
							var available = TutkimusalueService.tarkistaTutkimusalueenNimi(vm.tutkimusalue.properties.nimi, vm.tutkimusalue.properties.ark_tutkimus_id).then(function success (data) {
								if (data) {
									form.nimi.$setValidity('kaytossa', true);
									vm.uniikkiNimi = true;
								} else {
									form.nimi.$setValidity('kaytossa', false);
									vm.uniikkiNimi = false;
								}
							});
							return available;
						}
					};

                    /**
                     * Yksiköiden taulukko
                     */
                    vm.yksikotTable = new NgTableParams({
                        page : 1,
                        count : 25,
                        total : 25
                    }, {
                    	tutkimusalue_id : [
                    		vm.tutkimusalue.properties.id
                            ],
                        getData : function($defer, params) {
                        	//(vm.tutkimus on asetettu aina), haetaan ainoastaan jos tutkimuksen laji on muuta kuin irtolöytö
                        	if(vm.tutkimusalue.properties && vm.tutkimusalue.properties.id && !vm.irtoTaiTarkastus()) {
	                            Auth.checkPermissions("arkeologia", "ark_tutkimusalue", vm.tutkimusalue.properties.id).then(function(permissions) {

	                                if (permissions.katselu) {
	                                    filterParameters = ListService.parseParameters(params);

	                                    // Lisätään tutkimusalueen id hakuun
	                                    filterParameters['ark_tutkimusalue_id'] = vm.tutkimusalue.properties.id;
	                                    filterParameters['ark_tutkimus_id'] = vm.tutkimusalue.properties.ark_tutkimus_id;

	                                    if(vm.promise !== undefined) {
	                                        vm.cancelRequest();
	                                    }

	                                    vm.yksikotPromise = YksikkoService.haeYksikot(filterParameters);
	                                    vm.yksikotPromise.then(function(data) {

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
	                                } else {
	                                    locale.ready('common').then(function() {
	                                        locale.ready('estate').then(function() {
	                                            AlertService.showError(locale.getString('common.Error'), locale.getString('error.No_view_permission'));
	                                        });
	                                    });
	                                }
	                            }, function error(data) {
	                                locale.ready('common').then(function() {
	                                    AlertService.showError(locale.getString('common.Error'), AlertService.message(data));
	                                });
	                            });
                        	}
                        }
                    });

                    /*
                     * Muodostetaan ja tallentaan uusi yksikkötunnus
                     */
                    vm.yksikonLisays = false;
                    vm.lisaaYksikkotunnus = function() {

                    	// Seuraava vapaa yksikon_numero haetaan per tutkimus
                    	var yksikon_nro = 1;
                    	YksikkoService.luoYksikkoNumero(vm.tutkimus.properties.id).then(function success (data){
                    		if (data) {
                    			if(data.properties != null){
                    				yksikon_nro = data.properties;
                    			}

                                // Uudelle yksikölle laitetaan tutkimusalueen id viittaus
                            	vm.uusiYksikko = {
                            			'properties' : {
                                            'ark_tutkimusalue_id': vm.tutkimusalue.properties.id,
                                            'ark_tutkimus_id' : tutkimus.properties.id,
                            				'yksikkotunnus': null,
                            				'yksikkotyyppi': null,
                                			'yksikon_numero': yksikon_nro,
                                			'yksikkotyypit': [],
                                			'tyovaiheet': []
                            			}
                            	};
                                //Asetetaan focus valintalistaan
                            	$scope.focusInput = true;
                            	AlertService.showInfo(locale.getString('unit.Next_available_unit_number_created'), "");

                    		}
                    	});

                    	vm.yksikonLisays = true;
                    }

					/*
					 * Tunnuksen oltava uniikki tutkimuksen sisällä
					 */
					vm.uniikkiNumero = true;
					vm.tarkistaNumero = function (form) {
						if(vm.uusiYksikko.properties.yksikon_numero){
							var available = YksikkoService.tarkistaYksikonNumero(vm.uusiYksikko.properties.yksikon_numero, vm.tutkimus.properties.id, vm.tutkimusalue.properties.id).then(function success (data) {
								if (data) {
									form.yksikon_numero.$setValidity('kaytossa', true);
									vm.uniikkiNumero = true;
									vm.disableButtons = false;
								} else {
									form.yksikon_numero.$setValidity('kaytossa', false);
									vm.uniikkiNumero = false;
								}
							});
							return available;
						}
					};

                    /*
                     * Tallennetaan yksikkö ja avataan kaivauksen aikaiset muistiinpanot
                     */
                    vm.tallennaYksikkotunnus = function(){

                    	var tunnus = '';

                    	if(vm.uusiYksikko.properties.yksikkotyyppi.nimi_fi == 'Maayksikkö'){
                    		tunnus = 'M';
                    	}else if(vm.uusiYksikko.properties.yksikkotyyppi.nimi_fi == 'Rakenneyksikkö'){
                    		tunnus = 'R';
                    	}else{
                    		tunnus = 'L';
                    	}

                    	// Muodostetaan tunnus (valittu tyyppi-kirjain + annettu numero)
                        vm.uusiYksikko.properties.yksikkotunnus = tunnus + vm.uusiYksikko.properties.yksikon_numero;

                        YksikkoService.luoTallennaYksikko(vm.uusiYksikko).then(function (yksikko) {
                        	vm.yksikonLisays = false;
                        	// Taulukon päivitys
                        	vm.yksikotTable.reload();

                            AlertService.showInfo(locale.getString('common.Save_ok'), "");

                            // Aktivoidaan painikkeet
                            vm.disableButtons = false;

                            // Avataan tallennettu yksikkö kaivaus muistiinpanojen syöttöön
                            ModalService.lisaaYksikkoModal(yksikko, vm.tutkimusalue, vm.permissions);

                        }, function error (data) {
                            AlertService.showError(locale.getString('common.Save_failed'), AlertService.message(data));
							vm.uniikkiNumero = false;
                        });
                    };

                    // Peruuta yksikkö ikkunasta
                    vm.peruutaYksikonLisays = function(form){
                    	vm.uusiYksikko = null;
                    	vm.yksikonLisays = false;
                    	$scope.focusInput = false;
                    	vm.disableButtons = false;
						form.yksikon_numero.$setValidity('kaytossa', true);
						vm.uniikkiNumero = true;
                    };

                    /*
                     * Yksikön valinta listalta. Edit, view ja muistiinpanojen syöttö päätellään yksikkoControllerissa
                     */
                    vm.avaaYksikko = function(valittu_yksikko){
                    	YksikkoService.haeYksikko(valittu_yksikko.properties.id).then(function(yksikko) {

                    		if(yksikko.properties.kaivaus_valmis){
                                // Avataan tallennettu yksikkö katselutilaan
                    			ModalService.yksikkoModal(yksikko, vm.tutkimusalue, vm.permissions);
                    		}else{
                                // Avataan kaivaus muistiinpanojen syöttöön
                    			ModalService.lisaaYksikkoModal(yksikko, vm.tutkimusalue, vm.permissions);
                    		}

    					}, function error (data) {
                            AlertService.showError(locale.getString('common.Error'), AlertService.message(data));

                        });
                    };

                    // Lisää löytö taulukosta valitulle yksikölle. Tila on aina 1 = Luetteloitu.
                    vm.lisaaLoyto = function(yksikko){
                        // Uudelle löydölle laitetaan yksikön id viittaus
                    	vm.uusiLoyto = {
                    			'properties' : {
                    				'ark_tutkimusalue_yksikko_id': yksikko.properties.id,
                                    'yksikkotunnus': yksikko.properties.yksikkotunnus,
                                    'ark_tutkimus_id': vm.tutkimusalue.properties.ark_tutkimus_id,
                    				'loydon_tila_id': 1,
                    				'ark_materiaalikoodi_id': null,
                    				'ark_loyto_tyyppi_id': null,
                    				'luettelointinumero': null,
                    				'materiaalikoodi': null
                    			}
                    	};

                    	// Valittu yksikkö talteen
                    	vm.yksikko = yksikko;
                    	vm.loydonLisays = true;
                        //Asetetaan focus valintalistaan
                    	$scope.focusInput = true;
                    	vm.disableButtons = true;
                    };

                    /*
                     * Irtolöydön lisäys painikkeen klikki
                     */
                    vm.lisaaIrtoLoyto = function (){
                		// Irtolöytö
                    	vm.uusiLoyto = {
                    			'properties' : {
                                    'yksikkotunnus': null,
                                    'ark_tutkimus_id': vm.tutkimusalue.properties.ark_tutkimus_id,
                    				'loydon_tila_id': 1,
                    				'ark_loyto_tyyppi_id': null,
                    				'luettelointinumero': null,
                    				'materiaalikoodi': null,
                    				'ark_tutkimusalue_id': vm.tutkimusalue.properties.id //<<-- Kertoo, että on irtolöytö tai tarkastus
                    			}
                    	};
                    	vm.loydonLisays = true;
                        //Asetetaan focus valintalistaan
                    	$scope.focusInput = true;
                    	vm.disableButtons = true;
                    };

                    // Peruuta löytö ikkunasta
                    vm.peruutaLoydonLisays = function(){
                    	vm.uusiLoyto = null;
                    	vm.loydonLisays = false;
                    	$scope.focusInput = false;
                    	vm.disableButtons = false;
                    };

                    /*
                     * Tallennetaan löydön tunnus ja avataan löydön tietojen lisäys
                     */
                    vm.tallennaLoytotunnus = function(){

                    	vm.loydonLisays = false;

                    	/*
                    	 * Mikäli tutkimuksen löytöjen kokoelmatunnus on TMK, luettelointinumero muodostetaan kolmesta kentästä:
                    	 * 1.kokoelmatunnus + näytteiden päänumero (tutkimukselta)
						 * 2.näytekoodi + yksikkötunnus ilman yksikkötyypin kirjainta
						 * 3.juokseva alanumero (per näytekoodi, ilman etunollia)
						 * Paitsi irtolöydöllä, joilla materiaalikoodia ei ole:
						 *   kokoelmatunnus+päänumero : juokseva alanumero (per tutkimus)
						 *
                    	 *
                    	 * Mikäli löytöjen kokoelmatunnus on KM tai TYA, luettelointinumero muodostetaan seuraavasti:
                    	 * kokoelmatunnus + löytöjen päänumero (tutkimukselta)
                    	 * juokseva alanumero (ilman etunollia)
                    	 */
                    	var km = 1; // Kansallismuseo
                    	var tmk = 2; // Turun museokeskus
                    	var tya = 4 // Turun yliopiston arkisto
                    	var luettelointinumero;

                    	if(!tutkimus.properties.loyto_paanumero){
                    		AlertService.showError(locale.getString('common.Error'), locale.getString('ark.Discovery_main_number_missing'));

                            // Aktivoidaan painikkeet
                            vm.disableButtons = false;
                    		return;
                    	};
                    	//Irtolöytö tai tarkastus (esim. TMK555:1)
                    	if(vm.irtoTaiTarkastus()) {

                    		var ltn_alku = 'TMK'.concat(tutkimus.properties.loyto_paanumero).concat(':');
                			luettelointinumero = ltn_alku;

                    	} else {
                    		if(tutkimus.properties.loyto_kokoelmalaji && tutkimus.properties.loyto_paanumero){
                        		var loydonKokoelmalaji = tutkimus.properties.loyto_kokoelmalaji;
                        		if(loydonKokoelmalaji.id == tmk){
                        			var ltn_alku = 'TMK'.concat(tutkimus.properties.loyto_paanumero).concat(':');
                        			var ltn_loppu = vm.uusiLoyto.properties.materiaalikoodi.koodi.concat(vm.yksikko.properties.yksikon_numero);
                        			luettelointinumero = ltn_alku.concat(ltn_loppu).concat(':');
                        		}
                        		else if(loydonKokoelmalaji.id == km){
                        			luettelointinumero = 'KM'.concat(tutkimus.properties.loyto_paanumero).concat(':');
                        		}
                        		else if(loydonKokoelmalaji.id == tya){
                        			luettelointinumero = 'TYA'.concat(tutkimus.properties.loyto_paanumero).concat(':');
                        		}else{
                        			AlertService.showError(locale.getString('common.Error'), locale.getString('ark.Unknown_collection_type'));

                                    // Aktivoidaan painikkeet
                                    vm.disableButtons = false;
                        			return;
                        		}
                        	}
                    	}

                    	// Luettelointinumeroon lisätään juokseva alanumero backendissä
                    	vm.uusiLoyto.properties.luettelointinumero = luettelointinumero;

                    	// Luodaan löytö
                        LoytoService.luoTallennaLoyto(vm.uusiLoyto).then(function (loyto) {

                            AlertService.showInfo(locale.getString('common.Save_ok'), locale.getString('ark.New_discovery_created'));

                            EntityBrowserService.setQuery('loyto', loyto.properties.id, {'loyto_id': loyto.properties.id}, 1);

                            // Aktivoidaan painikkeet
                            vm.disableButtons = false;
                            // Avataan löytö tietojen syöttöön
                            ModalService.loytoModal(loyto, true);

                        }, function error () {
                            AlertService.showError(locale.getString('common.Error'), locale.getString('common.Save_failed'));
                            vm.disableButtons = false;
                        });
                    };

                    /*
                     *  Lisää näyte taulukosta valitulle yksikölle. Tila on aina 4 = Luetteloitu.
                     */
                    vm.lisaaNayte = function(yksikko){

                    	var naytteen_tila = {
                    		'id': 4,
                    		'nimi_fi': 'Luetteloitu'
                    	};

                    	if(yksikko === undefined) {
                    		//IRTOLÖYTÖTUTKIMUS tai tarkastus
                    		// Uudelle näytteelle laitetaan yksikön id viittaus ja muut oletusarvot
                        	vm.uusiNayte = {
                        			'properties' : {
                        				'ark_tutkimusalue_yksikko_id': null,
                                        'yksikkotunnus': null,
                                        'ark_tutkimus_id': vm.tutkimusalue.properties.ark_tutkimus_id,
                        				'ark_nayte_tila_id': 4,
                        				'tila': naytteen_tila,
                        				'naytetta_jaljella': true,
                        				'tutkimus': vm.tutkimus.properties,
                        				'yksikko': null,
                        				'ark_naytekoodi_id': null,
                        				'luettelointinumero': null,
                        				'naytekoodi': null,
                        				'ark_tutkimusalue_id': vm.tutkimusalue.properties.id
                        			}
                        	};
                    	} else {
	                        // Uudelle näytteelle laitetaan yksikön id viittaus ja muut oletusarvot
	                    	vm.uusiNayte = {
	                    			'properties' : {
	                    				'ark_tutkimusalue_yksikko_id': yksikko.properties.id,
	                                    'yksikkotunnus': yksikko.properties.yksikkotunnus,
	                                    'ark_tutkimus_id': vm.tutkimusalue.properties.ark_tutkimus_id,
	                    				'ark_nayte_tila_id': 4,
	                    				'tila': naytteen_tila,
	                    				'naytetta_jaljella': true,
	                    				'tutkimus': vm.tutkimus.properties,
	                    				'yksikko': yksikko.properties,
	                    				'ark_naytekoodi_id': null,
	                    				'luettelointinumero': null,
	                    				'naytekoodi': null
	                    			}
	                    	};
                    	}
                        // Avataan näyte tietojen syöttöön
                        ModalService.nayteModal(vm.uusiNayte, true);
                    };

                    // Peruuta näyteen lisäys ikkunasta
                    vm.peruutaNaytteenLisays = function(){
                    	vm.uusiNayte = null;
                    	vm.naytteenLisays = false;
                    	$scope.focusInput = false;
                    	vm.disableButtons = false;
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
        			 * Päivitetään yksikkö taulukko, muiden näyttöjen broadcastin mukaan
        			 */
                    $scope.$on('Paivita_yksikko_table', function(event, data) {
                    	if(data['ark_tutkimusalue_id'] === vm.tutkimusalue.properties.id ||
                    			data['ark_vanha_tutkimusalue_id'] === vm.tutkimusalue.properties.id) {
                    		vm.yksikotTable.reload();
                    	}
                    });

                    /*
                     * Kaivauksen tilan valintalistan arvot
                     */
                    locale.ready('unit').then(function() {
                        vm.kyllaEi = [
                            {
                                value : '',
                                label : locale.getString('unit.Digging_ready_all')
                            }, {
                                value : 'false',
                                label : locale.getString('unit.Digging_ready')  + ': ' +  locale.getString('common.No')
                            }, {
                                value : 'true',
                                label : locale.getString('unit.Digging_ready')  + ': ' +  locale.getString('common.Yes')
                            }
                            ];
                        vm.yksikotTable.filter().properties = {};
                        vm.yksikotTable.filter().properties['kaivaus_valmis'] = ''; // Oletuksena kaikki
                    });

                    /**
                     * Löytöjen taulukko
                     */
                    vm.loydotTable = new NgTableParams({
                        page : 1,
                        count : 25,
                        total : 25
                    }, {
                    	ark_irtoloytotutkimusalue_id : [
                    		vm.tutkimusalue.properties.id
                            ],
                        getData : function($defer, params) {
                        	//(vm.tutkimus on asetettu aina), haetaan ainoastaan jos tutkimuksen laji on irtolöytö tai tarkastus
                        	if(vm.tutkimusalue.properties && vm.tutkimusalue.properties.id && vm.irtoTaiTarkastus()) {
	                            Auth.checkPermissions("arkeologia", "ark_tutkimusalue", vm.tutkimusalue.properties.id).then(function(permissions) {

	                                if (permissions.katselu) {
	                                    filterParameters = ListService.parseParameters(params);

	                                    // Lisätään tutkimusalueen id hakuun
	                                    filterParameters['ark_irtoloytotutkimusalue_id'] = vm.tutkimusalue.properties.id;
	                                    //filterParameters['ark_tutkimus_id'] = vm.tutkimusalue.properties.ark_tutkimus_id;

	                                    if(vm.promise !== undefined) {
	                                        vm.cancelRequest();
	                                    }

	                                    vm.lPromise = LoytoService.haeLoydot(filterParameters);
	                                    vm.lPromise.then(function(data) {

	                                        if (data.count) {
	                                            vm.loytoja = data.count;
	                                        } else {
	                                            vm.loytoja = 0;
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
	                                } else {
	                                    locale.ready('common').then(function() {
	                                        locale.ready('estate').then(function() {
	                                            AlertService.showError(locale.getString('common.Error'), locale.getString('error.No_view_permission'));
	                                        });
	                                    });
	                                }
	                            }, function error(data) {
	                                locale.ready('common').then(function() {
	                                    AlertService.showError(locale.getString('common.Error'), AlertService.message(data));
	                                });
	                            });
                        	}
                        }
                    });

        			/*
        			 * Päivitetään löytöjen taulukko, jos tiedot päivittyneet
        			 */
                    $scope.$on('Update_data', function(event, data) {
                        if (data.type == 'loyto') {
                            vm.loydotTable.reload();
                        }
                    });

                    //Haetaan löytö ja avataan se
                    vm.avaaLoyto = function(loyto) {
                    	LoytoService.haeLoyto(loyto.properties.id).then(function s(loyto) {
                    		EntityBrowserService.setQuery('loyto', loyto.properties.id, {'ark_irtoloytotutkimusalue_id': vm.tutkimusalue.properties.id}, vm.loydotTable.total());
                            // Avataan löytö tietojen syöttöön
                            ModalService.loytoModal(loyto, false);
                    	}, function e(data) {
                    		AlertService.showError(locale.getString('common.Error'), data.message);
                    	});
                    };

                    /**
                     * Naytteiden taulukko
                     */
                    vm.naytteetTable = new NgTableParams({
                        page : 1,
                        count : 25,
                        total : 25
                    }, {
                    	ark_irtoloytotutkimusalue_id : [
                    		vm.tutkimusalue.properties.id
                            ],
                        getData : function($defer, params) {

                        	if(vm.tutkimusalue.properties && vm.tutkimusalue.properties.id && vm.irtoTaiTarkastus()) {
	                            Auth.checkPermissions("arkeologia", "ark_tutkimusalue", vm.tutkimusalue.properties.id).then(function(permissions) {

	                                if (permissions.katselu) {
	                                    filterParameters = ListService.parseParameters(params);

	                                    // Lisätään tutkimusalueen id hakuun
	                                    filterParameters['ark_irtoloytotutkimusalue_id'] = vm.tutkimusalue.properties.id;
	                                    //filterParameters['ark_tutkimus_id'] = vm.tutkimusalue.properties.ark_tutkimus_id;

	                                    if(vm.promise !== undefined) {
	                                        vm.cancelRequest();
	                                    }

	                                    vm.nPromise = NayteService.haeNaytteet(filterParameters);
	                                    vm.nPromise.then(function(data) {

	                                        if (data.count) {
	                                            vm.naytteita = data.count;
	                                        } else {
	                                            vm.naytteita = 0;
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
	                                } else {
	                                    locale.ready('common').then(function() {
	                                        locale.ready('estate').then(function() {
	                                            AlertService.showError(locale.getString('common.Error'), locale.getString('error.No_view_permission'));
	                                        });
	                                    });
	                                }
	                            }, function error(data) {
	                                locale.ready('common').then(function() {
	                                    AlertService.showError(locale.getString('common.Error'), AlertService.message(data));
	                                });
	                            });
                        	}
                        }
                    });

        			/*
        			 * Päivitetään näytteiden taulukko, jos tiedot päivittyneet
        			 */
                    $scope.$on('Update_data', function(event, data) {
                        if (data.type == 'nayte') {
                            vm.naytteetTable.reload();
                        }
                    });

                    //Haetaan nayte ja avataan se
                    vm.avaaNayte = function(nayte) {
                    	NayteService.haeNayte(nayte.properties.id).then(function s(nayte) {
                    		EntityBrowserService.setQuery('nayte', nayte.properties.id, {'ark_irtoloytotutkimusalue_id': vm.tutkimusalue.properties.id}, vm.naytteetTable.total());
                            // Avataan löytö tietojen syöttöön
                            ModalService.nayteModal(nayte, false);
                    	}, function e(data) {
                    		AlertService.showError(locale.getString('common.Error'), data.message);
                    	});
                    };

                    /*
                     * Irtolöytö ja tarkastustutkimukselle lisätään löydöt suoraan alueelle.
                     */
                    vm.irtoTaiTarkastus = function(){
                    	if(vm.tutkimus.properties.tutkimuslaji.id == 6 || vm.tutkimus.properties.tutkimuslaji.id == 11){
                    		return true;
                    	}else if(tutkimus.properties.tutkimuslaji.id == 6 || tutkimus.properties.tutkimuslaji.id == 11){
                    		return true;
                    	}else{
                    		return false;
                    	}
                    };

                    /*
                     * Tarkastustutkimuksella on muistiinpanot kenttä, joka näytetään vain tutkijalle ja pääkäyttäjälle.
                     */
                    vm.tarkastusTutkija = function(){
                    	if(vm.tutkimus.properties.tutkimuslaji.id == 11){
                    		var kayttaja = UserService.getProperties();
                        	if(kayttaja.user.rooli === "pääkäyttäjä" || kayttaja.user.rooli === "tutkija"){
                        		return true;
                        	}else{
                        		return false;
                        	}

                    	}else{
                    		return false;
                    	}
                    };

                    /*
                     * Avaa kuva
                     */
                    vm.openImage = function(image, kuvat) {
                        ModalService.arkImageModal(image, 'tutkimusalue', vm.tutkimusalue, vm.permissions, kuvat, vm.tutkimus.properties.id);
                    };

                    /*
                     * Lisää luetteloitu kuva. Toistaiseksi vain jos kyseessä on tarkastustutkimus.
                     */
                    vm.addImage = function(luetteloi) {
                   		ModalService.arkImageUploadModal('tutkimusalue', vm.tutkimusalue, luetteloi, vm.tutkimus.properties.id);
                    };

                    vm.updateLocationFromFile = function() {
                    	ModalService.lisaaTutkimusalueTiedosto(vm.tutkimus, vm.modalId, vm.tutkimusalue);
                    }

                    //Tutkimusalueen sijainti on muokattu/lisätty.
					$scope.$on('Tutkimusalue_lisatty', function (event, data) {
				    	if(data.tutkimusalue.geometry.coordinates) {
				    		vm.tutkimusalue.geometry = data.tutkimusalue.geometry;
				    	}
				    	vm.updateLayerData('Tutkimusalueet');

					});

                    /*
                     * OPENLAYERS MAP
                     */
                     /*
                     * -------------------------MAP SWITCHING------------------------------------
                     */

                    /**
                     * Controller-spesifinen funktio, jossa asetetaan oletuksena näkyvät objektitasot.
                     *
                     */
                    vm.selectDefaultObjectLayers = function() {
                        // Add default layer
                        this.selectedLayers.push('Tutkimusalueet');
                        this.selectedLayers = MapService.selectLayer(vm.mapLayers, vm.selectedLayers, {}, true, null, null);

                        /*
                         * Add features, first select the layer and then set the layer source to the kohde.
                         */
                        var taLayer = null;
                        for (var i = 0; i < vm.mapLayers.length; i++) {
                            if (vm.mapLayers[i].name == 'Tutkimusalueet') {
                                taLayer = vm.mapLayers[i];
                                if (taLayer != null) {
                                    vm.updateLayerData('Tutkimusalueet');
                                }
                                break;
                            }
                        }
                    }

                    /*
                     * Select alue or arvoalue layers (or both)
                     */
                    vm.selectLayer = function() {
                        vm.selectedLayers = MapService.selectLayer(vm.mapLayers, vm.selectedLayers, {}, true, null, null);

                        for (var i = 0; i < vm.mapLayers.length; i++) {
                            if (vm.mapLayers[i].name == 'Tutkimusalueet') {
                                vm.updateLayerData('Tutkimusalueet');
                            }
                        }
                    };

                    /**
                     * Controller-spesifinen funktio, jossa määritetään mitä dataa millekin controllerin käsittelemälle tasolle
                     * asetetaan kun taso valitaan.
                     */
                    vm.updateLayerData = function(layerName) {
                        var feature = vm.tutkimusalue;
                        if(feature.geometry == null || feature.geometry.coordinates == null) {
                            return;
                        }
                        var l = null;
                         for(var i = 0; i<vm.mapLayers.length; i++) {
                             if(vm.mapLayers[i].name == layerName) {
                                 l = vm.mapLayers[i];
                                 break;
                             }
                         }
                         //If we found a valid layer and it's active (=is visible), get the features for the view.
                         if(l && l.active) {
                             if(l.name == 'Tutkimusalueet') {
                                 l.source.geojson.object.features = [vm.tutkimusalue];
                             }
                         }
                    };

                    // Move handler of the map. Make the pointer appropriate.
                    // Show popup on mouseover. (TODO: how to make it work in
                    // fullscreen mode?)
                    $scope.$on('openlayers.map.pointermove', function (event, data) {
                        $scope.$apply(function () {
                            if (vm.map) {
                                var map = vm.map;
                                MapService.hideMapPopup(vm.mapPopupId);
                                map.getTarget().style.cursor = 'move';
                            }
                        });
                    });

                    hotkeys.bindTo($scope).add({
                        combo : 'o',
                        description : 'vm',
                        callback : function () {
                            console.log(angular.copy(vm));
                        }
                    });

                    hotkeys.bindTo($scope).add({
                        combo : 'i',
                        description : 'map',
                        callback : function () {
                            var vmMap = angular.copy(vm.map);
                            olData.getMap(vm.mapId).then(function(map) {
                                console.log(".1:" + vmMap.getView().getCenter());
                                console.log(".2:" + map.getView().getCenter());
                            });

                        }
                    });

                    vm.showMap = true;
                }

        ]);
