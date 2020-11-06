/*
 * Controller for the kiinteistöt.
 */
angular.module('mip.inventointijulkaisu').controller(
        'InventointijulkaisuController',
        [
                '$scope', '$location', 'TabService', 'CONFIG', 'existing', 'ModalService',
                'AlertService', '$filter', 'UserService', '$timeout', 'inventointijulkaisu',
                'InventointijulkaisuService', 'MapService', '$rootScope', 'olData',
                'NgTableParams', 'ListService', 'InventointiprojektiService', 'locale',
                'MuutoshistoriaService', 'permissions', 'selectedModalNameId', 'KuntaService', 'KylaService',
                function($scope, $location, TabService, CONFIG, existing, ModalService,
                		AlertService, $filter, UserService, $timeout, inventointijulkaisu,
                		InventointijulkaisuService, MapService, $rootScope, olData,
                		NgTableParams, ListService, InventointiprojektiService, locale,
                		MuutoshistoriaService, permissions, selectedModalNameId, KuntaService, KylaService) {

                    // map id fetching
                    var _mapId = $rootScope.getNextMapId();

                    $scope.mapId = "alueMap" + _mapId;
                    $scope.mapPopupId = "alueMapPopup" + _mapId;

                    // Unique modal id which is used for the collapsible panels
                    $scope.modalId = ModalService.getNextModalId();

                    // Valitun modalin nimi ja järjestysnumero
                    $scope.modalNameId = selectedModalNameId;

                    // Is the form in edit mode or not
                    $scope.edit = false;

                    $scope.map = null;

                    // Used to force the inventoija users to set the inventointiprojekti before the saving is allowed
                    $scope.userRole = UserService.getProperties().user.rooli;

                    // Are we creating a new one or doing legitimate editing?
                    // If this is true, some buttons are hidden.
                    $scope.create = false;

                    // Enable / Disable save and cancel buttons while doing operations.
                    $scope.disableButtons = false;
                    $scope.disableButtonsFunc = function() {
                        if ($scope.disableButtons) {
                            $scope.disableButtons = false;
                        } else {
                            $scope.disableButtons = true;
                        }
                    };

                    // existing = true when viewing an existing property
                    // false when creating a new one
                    if (!existing) {
                        $scope.edit = true;
                        $scope.create = true;
                    }

                    if (inventointijulkaisu) {
                        $scope.inventointijulkaisu = inventointijulkaisu;
                        $scope.inventointijulkaisu.properties.kentat = JSON.parse($scope.inventointijulkaisu.properties.kentat);
                    } else {
                        $scope.inventointijulkaisu = {
                            'properties' : {
                            	'tasot': [],
                            	'kentat': {
                            		'kiinteisto': [],
                            		'rakennus': [],
                            		'alue': [],
                            		'arvoalue': []
                            	}
                            }
                        }
                    }




                    //Kommenteissa kentät joita ei tällä hetkellä ole mahdollista valita, koska
                    //backendiin ei ole lisätty ko. kenttiä valittaviksi.
                    //Jos nämä halutaan valittaviksi, tulee ne lisätä backendiin valittaviksi +
                    //lisätä kiinteistotason SQL:lään.
                    $scope.kiinteistoValittavissaolevatKentat = [
                    	{'editable': true, 'name': 'nimi', 'label': locale.getString('common.Name')},
                    	{'editable': true, 'name': 'kiinteistotunnus', 'label': locale.getString('common.Property_identifier')},
                    	{'editable': true, 'name': 'kunta', 'label': locale.getString('common.County')},
                    	{'editable': true, 'name': 'kyla', 'label': locale.getString('common.Village')},
                    	{'editable': true, 'name': 'arvoluokka', 'label': locale.getString('common.Valuation')},
                    	{'editable': true, 'name': 'yhteenveto', 'label': locale.getString('common.Summary')},
                    	{'editable': true, 'name': 'kulttuurihistorialliset_arvot', 'label': locale.getString('common.Culturohistorical_values')},
                    	{'editable': true, 'name': 'kuva_url', 'label': locale.getString('common.Image')},
                    	{'editable': true, 'name': 'tilatyypit', 'label': locale.getString('common.Historical_property_types')},
                    	//{'editable': true, 'name': 'lisatiedot', 'label': locale.getString('common.Additional_information')},
                    	{'editable': true, 'name': 'asutushistoria', 'label': locale.getString('common.Settlement_history')},
                    	{'editable': true, 'name': 'lahiymparisto', 'label': locale.getString('common.Surroundings')},
                    	{'editable': true, 'name': 'pihapiiri', 'label': locale.getString('common.Courtyard')},
                    	{'editable': true, 'name': 'arkeologinen_intressi', 'label': locale.getString('common.Archeological_interests')},
                    	{'editable': true, 'name': 'muu_historia', 'label': locale.getString('common.Other_history')},
                    	//{'editable': true, 'name': 'tarkistettu', 'label': locale.getString('common.Inspected')},
                    	//{'editable': true, 'name': 'palstanumero', 'label': locale.getString('common.Column_number')},
                    	{'editable': true, 'name': 'paikkakunta', 'label': locale.getString('common.Municipality')},
                    	{'editable': true, 'name': 'inventointiprojekti', 'label': locale.getString('common.Inventory_project')},
                    	{'editable': true, 'name': 'inventoija', 'label': locale.getString('common.Inventor')},
                    	{'editable': true, 'name': 'inventointipaiva', 'label': locale.getString('common.Inventory_date')},
                    	{'editable': true, 'name': 'aluetyypit', 'label': locale.getString('common.Area_types')},
                    	{'editable': true, 'name': 'perustelut', 'label': locale.getString('common.Reasonings')},
                    	{'editable': true, 'name': 'linkit_paikallismuseoihin', 'label': locale.getString('common.Links_to_local_museums')},
                    	{'editable': true, 'name': 'paikallismuseot_kuvaus', 'label': locale.getString('common.Local_museum_description')}
                    ];

                    //Nämä kentät valitaan oletuksena. Pakollisia kenttiä ei voi jättää valitsematta
                    $scope.kiinteistoValitutKentat = [
                    	{'editable': false, 'name': 'id', 'label': locale.getString('common.Id')},
            			{'editable': false, 'name': 'kiinteiston_sijainti', 'label': locale.getString('common.Location')}

                    ];

                    $scope.rakennusValittavissaolevatKentat = [
                    	{'editable': true, 'name': 'kunta', 'label': locale.getString('common.County')},
                    	{'editable': true, 'name': 'kyla', 'label': locale.getString('common.Village')},
                    	{'editable': true, 'name': 'kiinteisto', 'label': locale.getString('common.Estate')},
                    	{'editable': true, 'name': 'kiinteistotunnus', 'label': locale.getString('common.Property_identifier')},
                    	{'editable': true, 'name': 'inventointinumero', 'label': locale.getString('common.Inventory_number')},
                        {'editable': true,'name': 'osoitteet', 'label': locale.getString('common.Addresses')},
                        {'editable': true,'name': 'postinumero', 'label': locale.getString('common.Postal_code')},
                        {'editable': true,'name': 'rakennustunnus', 'label': locale.getString('common.Building_identifier')},
                        {'editable': true,'name': 'rakennustyypit','label': locale.getString('common.Building_type')},
                        {'editable': true,'name': 'rakennustyyppi_kuvaus','label': locale.getString('common.Building_type_description')},
                        {'editable': true,'name': 'rakennusvuosi_alku','label': locale.getString('common.Construction_year_start')},
                        {'editable': true,'name': 'rakennusvuosi_loppu','label': locale.getString('common.Construction_year_end')},
                        {'editable': true,'name': 'rakennusvuosi_selite','label': locale.getString('common.Construction_year_description')},
                        {'editable': true,'name': 'muutosvuodet','label': locale.getString('common.Alteration_years')},
                        {'editable': true,'name': 'alkuperainen_kaytto','label': locale.getString('common.Original_usage')},
                        {'editable': true,'name': 'nykykaytto','label': locale.getString('common.Common_usage')},
                        {'editable': true,'name': 'kerroslukumaara','label': locale.getString('common.Number_of_floors')},
                        {'editable': true,'name': 'asuin_ja_liikehuoneistoja','label': locale.getString('common.Residences_and_offices')},
                        {'editable': true,'name': 'perustus','label': locale.getString('common.Foundation')},
                        {'editable': true,'name': 'runko','label': locale.getString('common.Frame')},
                        {'editable': true,'name': 'julkisivumateriaali','label': locale.getString('common.Lining')},
                        {'editable': true,'name': 'ulkovari','label': locale.getString('common.Outside_color')},
                        {'editable': true,'name': 'kattotyypit','label': locale.getString('common.Ceiling')},
                        {'editable': true,'name': 'katetyypit','label': locale.getString('common.Cover')},
                        {'editable': true,'name': 'kunto','label': locale.getString('common.Condition')},
                        {'editable': true,'name': 'nykytyyli','label': locale.getString('common.Contemporary_style')},
                        {'editable': true,'name': 'purettu','label': locale.getString('common.Demolished')},
                        {'editable': true,'name': 'erityispiirteet','label': locale.getString('common.Special_characteristics')},
                        {'editable': true,'name': 'kulttuurihistorialliset_arvot','label': locale.getString('common.Culturohistorical_values')},
                        {'editable': true,'name': 'kulttuurihistoriallisetarvot_perustelut','label': locale.getString('common.Reasonings')},
                        {'editable': true,'name': 'arvoluokka','label': locale.getString('common.Valuation')},
                        {'editable': true,'name': 'suunnittelija','label': locale.getString('common.Architects')},
                        {'editable': true, 'name': 'rakennushistoria', 'label': locale.getString('common.Structure_history')},
                    	{'editable': true, 'name': 'sisatilakuvaus', 'label': locale.getString('common.Interior_description')},
                    	{'editable': true, 'name': 'muut_tiedot', 'label': locale.getString('common.Other_information')},
                    	{'editable': true, 'name': 'suojelutiedot', 'label': locale.getString('common.Estate_protection')}
                    ];

                    $scope.rakennusValitutKentat = [
                    	{'editable': false, 'name': 'id', 'label': locale.getString('common.Id')},
                        {'editable': false, 'name': 'rakennuksen_sijainti','label': locale.getString('common.Location')}
                    ];

                    /*
                     * ALUEELLE VALITTAVISSA OLEVAT KENTÄT
                     */
                    $scope.alueValittavissaolevatKentat = [
                    	{'editable': true, 'name': 'kuntakyla', 'label': locale.getString('common.County') + " & " + locale.getString('common.Village')},
                    	{'editable': true, 'name': 'nimi', 'label': locale.getString('common.Area')},
                        {'editable': true,'name': 'paikkakunta','label': locale.getString('common.Municipality')},
                        {'editable': true,'name': 'historia','label': locale.getString('common.History')},
                        {'editable': true,'name': 'maisema', 'label': locale.getString('common.Scenery')},
                        {'editable': true, 'name': 'nykytila', 'label': locale.getString('common.Current_condition')},
                        {'editable': true, 'name': 'inventointiprojekti', 'label': locale.getString('common.Inventory_project')},
                    	{'editable': true, 'name': 'inventoija', 'label': locale.getString('common.Inventor')},
                    	{'editable': true, 'name': 'inventointipaiva', 'label': locale.getString('common.Inventory_date')},
                    	{'editable': true, 'name': 'kuva_url', 'label': locale.getString('common.Image')}
                    ];

                    $scope.alueValitutKentat = [
                    	{'editable': false, 'name': 'id', 'label': locale.getString('common.Id')},
                        {'editable': false, 'name': 'alueen_sijainti','label': locale.getString('common.Location')}
                    ];

                    /*
                     * ARVOALUEELLE VALITTAVISSA OLEVAT KENTÄT
                     */
                    $scope.arvoalueValittavissaolevatKentat = [
                    	{'editable': true, 'name': 'kuntakyla', 'label': locale.getString('common.County') + " & " + locale.getString('common.Village')},
                    	{'editable': true, 'name': 'nimi', 'label': locale.getString('common.Valuearea')},
                    	{'editable': true, 'name': 'alue', 'label': locale.getString('common.Area')},
                    	{'editable': true, 'name': 'paikkakunta', 'label': locale.getString('common.Municipality')},
                    	{'editable': true, 'name': 'aluetyyppi', 'label': locale.getString('common.Area_type')},
                    	{'editable': true, 'name': 'arvoluokka', 'label': locale.getString('common.Valuation')},
                    	{'editable': true, 'name': 'kulttuurihistorialliset_arvot', 'label': locale.getString('common.Culturohistorical_values')},
                    	{'editable': true, 'name': 'perustelut', 'label': locale.getString('common.Reasonings')},
                    	{'editable': true, 'name': 'yhteenveto', 'label': locale.getString('common.Summary')},
                    	{'editable': true, 'name': 'inventointinumero', 'label': locale.getString('common.Inventory_number')},
                    	{'editable': true, 'name': 'inventointiprojekti', 'label': locale.getString('common.Inventory_project')},
                     	{'editable': true, 'name': 'inventoija', 'label': locale.getString('common.Inventor')},
                     	{'editable': true, 'name': 'inventointipaiva', 'label': locale.getString('common.Inventory_date')},
                    	{'editable': true, 'name': 'kuva_url', 'label': locale.getString('common.Image')}
                    ];

                    $scope.arvoalueValitutKentat = [
                    	{'editable': false, 'name': 'id', 'label': locale.getString('common.Id')},
                        {'editable': false, 'name': 'aalueen_sijainti','label': locale.getString('common.Location')}

                    ];

                    $scope.kiinteistoTasoSelected = false;
                    $scope.rakennusTasoSelected = false;
                    $scope.alueTasoSelected = false;
                    $scope.aalueTasoSelected = false;

                    $scope.isSelected = function(taso) {
                    	for(var i = 0; i<$scope.inventointijulkaisu.properties.tasot.length; i++) {
                    		if($scope.inventointijulkaisu.properties.tasot[i].nimi === taso) {
                    			return true;
                    		}
                    	}
                    	return false;
                    }

                    $scope.$watch('inventointijulkaisu.properties.tasot', function(newV, oldV) {
                    	//oldV sisältää tasot jotka oli ennen valittuna,
                    	//newV sisältää tasot jotka on nyt valittuna.
                    	//Vertaamalla näitä kahta saadaan tietoon mikä lisättiin tai mikä poistettiin
                    	//On uudessa, mutta ei ole vanhassa -> uusi, asetetaan default arvot
                    	for(var i = 0; i<newV.length; i++) {
                    		var isNew = true;

                    		for(var j = 0; j<oldV.length; j++) {
                    			if(newV[i].nimi === oldV[j].nimi) {
                    				isNew = false;
                    				break;
                    			}
                    		}

                    		if(isNew === true) {
                    			if(newV[i].nimi === 'kiinteisto') {
                    				$scope.inventointijulkaisu.properties.kentat['kiinteisto'] = $scope.kiinteistoValitutKentat;
                    			}
                    			if (newV[i].nimi === 'rakennus') {
                    				$scope.inventointijulkaisu.properties.kentat['rakennus'] = $scope.rakennusValitutKentat;
                    			}
                    			if (newV[i].nimi === 'alue') {
                    				$scope.inventointijulkaisu.properties.kentat['alue'] = $scope.alueValitutKentat;
                    			}
                    			if (newV[i].nimi === 'arvoalue') {
                    				$scope.inventointijulkaisu.properties.kentat['arvoalue'] = $scope.arvoalueValitutKentat;
                    			}
                    		}
                    	}
                    });

                    // Store the original alue for possible cancel operation
                    $scope.original = angular.copy($scope.inventointijulkaisu);

                    // Map is added to the DOM after the modal is shown,
                    // otherwise it
                    // will not be drawn until page resize
                    $scope.showMap = false;

                    // Store permissions to alue & arvoalue entities to scope
                    $scope.permissions = permissions;

                    /*
                     * Inventory projects
                     */
                    $scope.inventointiprojektit = [];
                    $scope.getInventointiprojektit = function(search) {
                        if(search === ""){
                            search = "%";
                        } 
                        // Now get the actual data...
                        InventointiprojektiService.getInventointiprojektit({
                            'rivit': 50,
                            'jarjestys': 'nimi',
                            'nimi': search
                        }).then(function success(data) {
                            $scope.inventointiprojektit.length = 0;

                            for (var i = 0; i < data.features.length; i++) {
                                $scope.inventointiprojektit.push(data.features[i].properties);
                            }
                        }, function error(data) {
                            locale.ready('i').then(function success() {
                                AlertService.showError(locale.getString("error.Getting_inventoryprojects_failed"), AlertService.message(data));
                            })
                        });

                    };
                    $scope.getInventointiprojektit();

                    $scope.tasot = [
                            {
                                'id' : 1,
                                'nimi' : 'kiinteisto'
                            }, {
                                'id' : 2,
                                'nimi' : 'rakennus'
                            }, {
                                'id' : 5,
                                'nimi' : 'alue'
                            }, {
                                'id' : 6,
                                'nimi' : 'arvoalue'
                            }
                    ];

                    $scope.showMuutoshistoria = function() {
                        MuutoshistoriaService.getInventointijulkaisuMuutosHistoria($scope.inventointijulkaisu.properties.id).then(function(historia) {
                            ModalService.inventointijulkaisuMuutoshistoriaModal(historia, $scope.inventointijulkaisu.properties.nimi);
                        });
                    };

                    /*
                     * OPERATIONS
                     */

                    /*
                     * Cancel view mode
                     */
                    $scope.close = function() {
                        if ($scope.edit) {
                            $scope.cancelEdit();
                        }
                        $scope.showMap = false;
                        // Sulkee modaalin ja poistaa listalta
                    	ModalService.closeModal($scope.modalNameId);
                        $scope.$destroy();
                    };

                    /*
                     * Cancel edit mode
                     */
                    $scope.cancelEdit = function() {
                        // Asetetaan tiedot alkuperäisiin arvoihin
                        for ( var property in $scope.original) {
                            if ($scope.inventointijulkaisu.hasOwnProperty(property)) {
                                $scope.inventointijulkaisu[property] = angular.copy($scope.original[property]);
                            }
                        }

                        $scope.edit = false;
                    };

                    /*
                     * Readonly / edit mode.
                     */
                    $scope.editMode = function() {
                        $scope.edit = true;
                        $scope.getInventointiprojektit();
                    };

                    /*
                     * Save changes
                     */
                    $scope.save = function() {
                    	//Mandatory values are missing
                        if(($scope.inventointijulkaisu.properties.inventointiprojektit === undefined ||
                        	$scope.inventointijulkaisu.properties.inventointiprojektit.length === 0) &&
                        	($scope.inventointijulkaisu.properties.kunnatkylat.length === 0 ||
                    	    ($scope.inventointijulkaisu.properties.kunnatkylat[0].kunta == null && $scope.inventointijulkaisu.properties.kunnatkylat[0].kyla == null ))) {

                        	locale.ready('inventorypublication').then(function() {
                        		AlertService.showWarning(locale.getString('inventorypublication.Inventoryproject_or_county_is_mandatory'));
                        	});
                    		return ;
                    	}

                        if($scope.inventointijulkaisu.properties.inventointiprojektit && $scope.inventointijulkaisu.properties.inventointiprojektit.length === 0) {
                        	delete $scope.inventointijulkaisu.properties.inventointiprojektit;
                        }

                        $scope.disableButtonsFunc();
                        $scope.inventointijulkaisu.properties.kentat = JSON.stringify($scope.inventointijulkaisu.properties.kentat);

                        InventointijulkaisuService.saveInventointijulkaisu($scope.inventointijulkaisu).then(function(id) {

                            if ($scope.create) {
                                $scope.inventointijulkaisu.properties["id"] = id;
                                $scope.create = false;
                            }
                            // TODO
                            InventointijulkaisuService.fetchInventointijulkaisu(id).then(function success(data) {
                                $scope.inventointijulkaisu = data;
                                $scope.inventointijulkaisu.properties.kentat = JSON.parse($scope.inventointijulkaisu.properties.kentat);
                            }, function error(data) {
                                locale.ready('inventorypublication').then(function() {
                                    AlertService.showError(locale.getString('inventorypublication.Getting_updated_data_failed'), AlertService.message(data));
                                });
                            });

                            $scope.edit = false;

                            // "update" the original after successful save
                            $scope.original = angular.copy($scope.inventointijulkaisu);

                            $scope.disableButtonsFunc();

                            locale.ready('inventorypublication').then(function() {
                                AlertService.showInfo(locale.getString('inventorypublication.Saved_successfully', {name: $scope.inventointijulkaisu.properties.nimi}), AlertService.message(data));
                            });

                        }, function error(data) {
                        	$scope.inventointijulkaisu.properties.kentat = JSON.parse($scope.inventointijulkaisu.properties.kentat);

                            locale.ready('inventorypublication').then(function() {
                                AlertService.showError(locale.getString("inventorypublication.Save_failed"), AlertService.message(data));
                            });
                            $scope.disableButtonsFunc();
                        });
                    };

                    /*
                     * Delete
                     */
                    $scope.deleteInventointijulkaisu = function(modalNameId) {
                        var conf = confirm(locale.getString('common.Confirm_delete2', {'item': $scope.inventointijulkaisu.properties.nimi}));
                        if (conf) {
                            InventointijulkaisuService.deleteInventointijulkaisu($scope.inventointijulkaisu).then(function() {
                                locale.ready('inventorypublication').then(function() {
                                    AlertService.showInfo(locale.getString('inventorypublication.Deleted', {name: $scope.inventointijulkaisu.properties.nimi}));
                                });
                                $scope.close();
                            }, function error(data) {
                                locale.ready('inventorypublication').then(function() {
                                    AlertService.showError(locale.getString('inventorypublication.Delete_failed'), AlertService.message(data));
                                });
                            });
                        }
                    };

                    $scope.showMap = true;
                }

        ]);
