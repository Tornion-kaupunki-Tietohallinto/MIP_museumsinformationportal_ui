/*
 * Controller for the arvoalue.
 */
angular.module('mip.arvoalue').controller(
        'ArvoalueController',
        [
                '$scope', '$q', '$location', 'TabService', 'CONFIG', 'existing', '$http', 'ModalService',
                'AlertService', 'ArvoalueService', '$timeout', 'MapService', '$rootScope', 'olData', 'hotkeys',
                'arvoalue', 'alue', 'AlueService', 'locale', 'InventointiprojektiService', 'UserService', 'permissions',
                'ListService', 'FileService', 'KuntaService', 'KylaService', 'NgTableParams', '$filter', 'KiinteistoService',
                'MuutoshistoriaService', 'EntityBrowserService', 'selectedModalNameId', 'RakennusService',
                function($scope, $q, $location, TabService, CONFIG, existing, $http, ModalService,
                        AlertService, ArvoalueService, $timeout, MapService, $rootScope, olData, hotkeys,
                        arvoalue, alue, AlueService, locale, InventointiprojektiService, UserService, permissions,
                        ListService, FileService, KuntaService, KylaService, NgTableParams, $filter, KiinteistoService,
                        MuutoshistoriaService, EntityBrowserService, selectedModalNameId, RakennusService) {
                    // map id fetching
                    var _mapId = $rootScope.getNextMapId();

                    $scope.mapId = "arvoalueMap" + _mapId;
                    $scope.mapPopupId = "arvoalueMapPopup" + _mapId;

                    //Unique modal id which is used for the collapsible panels
                    $scope.modalId = ModalService.getNextModalId();

                    // Valitun modalin nimi ja järjestysnumero
                    $scope.modalNameId = selectedModalNameId;

                    // Is the form in edit mode or not
                    $scope.edit = false;

                    $scope.map = null;

                    //for translations ot work
                    $scope.selectText = locale.getString('common.Select');
                    $scope.textSelectMapLayers = locale.getString('common.Map_layers');
                    $scope.textSelectLayers = locale.getString('common.Layers');

                    // Used to force the inventoija users to set the inventointiprojekti before the saving is allowed
                    $scope.userRole = UserService.getProperties().user.rooli;

                    // Is the user inventory auditor?
                    $scope.isInventor = false;

                    // Are we creating a new one or doing legitimate editing?
                    // If this is true, some buttons are hidden.
                    $scope.create = false;

                    // Options for NoYes dropdown list
                    $scope.noYes = ListService.getNoYes();

                    // Enable / Disable save and cancel buttons while doing operations.
                    $scope.disableButtons = false;
                    $scope.disableButtonsFunc = function() {
                        if ($scope.disableButtons) {
                            $scope.disableButtons = false;
                        } else {
                            $scope.disableButtons = true;
                        }
                    };

                    $scope.currentLocale = locale.getLocale();

                    //list that contains inventoiniprojects that are deleted after saving edit
                    $scope.inventointiprojektiDeleteList = [];

                    //method that adds to list that contains inventoiniprojects that are deleted after saving edit
                    $scope.addToInventointiprojektiDeleteList = function (inventointiprojektiId, inventoijaId) {
                    	var obj = {inventointiprojektiId:inventointiprojektiId, inventoijaId:inventoijaId};
                    		$scope.inventointiprojektiDeleteList.push(obj);

                    	for (var i = 0; i < $scope.arvoalue.properties.inventointiprojektit.length; i++){
                    		var ip = $scope.arvoalue.properties.inventointiprojektit[i];
                    		if(ip.id === inventointiprojektiId){
                    			for(var j = 0; j < ip.inventoijat.length; j++){
                    				if(ip.inventoijat[j].inventoija_id === inventoijaId){
                    					ip.inventoijat.splice(j, 1);
                    					break;
                    				}
                    			}
                        		if(ip.inventoijat.length === 0){
                        			$scope.arvoalue.properties.inventointiprojektit.splice(i, 1);
                        		}
                    			break;
                    		}
                    	}
                    };

                    // Get the Arvoalue that was selected (if any; will be
                    // empty if creating a new one)
                    $scope.arvoalue = {
                        'geometry' : {
                            'coordinates' : []
                        },
                        'properties' : {
                            'suojelutiedot' : [],
                            'inventointiprojekti' : {},
                        	'arkeologinen_kohde' : $scope.noYes[0].value
                        }
                    };
                    if (arvoalue) {
                        $scope.arvoalue = arvoalue;
                    }
                    // Store the original arvoalue for possible cancel
                    // operation
                    $scope.original = angular.copy($scope.arvoalue);

                    // existing = true when viewing an existing property
                    // false when creating a new one
                    if (!existing) {
                        $scope.edit = true;
                        $scope.create = true;
                    }
                    // We arrived here from alue
                    if (alue) {
                        $scope.arvoalue.properties._alue = alue.properties;
                    } else {
                        alue = $scope.arvoalue.properties._alue;
                    }

                    /*
                     * Is the user inventory auditor or not?
                     */
                    $scope.isInventorFunc = function() {
                        // Get only the inventor's inventory projects
                        var role = $filter('uppercase')($scope.userRole);

                        angular.forEach(CONFIG.ROLES.PROJECT, function(value, key) {
                            // Below is the U+1F44D way to check. Here is a hack U+1F644
                            if (value == 4 && role == key || value == 4 && role == 'INVENTOIJA') {
                                $scope.isInventor = true;
                            }
                        });
                    };
                    $scope.isInventorFunc();

                    // This array holds the actual selections and also the kyla-options for each kyla-kunta-group
                    $scope.alueKylaKuntaSelections = [];

                    $scope.addKylaKuntaSelection = function() {
                        var k = {
                            'kyla' : null,
                            'kunta' : null,
                            'kylaOptions' : []
                        };
                        $scope.alueKylaKuntaSelections.push(k);
                    }

                    function kylaOptionsCallBackCreator(index) {
                        return function(kylaOptions) {
                            // clear it
                            $scope.alueKylaKuntaSelections[index].kylaOptions.length = 0;
                            // fill it
                            // TODO: remove all such kyla options from this list that are used in some
                            // other combo, because duplicates are not allowed
                            for (var i = 0; i < kylaOptions.features.length; i++) {
                                var k = {
                                    'id' : kylaOptions.features[i].properties.id,
                                    'nimi' : kylaOptions.features[i].properties.nimi,
                                    'kylanumero' : kylaOptions.features[i].properties.kylanumero
                                }
                                $scope.alueKylaKuntaSelections[index].kylaOptions.push(k);
                            }
                        }
                    }

                    $scope.getSelections = function() {
                        if ($scope.create) {
                            $scope.addKylaKuntaSelection(); // one is mandatory
                            return;
                        }

                        if ($scope.edit) {
                            // clear
                            $scope.alueKylaKuntaSelections.length = 0;
                            // fill
                            for (var i = 0; i < $scope.arvoalue.properties.kylat.length; i++) {

                                var k = {
                                    'kyla' : $scope.arvoalue.properties.kylat[i],
                                    'kunta' : $scope.arvoalue.properties.kylat[i].kunta,
                                    'kylaOptions' : []
                                };

                                $scope.alueKylaKuntaSelections.push(k);

                                var params = {
                                    'rivit' : 1000000,
                                    'jarjestys' : 'nimi'
                                };
                                var promise = KuntaService.getKylatOfKunta($scope.arvoalue.properties.kylat[i].kunta.id, params);
                                var callback = kylaOptionsCallBackCreator(i);

                                promise.then(callback, function(reason) {
                                    locale.ready('common').then(function() {
                                        AlertService.showError(locale.getString('common.Error'), locale.getString('kyla.Fetching_villages_failed'));
                                    });
                                });
                            }

                            if ($scope.alueKylaKuntaSelections.length == 0) {
                                $scope.addKylaKuntaSelection(); // one is mandatory
                            }
                        }
                    };

                    $scope.getSelections();

                    /*
                     * Kulttuurihistorialliset arvot
                     */
                    $scope.kultHistArvot = [];
                    $scope.origKultHistArvot = [];
                    ListService.getOptions('kulttuurihistoriallinenarvo', 'arvoalue').then(function success(options) {
                        for (var i = 0; i < options.data.features.length; i++) {
                            var opt = options.data.features[i];
                            $scope.kultHistArvot.push({
                                id : opt.properties.id,
                                nimi_fi : opt.properties.nimi_fi,
                                nimi_se : opt.properties.nimi_se
                            });
                        }
                    });

                    /*
                     * Arvotus
                     */
                    $scope.arvotusOptions = [];
                    $scope.getArvotusOptions = function() {
                        if ($scope.create || ($scope.edit && $scope.arvotusOptions.length == 0)) {
                            ListService.getOptions('arvotus').then(function success(options) {
                                $scope.arvotusOptions = options;
                            }, function error(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString("error.Getting_valuearea_valuation_options_failed"), AlertService.message(data));
                                });
                            });
                        }
                    };
                    $scope.getArvotusOptions();// todo: virheilmoitukset myös alue

                    /*
                     * Aluetyyppi
                     */
                    $scope.aluetyyppiOptions = [];
                    $scope.getAluetyyppiOptions = function() {
                        if ($scope.create || ($scope.edit && $scope.aluetyyppiOptions.length == 0)) {
                            ListService.getOptions('aluetyyppi').then(function success(options) {
                                $scope.aluetyyppiOptions = options;
                            }, function error(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString("error.Getting_areatypes_options_failed"), AlertService.message(data));
                                });
                            });
                        }
                    };
                    $scope.getAluetyyppiOptions();

                    /*
                     * Suojelu
                     */
                    $scope.suojeluOptions = [];
                    $scope.getSuojeluOptions = function() {
                        if ($scope.create || ($scope.edit && $scope.suojeluOptions.length == 0)) {
                            ListService.getOptions('suojelutyypit').then(function success(options) {

                                // lets "flatten" the data for select to work correctly, to create the groups
                                angular.forEach(options, function(grp) {
                                    angular.forEach(grp.suojelutyypit, function(st) {
                                        st.suojelutyyppi_ryhma_nimi = grp.nimi_fi;
                                        $scope.suojeluOptions.push(st);
                                    })
                                });

                            }, function error(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString("error.Getting_protection_options_failed"), AlertService.message(data));
                                });
                            });
                        }
                    };

                    $scope.getSuojeluOptions();

                    /*
                     * Inventory projects
                     */
                    $scope.inventointiprojektit = [];
                    $scope.getInventointiprojektit = function() {

                        // Now get the actual data...
                        if ($scope.isInventor || $scope.userRole === 'tutkija') {
                            UserService.getUserInventoryProjects(UserService.getProperties().user.id).then(function success(data) {
                                $scope.inventointiprojektit = data;
                            }, function error(data) {
                                locale.ready('error').then(function success() {
                                    AlertService.showError(locale.getString("error.Getting_inventoryprojects_failed"), AlertService.message(data));
                                });
                            });
                        } else {
                            if ($scope.create || ($scope.edit && $scope.inventointiprojektit.length == 0)) {
                                InventointiprojektiService.getInventointiprojektit({
                                    'rivit' : 1000000,
                                    'jarjestys': 'nimi'
                                }).then(function success(results) {
                                    $scope.inventointiprojektit = results.features;
                                }, function error(data) {
                                    locale.ready('error').then(function success() {
                                        AlertService.showError(locale.getString("error.Getting_inventoryprojects_failed"), AlertService.message(data));
                                    })
                                });
                            }
                        }
                    };
                    $scope.getInventointiprojektit();

                    /*
                     * Set the inventointiprojekti value or delete everything if no project selected.
                     */
                    $scope.inventointiprojektiChanged = function(force) {
                        if ($scope.arvoalue.properties.inventointiprojekti.inventointiprojekti_id) {

                            //Asetetaan käyttäjä
                            $scope.arvoalue.properties.inventointiprojekti.inventoija_id = UserService.getProperties().user.id;

                            /*
                             * Inventointipäivän asetus. Haetaan inventointiprojektilistasta valittu inventointiprojekti ja tältä
                             * oikean inventoijan kohdalta inventointipaiva.
                             * Jos inventointipaivaa ei ole (tai sen asettaminen ei muuten onnistunut), asetetaan inventointipaivaksi kuluva paiva.
                             */
                            if($scope.arvoalue.properties.inventointiprojektit) {
                                for(var i = 0; i<$scope.arvoalue.properties.inventointiprojektit.length; i++) {
                                    var ip = $scope.arvoalue.properties.inventointiprojektit[i];

                                    var dateToSet = null;
                                    if(ip.id == $scope.arvoalue.properties.inventointiprojekti.inventointiprojekti_id) {
                                        for(var j = 0; j<ip.inventoijat.length; j++) {
                                            if(ip.inventoijat[j].inventoija_id == $scope.arvoalue.properties.inventointiprojekti.inventoija_id) {
                                                if(angular.isDate(ip.inventoijat[j].inventointipaiva)) {
                                                    dateToSet = ip.inventoijat[j].inventointipaiva;
                                                } else {
                                                    var d = $filter('pvm')(ip.inventoijat[j].inventointipaiva);
                                                    d = new Date(d);
                                                    dateToSet = d;
                                                }
                                                break;
                                            }
                                        }
                                    }
                                    if(dateToSet != null) {
                                        break;
                                    }
                                }
                                $scope.arvoalue.properties.inventointiprojekti.inventointipaiva = dateToSet;
                            }
                            if($scope.arvoalue.properties.inventointiprojekti.inventointipaiva == null) {
                                $scope.arvoalue.properties.inventointiprojekti.inventointipaiva = new Date();
                            }

                            /*
                             * Kenttäpäivän asetus, samoin kuten inventointipaiva yllä, paitsi että kenttapaiva ei saa kuluvaa paivaa arvoksi, vaan jää tyhjäksi.
                             */
                            if($scope.arvoalue.properties.inventointiprojektit) {
                                for(var i = 0; i<$scope.arvoalue.properties.inventointiprojektit.length; i++) {
                                    var ip = $scope.arvoalue.properties.inventointiprojektit[i];

                                    var dateToSet = null;
                                    if(ip.id == $scope.arvoalue.properties.inventointiprojekti.inventointiprojekti_id) {
                                        for(var j = 0; j<ip.inventoijat.length; j++) {
                                            if(ip.inventoijat[j].inventoija_id == $scope.arvoalue.properties.inventointiprojekti.inventoija_id) {
                                                if(angular.isDate(ip.inventoijat[j].kenttapaiva)) {
                                                    dateToSet = ip.inventoijat[j].kenttapaiva;
                                                } else {
                                                    var d = $filter('pvm')(ip.inventoijat[j].kenttapaiva);
                                                    d = new Date(d);
                                                    dateToSet = d;
                                                }
                                                break;
                                            }
                                        }
                                    }
                                    if(dateToSet != null) {
                                        break;
                                    }
                                }
                                $scope.arvoalue.properties.inventointiprojekti.kenttapaiva = dateToSet;
                            }
                        } else {
                            delete $scope.arvoalue.properties.inventointiprojekti;
                        }
                    };

                    $scope.inventointiprojektiTable = new NgTableParams({
                        page : 1,
                    // count : 10,
                    // total : 25
                    // dummy data
                    }, {
                        counts : [], // No page sizes -> disabled
                        getData : function($defer, params) {
                            if (!$scope.create) {
                                if ($scope.arvoalue.properties.inventointiprojektit) {
                                    var orderedData = $scope.arvoalue.properties.inventointiprojektit;
                                    $defer.resolve(orderedData);
                                }
                            }
                        }
                    });

                    /*
                     * Open the selected inventointiprojekti
                     */
                    $scope.selectInventointiprojekti = function(inventointiprojekti) {
                        InventointiprojektiService.fetchInventointiprojekti(inventointiprojekti.pivot.inventointiprojekti_id).then(function(inventointiprojekti) {
                            EntityBrowserService.setQuery('inventointiprojekti', inventointiprojekti.properties.id, {'arvoalue_id': $scope.arvoalue.properties.id}, $scope.arvoalue.properties.inventointiprojektit.length, $scope.arvoalue.properties.inventointiprojektit);
                            ModalService.inventointiprojektiModal(true, inventointiprojekti);
                        }, function error(data) {
                            locale.ready('error').then(function() {
                                AlertService.showError(locale.getString("error.Opening_inventory_project_failed"), AlertService.message(data));
                            })
                        });
                    };

                    /*
                     * Users
                     */
                    $scope.users = [];
                    $scope.getUsers = function() {

                        // It's inventor doing the job. We push only the inventor to the users list.
                        if ($scope.isInventor) {
                            var user = {
                                'properties' : {}
                            };
                            user.properties = UserService.getProperties().user;
                            $scope.users = [];
                            $scope.users.push(user);

                        } else {

                            if ($scope.create || ($scope.edit && $scope.users.length == 0)) {
                                UserService.getUsers({
                                    'rivit' : 1000000,
                                    'jarjestys' : 'etunimi',
                                    'aktiivinen' : 'true',
                                    'inventoijat': true
                                }).then(function success(users) {
                                    $scope.users = users.features;
                                }, function error(data) {
                                    locale.ready('error').then(function() {
                                        AlertService.showError(locale.getString("error.Getting_inventor_list_failed"), AlertService.message(data));
                                    })
                                });
                            }
                        }
                    };
                    $scope.getUsers();

                    /*
                     * If the arvoalue has physical alue (polygon, array of coordinates), get the estates located within the polygon
                     */
                    $scope.kiinteistotForMap = [];
                    $scope.getKiinteistotForArvoalue = function(addLayer, callback) {
                        if ($scope.arvoalue.geometry && $scope.arvoalue.geometry.type == 'Polygon'){ //&& $scope.arvoalue.alue != null) {
                            ArvoalueService.getKiinteistotForArvoalue($scope.arvoalue.properties.id).then(function success(data) {
                                $scope.kiinteistotForMap = data.features;

                                // Remove the existing features before adding the new ones
                                removeFeaturesFromKiinteistoLayer();

                                if ($scope.kiinteistotForMap.length > 0) {
                                    // Set the showLabel value for the estates
                                    for (var i = 0; i < $scope.kiinteistotForMap.length; i++) {
                                        $scope.kiinteistotForMap[i].properties.showLabel = true;
                                    }

                                    if (addLayer) {
                                        $scope.selectedLayers.push('Kiinteistot');
                                        MapService.selectLayer($scope.mapLayers, $scope.selectedLayers, {}, true, null, null)
                                    }

                                    var kiinteistoLayer = null;

                                    for (var i = 0; i < $scope.mapLayers.length; i++) {
                                        if ($scope.mapLayers[i].name == 'Kiinteistot') {
                                            kiinteistoLayer = $scope.mapLayers[i];
                                        }
                                    }

                                    if (kiinteistoLayer != null) {
                                        for (var i = 0; i < $scope.kiinteistotForMap.length; i++) {
                                            kiinteistoLayer.source.geojson.object.features.push($scope.kiinteistotForMap[i]);
                                        }
                                    }
                                }

                                if(callback && typeof callback === "function") {
                                    $scope.getRakennuksetForMap(true);
                                }
                            }, function error(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString("error.Getting_valuearea_estates_failed"), AlertService.message(data));
                                });
                            });
                        } else {
                            $scope.kiinteistotForMap.length = 0;
                            if($scope.mapLayers) {
                                removeFeaturesFromKiinteistoLayer();
                            }
                        }
                    };

                    $scope.rakennuksetForMap = [];
                    $scope.getRakennuksetForMap = function(calledAsCallback) {
                        $scope.rakennuksetForMap.length = 0;
                        if($scope.kiinteistotForMap.length == 0 || !calledAsCallback) {
                            $scope.getKiinteistotForArvoalue(false, $scope.getRakennuksetForMap());
                        } else {
                            var rakennusLayer = null;

                            for (var i = 0; i < $scope.mapLayers.length; i++) {
                                if ($scope.mapLayers[i].name == 'Rakennukset') {
                                    rakennusLayer = $scope.mapLayers[i];
                                }
                            }

                            for(var i = 0; i<$scope.kiinteistotForMap.length; i++) {
                                var k = $scope.kiinteistotForMap[i];
                                var rakennusPromise = KiinteistoService.getRakennuksetOfKiinteisto(k.properties.id);
                                rakennusPromise.then(function(data) {
                                    for(var i = 0; i<data.length; i++) {
                                        $scope.rakennuksetForMap.push(data[i]);
                                    }

                                    if (rakennusLayer != null) {
                                        for (var i = 0; i < $scope.rakennuksetForMap.length; i++) {
                                            rakennusLayer.source.geojson.object.features.push($scope.rakennuksetForMap[i]);
                                        }
                                    }

                                    $scope.fixLayerOrder();
                                });
                            }
                        }
                    };
                    /*
                     * Removes the features from the kiinteisto layer by setting the source.geojson.object.features.length to 0
                     */
                    function removeFeaturesFromKiinteistoLayer() {
                        var kiinteistoLayer = null;

                        for (var i = 0; i < $scope.mapLayers.length; i++) {
                            if ($scope.mapLayers[i].name == 'Kiinteistot') {
                                kiinteistoLayer = $scope.mapLayers[i];
                                kiinteistoLayer.zIndex = 1000;
                            }
                        }

                        if (kiinteistoLayer != null) {
                            kiinteistoLayer.source.geojson.object.features.length = 0;
                        }
                    }
                    ;

                    if (existing) {
                        $scope.getKiinteistotForArvoalue(true);
                    }

                    /*
                     * Add a new suojelutieto
                     */
                    $scope.addSuojelutieto = function() {
                        var s = {
                            'suojelutyyppi_id' : null,
                            'suojelutyyppi' : {
                                'id' : null,
                                'suojelutyyppi_ryhma_id' : null,
                                'suojelutyyppi' : {
                                    'id' : null
                                }
                            }
                        };
                        $scope.arvoalue.properties.suojelutiedot.push(s);
                    }

                    /*
                     * Remove a suojelutieto
                     */
                    $scope.deleteSuojelutieto = function(index) {
                        $scope.arvoalue.properties.suojelutiedot.splice(index, 1);
                    }

                    $scope.kunnat = [];
                    KuntaService.getKunnat().then(function(data) {
                        for (var i = 0; i < data.features.length; i++) {
                            var k = {
                                'id' : data.features[i].properties.id,
                                'nimi' : data.features[i].properties.nimi,
                                'nimi_se' : data.features[i].properties.nimi_se,
                                'kuntanumero' : data.features[i].properties.kuntanumero
                            };
                            $scope.kunnat.push(k);
                        }
                    });

                    /*
                     * kunta has been changed, update kunta name and kyla selections
                     */
                    $scope.kuntaChanged = function(index) {
                        $scope.updateKylat(index);
                    };

                    /*
                     * update kyla selections of kylaselector at specified index
                     */
                    $scope.updateKylat = function(index) {
                        if (!$scope.alueKylaKuntaSelections[index].kunta) {
                            $scope.alueKylaKuntaSelections[index].kylaOptions.length = 0;
                            return;
                        }

                        var kuntaId = $scope.alueKylaKuntaSelections[index].kunta.id;
                        var params = {
                            'rivit' : 1000000,
                            'jarjestys' : 'nimi'
                        }
                        var promise = KuntaService.getKylatOfKunta(kuntaId, params);
                        var callback = kylaOptionsCallBackCreator(index);

                        promise.then(callback, function(data) {
                            locale.ready('common').then(function() {
                                AlertService.showError(locale.getString('kyla.Fetching_villages_failed'), AlertService.message(data));
                            });
                        });

                    };

                    $scope.deleteKylaKuntaSelection = function(index) {
                        $scope.alueKylaKuntaSelections.splice(index, 1);
                    }

                    // Map is added to the DOM after the modal is shown,
                    // otherwise it
                    // will not be drawn until page resize
                    $scope.showMap = false;

                    // Store permissions to arvoalue entities to scope
                    $scope.permissions = permissions;

                    $scope.showAlueModal = function(alue) {
                        AlueService.fetchAlue(alue.id).then(function success(alue) {
                            EntityBrowserService.setQuery('alue', alue.properties.id, {'arvoalue_id': $scope.arvoalue.properties.id}, 1);
                            ModalService.alueModal(true, alue);
                        }, function error(data) {
                            locale.ready('error').then(function() {
                                AlertService.showError(locale.getString("error.Opening_area_failed"), AlertService.message(data));
                            });
                        });
                    };
                    $scope.showKuntaModal = function(kunta) {
                        KuntaService.fetchKunta(kunta.id).then(function success(kunta) {
                            EntityBrowserService.setQuery('kunta', kunta.properties.id, {'arvoalue_id': $scope.arvoalue.properties.id}, 1);
                            ModalService.kuntaModal(true, kunta);
                        }, function error(data) {
                            locale.ready('error').then(function() {
                                AlertService.showError(locale.getString("error.Opening_county_failed"), AlertService.message(data));
                            });
                        });
                    };
                    $scope.showKylaModal = function(kyla) {
                        KylaService.fetchKyla(kyla.id).then(function success(kyla) {
                            EntityBrowserService.setQuery('kyla', kyla.properties.id, {'arvoalue_id': $scope.arvoalue.properties.id}, 1);
                            ModalService.kylaModal(true, kyla);
                        }, function error() {
                            locale.ready('error').then(function() {
                                AlertService.showError(locale.getString("error.Opening_village_failed"), AlertService.message(data));
                            });
                        });
                    };
                    /*
                     * OPERATIONS
                     */

                    /*
                     * Add image to the arvoalue
                     */
                    $scope.addImage = function() {
                        ModalService.imgUploadModal('arvoalue', $scope.arvoalue);
                    };

                    /*
                     * Images
                     */
                    $scope.images = [];
                    $scope.getImages = function() {
                        if ($scope.arvoalue.properties.id) {
                            FileService.getImages({
                                'jarjestys' : 'jarjestys',
                                'jarjestys_suunta' : 'nouseva',
                                'rivit' : 1000,
                                'arvoalue_id' : $scope.arvoalue.properties.id
                            }).then(function success(images) {
                                $scope.images = images.features;
                                // Kuvien määrä (directives.js)
                                $scope.kuvia_kpl = $scope.images.length;
                            }, function error(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString("error.Getting_images_failed"), AlertService.message(data));
                                });
                            });
                        }
                    };
                    $scope.getImages();

                    /*
                     * Open the selected image for viewing
                     */
                    $scope.openImage = function(image) {
                        ModalService.imageModal(image, 'arvoalue', $scope.arvoalue, $scope.permissions, $scope.images);
                    };
                    /*
                     * Open the selected file for viewing
                     */
                    $scope.openFile = function(file) {
                        ModalService.fileModal(file, 'arvoalue', $scope.arvoalue);
                    };

                    /*
                     * Files
                     */
                    $scope.files = [];
                    $scope.getFiles = function() {
                        if ($scope.arvoalue.properties.id) {
                            FileService.getFiles({
                                'rivit' : 1000,
                                'arvoalue_id' : $scope.arvoalue.properties.id
                            }).then(function success(files) {
                                $scope.files = files.features;
                                // Tiedostojen määrä (directives.js)
                                $scope.kpl_maara = $scope.files.length;
                            }, function error(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString("error.Getting_files_failed"), AlertService.message(data));
                                });
                            });
                        }
                    };
                    $scope.getFiles();

                    /*
                     * Add file to the arvoalue
                     */
                    $scope.addFile = function() {
                        ModalService.fileUploadModal('arvoalue', $scope.arvoalue);
                    };

                    /*
                     * Files were modified, fetch them again
                     */
                    $scope.$on('Tiedosto_modified', function(event, data) {
                        if ($scope.arvoalue.properties.id == data.id) {
                            $scope.getFiles();
                        }
                    });

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
                        // Asetetaan Arvoalueen tiedot alkuperäisiin arvoihin
                        for ( var property in $scope.original) {
                            if ($scope.arvoalue.hasOwnProperty(property)) {
                                $scope.arvoalue[property] = angular.copy($scope.original[property]);
                            }
                        }

                        $scope.inventointiprojektiDeleteList.length = 0;
                        // restore the point (or other feature)
                        for (var i = 0; i < $scope.mapLayers.length; i++) {
                            var mapLayer = $scope.mapLayers[i];

                            if (mapLayer.name == 'Arvoalueet') {
                                mapLayer.source.geojson.object.features.length = 0;

                                if ($scope.original.geometry) {
                                    mapLayer.source.geojson.object.features.push({
                                        type : "Feature",
                                        geometry : $scope.original.geometry
                                    });
                                }

                                break;
                            }
                        }

                        $scope.kultHistArvot = angular.copy($scope.origKultHistArvot);

                        $scope.edit = false;

                        if ($scope.drawingTool) {
                            $scope.toggleDrawingTool();
                        }

                        if ($scope.pointTool) {
                            $scope.togglePointTool();
                        }

                        $scope.getImages();


                        $scope.updateLayerData('Alueet');
                        $scope.updateLayerData('Arvoalueet');
                        $scope.updateLayerData('Kiinteistot');
                        $scope.updateLayerData('Rakennukset');
                    };

                    /*
                     * Readonly / edit mode.
                     */
                    $scope.editMode = function() {
                        $scope.edit = true;
                        $scope.getSelections();
                        $scope.getArvotusOptions();
                        $scope.getAluetyyppiOptions();
                        $scope.getSuojeluOptions();
                        $scope.getInventointiprojektit();
                        $scope.getUsers();

                        $scope.updateLayerData('Alueet');
                        $scope.updateLayerData('Arvoalueet');
                        $scope.updateLayerData('Kiinteistot');
                        $scope.updateLayerData('Rakennukset');
                    };

                    $scope.resizeIcon = "▢";

                    /*
                     * Maximize or restore the modal
                     */
                    $scope.resize = function() {
                        $scope.resizeIcon = ModalService.toggleFullScreen($scope.resizeIcon);

                        $timeout(function() {
                            $scope.map.updateSize();
                        });
                    };

                    /*
                     * Save changes
                     */
                    $scope.save = function() {
                        $scope.disableButtonsFunc();
                        $scope.arvoalue.properties.inventointiprojektiDeleteList = $scope.inventointiprojektiDeleteList;

                        // Get the alue_id
                        if ($scope.arvoalue.properties._alue) {
                            $scope.arvoalue.properties.alue_id = $scope.arvoalue.properties._alue.id;
                        }

                        // set the kunta/kyla selections in place. Actually only the kyla is important.
                        if ($scope.arvoalue.properties.kylat) {
                            $scope.arvoalue.properties.kylat.length = 0;
                        } else {
                            $scope.arvoalue.properties.kylat = [];
                        }
                        for (var i = 0; i < $scope.alueKylaKuntaSelections.length; i++) {
                            var k = $scope.alueKylaKuntaSelections[i].kyla;
                            // add also the kunta information so that it shown when going back to the view mode
                            // (not required by the backend)
                            k.kunta = $scope.alueKylaKuntaSelections[i].kunta;
                            $scope.arvoalue.properties.kylat.push(k);
                        }

                        ArvoalueService.saveArvoalue($scope.arvoalue).then(function(id) {
                            $scope.edit = false

                            if ($scope.create) {
                                $scope.arvoalue.properties["id"] = id;
                                $scope.create = false;
                            }

                            // "update" the original after successful save
                            ArvoalueService.fetchArvoalue($scope.arvoalue.properties.id).then(function success(data) {
                                $scope.arvoalue = data;

                                // Set the "sijainti" property again
                                if ($scope.arvoalue.geometry && $scope.arvoalue.geometry.type == 'Point') {
                                    if ($scope.arvoalue.geometry && $scope.arvoalue.geometry.coordinates) {
                                        $scope.lat = $scope.arvoalue.geometry.coordinates[1];
                                        $scope.lon = $scope.arvoalue.geometry.coordinates[0];
                                        $scope.arvoalue.properties["sijainti"] = $scope.lon + " " + $scope.lat;
                                    }
                                } else if ($scope.arvoalue.geometry && $scope.arvoalue.geometry.type == 'Polygon') {
                                    // The return values is array of arrays. We need to convert it to a string, otherwise BE won't accept it anymore.
                                    var coordAsString = "";
                                    for (var i = 0; i < $scope.arvoalue.geometry.coordinates[0].length; i++) {
                                        coordAsString += $scope.arvoalue.geometry.coordinates[0][i][0] + " " + $scope.arvoalue.geometry.coordinates[0][i][1] + ", ";
                                    }

                                    //Remove the last ',' from the string
                                    coordAsString = coordAsString.slice(0, -2);

                                    $scope.arvoalue.properties.alue = coordAsString;
                                }

                                $scope.original = angular.copy($scope.arvoalue);
                                // "update" the original list of selecte Kulttuurihistorialliset arvot
                                $scope.origKultHistArvot = angular.copy($scope.kultHistArvot);

                                locale.ready('valuearea').then(function() {
                                    locale.ready('common').then(function() {
                                        AlertService.showInfo(locale.getString('common.Save_ok'), locale.getString('valuearea.Valuearea_information_saved', {
                                            name : $scope.arvoalue.properties.nimi
                                        }));
                                    });
                                });
                                $rootScope.$broadcast('Arvoalue_modified', {
                                    'arvoalue' : $scope.arvoalue
                                });

                                $scope.getKiinteistotForArvoalue(false);

                                FileService.reorderImages($scope.imageIds, $scope.arvoalue.properties.id, CONFIG.ENTITY_TYPE_IDS.arvoalue).then(function success(data) {
                                    if (data != 'noreload') {
                                        // Get updated images
                                        $scope.getImages();
                                    }
                                    $scope.imageIds.length = 0;
                                }, function error(data) {
                                    locale.ready('common').then(function(data) {
                                        AlertService.showError(locale.getString('error.Image_reorder_failed'), AlertService.message(data));
                                    });

                                });

                                $scope.updateLayerData('Alueet');
                                $scope.updateLayerData('Arvoalueet');
                                $scope.updateLayerData('Kiinteistot');
                                $scope.updateLayerData('Rakennukset');
                            }, function error(data) {
                                locale.ready('common').then(function() {
                                    AlertService.showError(locale.getString('common.Error'), locale.getString('common.Reopen_view'));
                                });
                            });
                            $scope.inventointiprojektiDeleteList.length = 0;
                            $scope.disableButtonsFunc();
                        }, function error(err) {
                            locale.ready('valuearea').then(function() {
                                AlertService.showError(locale.getString("valuearea.Save_failed"), AlertService.message(data));
                            });
                            $scope.disableButtonsFunc();
                        });
                    };

                    /*
                     * Delete
                     */
                    $scope.deleteArvoalue = function(modalNameId) {
                        var conf = confirm(locale.getString('common.Confirm_delete2', {'item': $scope.arvoalue.properties.nimi}));
                        if (conf) {
                            ArvoalueService.deleteArvoalue($scope.arvoalue).then(function() {
                                $scope.close();
                                locale.ready('valuearea').then(function() {
                                    AlertService.showInfo(locale.getString('valuearea.Valuearea_deleted'));
                                });
                            }, function error(data) {
                                locale.ready('valuearea').then(function() {
                                    AlertService.showInfo(locale.getString('valuearea.Delete_failed'), AlertService.message(data));
                                });
                            });
                        }
                    };

                    /*
                     * Generate and show direct link to the item
                     */
                    $scope.popover = {
                        title : locale.getString('common.Address'),
                        content : $location.absUrl() + "?modalType=ARVOALUE&modalId=" + $scope.arvoalue.properties.id
                    };

                    /*
                     * Inventointinumero change - check the availability
                     */
                    $scope.uniqueInventointinumero = true;
                    $scope.inventointinumero_change = function() {
                        var alueId = ($scope.arvoalue.properties._alue.id ? $scope.arvoalue.properties._alue.id : $scope.arvoalue.properties.alue_id);
                        var available = ArvoalueService.checkInventointinumero(alueId, $scope.arvoalue).then(function success(data) {
                            if (data) {
                                $scope.form.inventointinumero.$setValidity('kaytossa', true);
                                $scope.uniqueInventointinumero = true;
                            } else {
                                $scope.form.inventointinumero.$setValidity('kaytossa', false);
                                $scope.uniqueInventointinumero = false;
                            }
                        }, function error(data) {
                            locale.ready('error').then(function() {
                                AlertService.showError(locale.getString("error.Validating_inventorynumber_failed"), AlertService.message(data));
                            });
                        });
                        return available;
                    };

                    $scope.selectKiinteisto = function(kiinteisto) {
                        KiinteistoService.fetchKiinteisto(kiinteisto.properties.id).then(function(kiinteisto) {
                            EntityBrowserService.setQuery('kiinteisto', kiinteisto.properties.id, {'arvoalue_id': $scope.arvoalue.properties.id}, $scope.kiinteistotForMap.length);
                            ModalService.kiinteistoModal(kiinteisto, null);
                        }, function error(data) {
                            locale.ready('estate').then(function() {
                                AlertService.showError(locale.getString('error.Opening_estate_failed'), AlertService.message(data));
                            });
                        });
                    };

                    /*
                     * Kiinteisto has been modified, fetch them again
                     */
                    $scope.$on('Kiinteisto_modified', function(event, data) {
                        $scope.getKiinteistotForArvoalue(false);
                    });

                    /*
                     * OPENLAYERS MAP
                     */

                    // if the coordinate is set, center the map on it
                    $scope.center = null;
                    if (existing) {
                        if ($scope.arvoalue.geometry) {
                            if ($scope.arvoalue.geometry.type == "Point") {
                                $scope.lat = $scope.arvoalue.geometry.coordinates[1];
                                $scope.lon = $scope.arvoalue.geometry.coordinates[0];

                                $scope.arvoalue.properties.sijainti = $scope.lon + " " + $scope.lat;
                                $scope.original.properties.sijainti = $scope.lon + " " + $scope.lat;
                            } else if ($scope.arvoalue.geometry.type == "Polygon") {
                                var approxCenter = MapService.approximatePolygonCenter($scope.arvoalue.geometry);

                                $scope.lat = approxCenter[1];
                                $scope.lon = approxCenter[0];

                                // set the alue property - otherwise, saving is impossible
                                // without redrawing the polygon
                                $scope.arvoalue.properties["alue"] = MapService.polygonToString($scope.arvoalue.geometry);
                                $scope.original.properties["alue"] = MapService.polygonToString($scope.arvoalue.geometry);
                            } else {
                                locale.ready('common').then(function() {
                                    AlertService.showError(locale.getString('common.Invalid_geometry_type'));
                                });
                                throw "arvoalueController: Unsupported geometry type: " + $scope.arvoalue.geometry.type;
                            }
                        }
                    } else if (alue && alue.geometry && alue.geometry.coordinates != null) {
                        // We're creating a new arvoalue and we arrived from alue. If the alue has geometry, center to that location automatically.
                        if (alue.geometry.type == "Point") {
                            $scope.lat = alue.geometry.coordinates[1];
                            $scope.lon = alue.geometry.coordinates[0];
                        } else if (alue.geometry.type == "Polygon") {
                            var approxCenter = MapService.approximatePolygonCenter(alue.geometry);

                            $scope.lat = approxCenter[1];
                            $scope.lon = approxCenter[0];
                        }
                    } else {
                        //Ladataan alueen arvoalueet, jos jollain näistä on sijainti, keskitetään siihen.
                        //Muuta käyttöä arvoalueille ei ole -> ei tallenneta haun sisältöä mihinkään.
                        AlueService.getArvoalueetOfAlue(alue.properties.id).then(function success(arvoalueet) {
                            for(var i = 0; i<arvoalueet.features.length; i++) {
                                var arvoalueToCenterTo = arvoalueet.features[i];

                                if(arvoalueToCenterTo.geometry && arvoalueToCenterTo.geometry.coordinates !== undefined) {
                                    if(arvoalueToCenterTo.geometry.type === "Point") {
                                        $scope.lon = alue.geometry.coordinates[0];
                                        $scope.lat = alue.geometry.coordinates[1];
                                    } else if(arvoalueToCenterTo.geometry.type === "Polygon") {
                                        var approxCenter = MapService.approximatePolygonCenter(arvoalueToCenterTo.geometry);

                                        $scope.lon = approxCenter[0];
                                        $scope.lat = approxCenter[1];
                                    }
                                    $scope.centerToLocation([$scope.lon, $scope.lat]);
                                    break;
                                }
                            }
                            //Sijaintia ei ole vieläkään, keskitetään alueen kunnan sijaintiin
                            if(!$scope.lon && !$scope.lat) {
                                if(alue['properties']['kylat'][0]['kunta']['kuntanumero'] !== undefined) { // Pitäisi löytyä aina, pakollinen tieto
                                    MapService.getNimistoDetails(alue['properties']['kylat'][0]['kunta']['kuntanumero'], 'kunta').then(function success(data) {
                                        if(data && data.data && data.data.features.length > 0) {
                                            var k = data.data.features[0];

                                            if(k.geometry.coordinates) {
                                                $scope.center.lon = k.geometry.coordinates[0];
                                                $scope.center.lat = k.geometry.coordinates[1];
                                            }
                                        }
                                    }, function error(data) {
                                        AlertService.showError(locale.getString('common.Error'), AlertService.message(data));
                                    });
                                }
                            }
                        }, function error(data) {
                            AlertService.showError(locale.getString("error.Getting_valueareas_failed"), AlertService.message(data));
                        });

                    }

                    if ($scope.lat && $scope.lon) {
                        var prj = ol.proj.transform([
                                $scope.lon, $scope.lat
                        ], 'EPSG:4326', 'EPSG:3067').map(function(c) {
                            return c.toFixed(4);
                        });

                        var lat = parseFloat(prj[1]);
                        var lon = parseFloat(prj[0]);

                        $scope.center = {
                            lat : lat,
                            lon : lon,
                            autodiscover : false,
                            bounds: []
                        };
                    }

                    /*
                     * -------------------------MAP SWITCHING------------------------------------
                     */

                    // all possible layers; shown in dropdown button
                    $scope.objectLayers = [
                            {
                                "value" : "Kiinteistot",
                                "label" : "Kiinteistöt"
                            },
                            {
                                "value" : "Rakennukset",
                                "label" : "Rakennukset"
                            },
                            {
                                "value" : "Alueet",
                                "label" : "Alueet"
                            },{
                                "value" : "Arvoalueet",
                                "label" : "Arvoalueet"
                            },
                    ];
                    /*
                     * Array for holding all of the visible layers we have for the map
                     */
                    $scope.mapLayers = [];
                    $scope.selectedMapLayers = [];

                    // layers selected for showing; note, $scope.mapLayers holds
                    // the "real" layers that are
                    // drawn on the map; these are object (feature) layers
                    $scope.selectedLayers = [];

                    /*
                     * Select alue or arvoalue layers (or both)
                     */
                    $scope.selectLayer = function() {
                        $scope.selectedLayers = MapService.selectLayer($scope.mapLayers, $scope.selectedLayers, {}, true, null, null);

                        var arvoalueLayer = null;
                        for (var i = 0; i < $scope.mapLayers.length; i++) {
                            if ($scope.mapLayers[i].name == 'Arvoalueet') {
                                arvoalueLayer = $scope.mapLayers[i];
                            }
                        }
                        $scope.updateLayerData('Arvoalueet');

                        var kiinteistoLayer = null;
                        for (var i = 0; i < $scope.mapLayers.length; i++) {
                            if ($scope.mapLayers[i].name == 'Kiinteistot') {
                                kiinteistoLayer = $scope.mapLayers[i];
                            }
                        }
                        $scope.updateLayerData('Kiinteistot');

                        var rakennusLayer = null;
                        for (var i = 0; i < $scope.mapLayers.length; i++) {
                            if ($scope.mapLayers[i].name == 'Rakennukset') {
                                rakennusLayer = $scope.mapLayers[i];
                            }
                        }
                        $scope.updateLayerData('Rakennukset');

                        var alueLayer = null;
                        for(var i = 0; i<$scope.mapLayers.length; i++) {
                            if($scope.mapLayers[i].name == 'Alueet') {
                                alueLayer = $scope.mapLayers[i];
                            }
                        }
                        $scope.updateLayerData('Alueet');

                        $scope.fixLayerOrder();
                    };

                    $scope.updateLayerData = function(layerName) {
                        var l = null;
                         for(var i = 0; i<$scope.mapLayers.length; i++) {
                             if($scope.mapLayers[i].name == layerName) {
                                 l = $scope.mapLayers[i];
                             }
                         }
                         //If we found a valid layer and it's active (=is visible), get the features for the view.
                         if(l && l.active) {
                             if(l.name == 'Alueet') {
                                 var searchObj = {};
                                 searchObj["aluerajaus"] = "" + $scope.smallerBounds[0] + " " + $scope.smallerBounds[1] + "," + $scope.smallerBounds[2] + " " + $scope.smallerBounds[3];
                                 searchObj["rivit"] = 50;

                                 var data = AlueService.getAlueet(searchObj);
                                 data.then(function(a) {
                                     l.source.geojson.object.features.length == 0;
                                     l.source.geojson.object.features = a.features;

                                     $scope.fixLayerOrder();
                                 });
                             }

                             if(l.name == 'Arvoalueet') {
                                 if($scope.edit) {
                                     var searchObj = {};
                                     searchObj["aluerajaus"] = "" + $scope.smallerBounds[0] + " " + $scope.smallerBounds[1] + "," + $scope.smallerBounds[2] + " " + $scope.smallerBounds[3];
                                     searchObj["rivit"] = 50;
                                     searchObj["alue_id"] = $scope.arvoalue.properties.alue_id;
                                     if(searchObj["alue_id"] == undefined) {
                                         searchObj["alue_id"] = $scope.arvoalue.properties._alue.id;
                                     }


                                     var data = ArvoalueService.getArvoalueet(searchObj);
                                     data.then(function(a) {
                                         l.source.geojson.object.features.length == 0;

                                             //Poistetaan editoinnin alla oleva arvoalue listoilta
                                             for(var i = 0; i<a.features.length; i++) {
                                                 if(a.features[i].properties.id == $scope.arvoalue.properties.id) {
                                                     a.features.splice(i, 1);
                                                     break;
                                                 }
                                             }


                                         if($scope.arvoalue.geometry && $scope.arvoalue.geometry.coordinates.length > 0) {
                                             //Laitetaan nykyinen sijainti mukaan
                                             var feat = {
                                                     type : "Feature",
                                                     geometry : $scope.arvoalue.geometry,
                                                     properties: $scope.arvoalue.properties
                                             }
                                             a.features.push(feat);
                                         }

                                         l.source.geojson.object.features = a.features;

                                         $scope.fixLayerOrder();
                                     });
                                 } else {
                                     if (l != null && $scope.arvoalue.geometry.coordinates.length > 0) {
                                             l.source.geojson.object.features.length = 0;
                                             l.source.geojson.object.features.push($scope.arvoalue);

                                             $scope.fixLayerOrder();
                                     }
                                 }
                             }

                             if(l.name == 'Kiinteistot') {
                                 if($scope.edit) {
                                     var searchObj = {};
                                     searchObj["aluerajaus"] = "" + $scope.smallerBounds[0] + " " + $scope.smallerBounds[1] + "," + $scope.smallerBounds[2] + " " + $scope.smallerBounds[3];
                                     searchObj["rivit"] = 50;

                                     var data = KiinteistoService.getKiinteistot(searchObj);
                                     data.then(function(a) {
                                         l.source.geojson.object.features.length == 0;
                                         l.source.geojson.object.features = a.features;

                                         $scope.fixLayerOrder();
                                     });
                                 } else {
                                     if (l != null && $scope.kiinteistotForMap) {
                                         if($scope.kiinteistotForMap.length == 0) {
                                             $scope.getKiinteistotForArvoalue(true);
                                         }else {
                                             l.source.geojson.object.features = $scope.kiinteistotForMap;

                                             $scope.fixLayerOrder();
                                         }
                                     }
                                 }
                             }


                             if(l.name == 'Rakennukset') {
                                 if($scope.edit) {
                                     var searchObj = {};
                                     searchObj["aluerajaus"] = "" + $scope.smallerBounds[0] + " " + $scope.smallerBounds[1] + "," + $scope.smallerBounds[2] + " " + $scope.smallerBounds[3];
                                     searchObj["rivit"] = 50;

                                     var data = RakennusService.getRakennukset(searchObj);
                                     data.then(function(a) {
                                         l.source.geojson.object.features.length == 0;
                                         l.source.geojson.object.features = a.features;

                                         $scope.fixLayerOrder();
                                     });
                                 } else {
                                     if (l != null && $scope.rakennuksetForMap) {
                                         if($scope.rakennuksetForMap.length == 0) {
                                             $scope.getRakennuksetForMap(true);
                                             $scope.fixLayerOrder();
                                         } else {
                                             l.source.geojson.object.features = $scope.rakennuksetForMap;

                                             $scope.fixLayerOrder();
                                         }
                                     }
                                 }
                             }
                         }
                    };

                    /*
                     * After selecting the map layers (the base layers) the ordering of the maps are broken. (object layer e.g. Kiinteistot are under the recently selected layer causing the pointer to be hidden. This method removes the object layers, loads the map layers again and then resets the
                     * object layers causing them to be always to top ones.
                     */
                    $scope.fixLayerOrder = function() {
                        // Timeout is essential here, without it this doesn't work.
                        if ($scope.map == null) {
                            olData.getMap($scope.mapId).then(function(map) {
                                $scope.map = map;
                                $timeout(function() {
                                    MapService.fixZIndexes($scope.map.getLayers());
                                });
                            });
                        } else {
                            $timeout(function() {
                                MapService.fixZIndexes($scope.map.getLayers());
                            });
                        }
                    };

                    /*
                     * Select a base map layer
                     */
                    $scope.selectMapLayer = function(initial) {
                        // Hack: for some reason this doesn't work on the first time for the WMTS layers...
                        $scope.selectedMapLayers = MapService.selectBaseLayer($scope.mapLayers, $scope.selectedMapLayers);
                        $scope.selectedMapLayers = MapService.selectBaseLayer($scope.mapLayers, $scope.selectedMapLayers);

                        // For some reason the layer zIndexes are not working correctly
                        // We need to set them manually after changing the maplayers. Otherwise the
                        // object layers are under the tile layers
                        $scope.fixLayerOrder();

                        if(!initial) {
                            // Update the user's map layer preferences
                            if ($scope.selectedMapLayers.length > 0) {
                                var arrayOfLayers = [];
                                for (var i = 0; i < $scope.selectedMapLayers.length; i++) {

                                    arrayOfLayers.push($scope.selectedMapLayers[i].nimi);
                                }

                                MapService.setUserLayers(arrayOfLayers);
                            }
                        }

                      //Add viewParams filtering to the layer
                        for (var i = 0; i < $scope.mapLayers.length; i++) {
                            var l = $scope.mapLayers[i];
                            if (l.name == 'POHJAKARTTA_MIP arvoalueet') {
                                l.source.params['viewparams'] ='arvoalue_id:'+ $scope.arvoalue.properties.id;
                            }
                        }
                    };

                    /*
                     * Select the default layer after the available layers are loaded
                     */
                    function selectDefaultLayer(layers) {
                        //Get the users layer preferences and select them automatically.
                        var userLayers = MapService.getUserLayers();

                        for(var i = 0; i < userLayers.length; i++) {
                            for(var j = 0; j< layers.length; j++) {
                                if(userLayers[i] == layers[j].properties.nimi) {
                                    $scope.selectedMapLayers.push(layers[j].properties);
                                }
                            }
                        }


                        $scope.selectMapLayer(true);
                    }
                    ;

                    /*
                     * Get available base layers. After they are loaded, set the "default" layer and show the kiinteisto layer also (as we're in the kiinteisto page)
                     */
                    MapService.getAvailableMapLayers().then(function success(layers) {
                        $scope.availableMapLayers = layers;

                        selectDefaultLayer(layers);
                        // Add default layer (alueet)
                        $scope.selectedLayers.push('Arvoalueet');
                        $scope.selectedLayers = MapService.selectLayer($scope.mapLayers, $scope.selectedLayers, {}, true, null, null);

                        /*
                         * Add arvoaluemarker, first select the layer and then set the layer source to the alue.
                         */
                        var arvoalueLayer = null;
                        for (var i = 0; i < $scope.mapLayers.length; i++) {
                            if ($scope.mapLayers[i].name == 'Arvoalueet') {
                                arvoalueLayer = $scope.mapLayers[i];
                            }
                        }

                        if (arvoalueLayer != null && $scope.arvoalue.geometry.coordinates.length > 0) {
                            arvoalueLayer.source.geojson.object.features.push($scope.arvoalue);
                        }
                    });

                    /*
                     * -----------------MAP SWITCHING END-------------------------
                     */

                    if ($scope.center != null) {
                        angular.extend($scope, MapService.map($scope.mapLayers, $scope.center, MapService.getUserZoom()));
                    } else {
                        angular.extend($scope, MapService.map($scope.mapLayers, undefined, MapService.getUserZoom()));
                    }

                    // olData.getMap() will return a different map after a modal
                    // with a map is opened;
                    // therefore, we must store the original
                    if ($scope.map == null) {
                        olData.getMap($scope.mapId).then(function(map) {
                            $scope.map = map;
                        });
                    }

                    /*
                     * Watch zoom level changes and save the zoom to the MapService.
                     */
                    $scope.$watch('center.zoom', function(zoom) {
                        MapService.setUserZoom(zoom);
                    });

                    // Move handler of the map. Make the pointer appropriate.
                    // Show popup on mouseover. (TODO: how to make it work in fullscreen mode?)
                    $scope.$on('openlayers.map.pointermove', function(event, data) {
                        $scope.$apply(function() {
                            if ($scope.map) {
                                var map = $scope.map;

                                if (!$scope.edit) {
                                    var pixel = map.getEventPixel(data.event.originalEvent);

                                    var layerHit = null;
                                    var featureHit = map.forEachFeatureAtPixel(pixel, function(feature, layer) {
                                        layerHit = layer;
                                        map.getTarget().style.cursor = 'pointer';
                                        return feature;
                                    });

                                    if (typeof featureHit === 'undefined') {
                                        MapService.hideMapPopup($scope.mapPopupId);
                                        map.getTarget().style.cursor = 'move';
                                        return;
                                    } else {
                                        MapService.showMapPopup($scope.mapPopupId, data, featureHit, layerHit, true);
                                    }
                                } else {
                                    MapService.hideMapPopup($scope.mapPopupId);

                                    if ($scope.drawingTool || $scope.pointTool) {
                                        map.getTarget().style.cursor = 'pointer';
                                    } else {
                                        map.getTarget().style.cursor = 'move';
                                    }
                                }
                            }
                        });
                    });

                    // Click handler of the map. Set a point
                    // if the appropriate tool is active.
                    $scope.$on('openlayers.map.singleclick', function(event, data) {
                        // ...but only in edit mode.
                        if ($scope.edit && $scope.pointTool) {
                            // perform a transform to get understandable
                            // coordinates
                            var prj = ol.proj.transform([
                                    data.coord[0], data.coord[1]
                            ], data.projection, 'EPSG:4326').map(function(c) {
                                return c.toFixed(8);
                            });

                            var lat = parseFloat(prj[1]);
                            var lon = parseFloat(prj[0]);

                            for (var i = 0; i < $scope.mapLayers.length; i++) {
                                var mapLayer = $scope.mapLayers[i];
                                if (mapLayer.name == 'Arvoalueet') {
                                    mapLayer.source.geojson.object.features.length = 0;

                                    mapLayer.source.geojson.object.features.push({
                                        type : "Feature",
                                        geometry : {
                                            type : "Point",
                                            coordinates : [
                                                    lon, lat
                                            ]
                                        },
                                        properties: $scope.arvoalue.properties
                                    });

                                    break;
                                }
                            }

                            //Päivitetään arvoalueen geometriat ajantasalle.
                            $scope.arvoalue.geometry = mapLayer.source.geojson.object.features[0].geometry;

                            if (!$scope.arvoalue.properties) {
                                $scope.arvoalue.properties = {
                                    sijainti : null
                                };
                            }

                            // update arvoalue properties as well, as
                            // those are what we POST or PUT
                            $scope.arvoalue.properties["sijainti"] = lon + " " + lat;

                            // clear the area (if any) so it is
                            // not POSTed or PUT
                            $scope.arvoalue.properties["alue"] = null;

                            // disengage point setting!
                            $scope.togglePointTool();

                            // Hae muut arvoalueet uudelleen (ylempi length = 0 poistaa ne)
                            $scope.updateLayerData('Arvoalueet');

                            // used to force the map to redraw
                            $scope.$apply();
                        } else if (!$scope.edit) {
                            if ($scope.map) {
                                var map = $scope.map;
                                var pixel = map.getEventPixel(data.event.originalEvent);
                                var layerHit = null;
                                var featureHit = map.forEachFeatureAtPixel(pixel, function(feature, layer) {
                                    layerHit = layer;
                                    return feature;
                                });
                                if (typeof featureHit !== 'undefined') {
                                    if (layerHit.getProperties().name == 'Kiinteistot') {
                                        KiinteistoService.fetchKiinteisto(featureHit.getProperties().id).then(function(kiinteisto) {
                                            EntityBrowserService.setQuery('kiinteisto', kiinteisto.properties.id, {'arvoalue_id': $scope.arvoalue.properties.id}, $scope.kiinteistotForMap.length);
                                            ModalService.kiinteistoModal(kiinteisto, null);
                                        }, function error(data) {
                                            locale.ready('estate').then(function() {
                                                AlertService.showError(locale.getString('error.Opening_estate_failed'), AlertService.message(data));
                                            });
                                        });
                                    }
                                }
                            }
                        }
                    });

                    // Drawing vector source (to be set later)
                    $scope.drawingSource = null;

                    // Drawing layer (to be set later)
                    $scope.drawingLayer = null;

                    // Drawing interaction (to be set later)
                    $scope.drawInteraction = null;

                    // Make drawing work!
                    olData.getMap($scope.mapId).then(function(map) {
                        /* Initialize drawing vector source */
                        $scope.drawingSource = new ol.source.Vector({
                            useSpatialIndex : false
                        });

                        /* Initialize drawing layer */
                        $scope.drawingLayer = new ol.layer.Vector({
                            source : $scope.drawingSource
                        });

                        map.addLayer($scope.drawingLayer);

                        /* Initialize the drawing interaction */
                        $scope.drawInteraction = new ol.interaction.Draw({
                            source : $scope.drawingSource,
                            type : 'Polygon'
                        });

                        // default the draw interaction to inactive
                        $scope.drawInteraction.setActive(false);
                        map.addInteraction($scope.drawInteraction);

                        // stop drawing after a feature is finished
                        $scope.drawingSource.on('addfeature', function(event) {
                            $scope.toggleDrawingTool();
                        });

                        $scope.drawInteraction.on('drawstart', function(event) {
                            // unused atm
                        }, this);

                        $scope.drawInteraction.on('drawend', function(event) {
                            // find the correct layer to append the newly drawn feature to
                            for (var i = 0; i < $scope.mapLayers.length; i++) {
                                var mapLayer = $scope.mapLayers[i];

                                // it's this one
                                if (mapLayer.name == 'Arvoalueet') {
                                    // clear the layer
                                    mapLayer.source.geojson.object.features.length = 0;

                                    //Ladataan muut arvoalueet mukaan myös
                                    $scope.updateLayerData('Arvoalueet');

                                    // featureCoordArray will have the
                                    // coordinates in GeoJSON format,
                                    // propsCoords will have them in a "flat"
                                    // string
                                    var featureCoordArray = [], propsCoords = "";

                                    // get the coordinates of the new feature, convert and store them
                                    for (var i = 0; i < event.feature.getGeometry().flatCoordinates.length; i += 2) {
                                        var lonlat = MapService.epsg3067ToEpsg4326(event.feature.getGeometry().flatCoordinates[i], event.feature.getGeometry().flatCoordinates[i + 1]);
                                        featureCoordArray.push(lonlat);

                                        if (i > 0) {
                                            propsCoords += ","
                                        }
                                        propsCoords += lonlat[0];
                                        propsCoords += " " + lonlat[1];
                                    }

                                    var geometry = {
                                        type : "Polygon",
                                        coordinates : [
                                            featureCoordArray
                                        ]
                                    };

                                    // create the feature for the map layer
                                    var feature = {
                                        type : "Feature",
                                        geometry : {
                                            type : "Polygon",
                                            coordinates : [
                                                featureCoordArray
                                            ]
                                        },
                                        properties: $scope.arvoalue.properties
                                    }

                                    // add the newly drawn feature to the correct layer
                                    mapLayer.source.geojson.object.features.push(feature);

                                    // set the coordinates so that they are POSTed or PUT
                                    $scope.arvoalue.properties["alue"] = propsCoords;

                                    // clear the point coordinates, if any, so they are not
                                    // POSTed or PUT
                                    $scope.arvoalue.properties["sijainti"] = null;

                                    // store the geometry, too
                                    $scope.arvoalue.geometry = geometry;

                                    // clear the drawing source when practical
                                    $timeout(function() {
                                        $scope.drawingSource.clear();
                                    });

                                    break;
                                }
                            }

                            $scope.$apply();
                        });
                    });

                    // is the drawing tool active or not? Defaults to not
                    $scope.drawingTool = false;

                    // function for toggling the above + the interaction
                    $scope.toggleDrawingTool = function() {
                        if ($scope.pointTool) {
                            $scope.togglePointTool();
                        }

                        $timeout(function() {
                            $scope.drawingTool = !$scope.drawingTool;
                            $scope.drawInteraction.setActive($scope.drawingTool);
                        });
                    };

                    // is the point setting tool active or not? Defaults to not
                    $scope.pointTool = false;

                    // function for toggling the above
                    $scope.togglePointTool = function() {
                        if ($scope.drawingTool) {
                            $scope.toggleDrawingTool();
                        }

                        $timeout(function() {
                            $scope.pointTool = !$scope.pointTool;
                        });
                    };

                    $scope.deletePoint = function() {
                        for (var i = 0; i < $scope.mapLayers.length; i++) {
                            var mapLayer = $scope.mapLayers[i];
                            if (mapLayer.name == 'Arvoalueet') {
                                mapLayer.source.geojson.object.features.length = 0;

                                break;
                            }
                        }

                        $scope.arvoalue.geometry.coordinates.length = 0;
                        $scope.arvoalue.properties.sijainti = null;
                        $scope.arvoalue.properties.alue = null;
                    };

                    /*
                     * Center the map to the location of the area
                     */
                    $scope.centerToLocation = function(coord) {
                        var tmpCoord = [];
                        if (coord) {
                            tmpCoord = coord;
                        } else {
                            if ($scope.arvoalue.properties.sijainti) {
                                tmpCoord = $scope.arvoalue.properties.sijainti.split(" ");
                            } else if ($scope.arvoalue.properties.alue) {
                                tmpCoord = MapService.approximatePolygonCenter($scope.arvoalue.geometry);
                            }
                        }
                        if (tmpCoord) {
                            var coord = tmpCoord;
                            // Transform the coordinates of the estate
                            var prj = ol.proj.transform([
                                    coord[0], coord[1]
                            ], 'EPSG:4326', 'EPSG:3067').map(function(c) {
                                return c.toFixed(4);
                            });

                            var lat = parseFloat(prj[1]);
                            var lon = parseFloat(prj[0]);

                            // Center the map to the coordinates
                            $scope.center.lat = lat;
                            $scope.center.lon = lon;

                        }
                    };

                    /*
                     * Autodiscover to the client's location
                     */
                    $scope.autodiscover = function() {
                        $scope.center.autodiscover = true;
                    };

                    // to ease drawing when in full screen mode, add a keyboard shortcut
                    hotkeys.bindTo($scope).add({
                        combo : 'p',
                        description : 'Piirtomoodi',
                        callback : function() {
                            if ($scope.edit) {
                                $scope.toggleDrawingTool();
                            }
                        }
                    });

                    // to ease point setting when in full screen mode, add a keyboard
                    // shortcut
                    hotkeys.bindTo($scope).add({
                        combo : 'a',
                        description : 'Pisteen asetus',
                        callback : function() {
                            if ($scope.edit) {
                                $scope.togglePointTool();
                            }
                        }
                    });

                    $scope.showMap = true;

                    /*
                     * Drag & drop for the image functionality
                     */
                    $scope.dragControlListeners = {
                        orderChanged : function(event) {
                            $scope.reorderImages();
                        }
                    };
                    /*
                     * Images were modified, fetch them again
                     */
                    $scope.$on('Kuva_modified', function(event, data) {
                        if ($scope.arvoalue.properties.id == data.id) {
                            $scope.getImages();
                        }
                    });

                    /*
                     * OSOITE JA NIMISTÖHAKU
                     */

                    /*
                     * Search and geolocate addresses and places
                     */
                    $scope.addresses = []; // Holder for the addresses we geolocate
                    $scope.nimistot = []; // Holder for the places we geolocate

                    /*
                     * Perform search based on the given address
                     */
                    $scope.geolocate = function(addr) {
                        MapService.getOsoiteDetails(addr).then(function success(data) {
                            $scope.addresses = data.data.features;
                        }, function error(data) {
                            AlertService.showError(locale.getString('common.Error'), AlertService.message(data));
                        });
                    };

                    /*
                     * Perform search based on the given place name
                     */
                    $scope.geolocateNimisto = function(nimi) {
                        MapService.getNimistoDetails(nimi).then(function success(data) {
                            $scope.nimistot = data.data.features;
                        }, function error(data) {
                            AlertService.showError(locale.getString('common.Error'), AlertService.message(data));
                        });
                    };

                    /*
                     * Move the map upon selecting an option
                     */
                    $scope.$on('$typeahead.select', function(event, value, index, elem) {
                        var coord = value.geometry.coordinates;

                        $scope.center.lat = coord[1];
                        $scope.center.lon = coord[0];

                        $scope.showMarker($scope.center.lon, $scope.center.lat, value);
                    });

                    //Remove existing marker(s)
                    $scope.clearMarker = function() {
                        $scope.markers.length = 0;
                    };

                    //Coordinates (lon, lat) and object containing the label information
                    $scope.showMarker = function(lon, lat, obj) {
                        //Clear old marker(s)
                        $scope.clearMarker();

                        //Convert the coordinates to 4326 projection
                        var epsg4326Coords = MapService.epsg3067ToEpsg4326(lon, lat);

                        var label = "";
                        if(obj.properties.osoite !== undefined) {
                            label = obj.properties.osoite;
                        } else if(obj.properties.formatted_data !== undefined) {
                            label = obj.properties.formatted_data;
                        }

                        // Add marker to the position
                        $scope.markers.push({
                            label : label,
                            lon : epsg4326Coords[0],
                            lat : epsg4326Coords[1]
                        });
                    };
                    /*
                     * OSOITE JA NIMISTÖHAKU END
                     */

                    /*
                     * Reorder the images Set the primary image - Maybe no need to be a separate method, if the nro 1 image is always the same
                     */
                    $scope.imageIds = [];
                    $scope.reorderImages = function() {
                        $scope.imageIds.length = 0;
                        for (var i = 0; i < $scope.images.length; i++) {
                            $scope.imageIds.push($scope.images[i].properties.id);
                        }
                    };

                    /*
                     * Column name translation helper
                     */
                    $scope.getColumnName = function(column) {
                        return ListService.getColumnName(column);
                    };

                    $scope.showMuutoshistoria = function() {
                        MuutoshistoriaService.getArvoalueMuutosHistoria($scope.arvoalue.properties.id).then(function(historia) {
                            ModalService.arvoalueMuutoshistoriaModal(historia, $scope.arvoalue.properties.nimi);
                        });
                    };



                    $scope.boundsLonLat = [];
                    $scope.smallerBounds = [];

                    // map's bounds in EPSG:4326 coordinates; do feature search
                    // when these change (when the map center is moved or the
                    // zoom level changes)
                    $scope.$watch("center.bounds", function(newValue, oldValue) {
                        if (newValue) {
                            if (!isNaN(newValue[0])) {
                                $scope.boundsLonLat[0] = MapService.epsg3067ToEpsg4326($scope.center.bounds[0], $scope.center.bounds[1])[0];
                                $scope.boundsLonLat[1] = MapService.epsg3067ToEpsg4326($scope.center.bounds[0], $scope.center.bounds[1])[1];
                                $scope.boundsLonLat[2] = MapService.epsg3067ToEpsg4326($scope.center.bounds[2], $scope.center.bounds[3])[0];
                                $scope.boundsLonLat[3] = MapService.epsg3067ToEpsg4326($scope.center.bounds[2], $scope.center.bounds[3])[1];

                                // approximate the area that is actually shown to
                                // the user; the map's bounds are larger than the
                                // viewport
                                $scope.smallerBounds[0] = $scope.boundsLonLat[0] + (0.03 * ($scope.boundsLonLat[2] - $scope.boundsLonLat[0]));
                                $scope.smallerBounds[1] = $scope.boundsLonLat[1] + (0.15 * ($scope.boundsLonLat[3] - $scope.boundsLonLat[1]));
                                $scope.smallerBounds[2] = $scope.boundsLonLat[2] - (0.03 * ($scope.boundsLonLat[2] - $scope.boundsLonLat[0]));
                                $scope.smallerBounds[3] = $scope.boundsLonLat[3] - (0.15 * ($scope.boundsLonLat[3] - $scope.boundsLonLat[1]));


                                $scope.updateLayerData('Alueet');
                                $scope.updateLayerData('Arvoalueet');
                                $scope.updateLayerData('Kiinteistot');
                                $scope.updateLayerData('Rakennukset');

                            }
                        }

                    });

                    /*
                     * Käydään läpi kaikki suojelutiedot, ja jos yhdenkin tyyppi on asettamatta, palautetaan false
                     */
                    $scope.validateSuojelutyypit = function() {
                        for(var i = 0; i<$scope.arvoalue.properties.suojelutiedot.length; i++) {
                            var s = $scope.arvoalue.properties.suojelutiedot[i];
                            if(s.suojelutyyppi.id == null) {
                                return false;
                            }
                        }
                        return true;
                    }

                    /*
                     * Tason järjestyksen ja läpinäkyvyyen tallennus MapService:lle.
                     * zIndex ja opacity.
                     */
                    $scope.tallennaTasot = function(editLayer) {
                    	// Valittuna olevat tasot
                    	var layers = $scope.map.getLayers();
                    	// Välitetään muokatun maplayerin tiedot palvelulle, joka huolehtii arvojen säilyttämisen
                    	MapService.storeUserMapLayerValues(layers, editLayer);

                        locale.ready('common').then(function() {
                            AlertService.showInfo(locale.getString('common.Save_ok'));
                        });
                    };
                }
        ]);
