/*
 * Controller for inventointiprojekti entities.
 */
angular.module('mip.inventointiprojekti').controller(
        'InventointiprojektiController',
        [
                '$scope', 'TabService', '$location', '$filter', 'InventointiprojektiService', 'CONFIG', 'existing', 'AlertService', 'KiinteistoService', 'RakennusService',
                'AlueService', 'ArvoalueService', 'KylaService', 'ModalService', 'NgTableParams', 'ListService', 'inventointiprojekti', 'locale', '$rootScope', 'MapService',
                'olData', 'permissions', 'Auth', 'UserService', 'KuntaService', '$timeout', 'MuutoshistoriaService', 'EntityBrowserService', 'selectedModalNameId',
                function($scope, TabService, $location, $filter, InventointiprojektiService, CONFIG, existing, AlertService, KiinteistoService, RakennusService,
                        AlueService, ArvoalueService, KylaService, ModalService, NgTableParams, ListService, inventointiprojekti, locale, $rootScope, MapService,
                        olData, permissions, Auth, UserService, KuntaService, $timeout, MuutoshistoriaService, EntityBrowserService, selectedModalNameId) {
                     // map id fetching
                    var _mapId = $rootScope.getNextMapId();
                    $scope.mapId = "inventointiprojektiMap" + _mapId;
                    $scope.mapPopupId = "inventointiprojektiMapPopup" + _mapId;
                    $scope.resizeIcon = "▢";

                    var extent = null; //Used to center the map to the area of the features

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

                    // will be set to true later if appropriate
                    $scope.showCreateNewButton = false;
                    $scope.isPaakayttaja = false;
                    // Used to force the inventoija users to set the inventointiprojekti before the saving is allowed
                    $scope.userRole = UserService.getProperties().user.rooli;

                    /*
                     * Is the user paakayttaja or not (allow adding users and show the create new button)? We can't use the permission check for the users, as everyone has permission to get the users, but only paakayttaja has permission to see them in this view and open the user's properties
                     */
                    $scope.isPaakayttajaFunc = function() {
                        // Get only the inventor's inventory projects
                        var role = $filter('uppercase')($scope.userRole);

                        angular.forEach(CONFIG.ROLES.PROJECT, function(value, key) {
                            // Below is the U+1F44D way to check. Here is a hack U+1F644
                            if (value == 5 && role == key || value == 5 && role == 'PÄÄKÄYTTÄJÄ') {
                                $scope.isPaakayttaja = true;
                                $scope.showCreateNewButton = true;
                            }
                        });
                    };
                    $scope.isPaakayttajaFunc();

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

                    // Get the inventointiprojekti that was selected (if
                    // any; will be
                    // empty if creating a new one)
                    // Add a holder for the ajanjakso, as we need the controls visible in the UI
                    if (inventointiprojekti) {
                        $scope.inventointiprojekti = inventointiprojekti;
                        if (!$scope.inventointiprojekti.properties.ajanjakso || $scope.inventointiprojekti.properties.ajanjakso.length == 0) {
                            var tmpInventointiajanjakso = {
                                alkupvm : null,
                                loppupvm : null
                            };
                            $scope.inventointiprojekti.properties.ajanjakso = [];
                            $scope.inventointiprojekti.properties.ajanjakso.push(tmpInventointiajanjakso);
                        }

                        // Set the tyyppi_id correctly as we get different variable from the BE
                        if($scope.inventointiprojekti.properties.inventointiprojektityyppi) {
                            $scope.inventointiprojekti.properties.tyyppi_id = $scope.inventointiprojekti.properties.inventointiprojektityyppi.id;
                        }
                        // Set the laji_id correctly as we get different variable from the BE
                        if($scope.inventointiprojekti.properties.inventointiprojektilaji) {
                            $scope.inventointiprojekti.properties.laji_id = $scope.inventointiprojekti.properties.inventointiprojektilaji.id;
                        }
                    } else {
                        existing = false;
                        $scope.inventointiprojekti = {
                            'properties' : {
                                'ajanjakso' : [],
                                'kunnat' : []
                            }
                        };
                        var tmpInventointiajanjakso = {
                            alkupvm : null,
                            loppupvm : null
                        };
                        $scope.inventointiprojekti.properties.ajanjakso.push(tmpInventointiajanjakso);

                        // Set the default type
                        $scope.inventointiprojekti.properties.tyyppi_id = 2;

                        // Set the default laji
                        $scope.inventointiprojekti.properties.laji_id = 1;
                    }

                    // Holder for the added inventor
                    $scope.tmp_inventoija = {};
                    // Store the original inventointiprojekti for possible
                    // cancel operation
                    $scope.original = angular.copy($scope.inventointiprojekti);

                    // existing = true when viewing an existing property
                    // false when creating a new one
                    if (!existing) {
                        $scope.edit = true;
                        $scope.create = true;
                    }

                    // Store permissions to inventointiprojekti entities to scope
                    $scope.permissions = permissions;

                    // Fetch permissions to view other entities (kyla, rakennus, alue, arvoalue, kiinteisto) separately
                    // and set them as they become available to prevent this modal from taking forever to open...
                    $scope.showKylat = false;
                    $scope.showRakennukset = false;
                    $scope.showAlueet = false;
                    $scope.showArvoalueet = false;
                    $scope.showKiinteistot = false;
                    $scope.showInventoijat = false;

                    /*
                     * Totals for each entity type
                     */
                    $scope.kiinteistoTotal = 0;
                    $scope.rakennusTotal = 0;
                    $scope.alueTotal = 0;
                    $scope.kylaTotal = 0;
                    $scope.arvoalueTotal = 0;

                    /*
                     * Which tables are visible
                     */
                    $scope.visibleKiinteisto = true;
                    $scope.visibleKyla = false;
                    $scope.visibleRakennus = false;
                    $scope.visibleAlue = false;
                    $scope.visibleArvoalue = false;

                    /*
                     * -------------------------MAP SWITCHING------------------------------------
                     */

                    // all possible layers; shown in dropdown button
                    $scope.objectLayers = [
                            {
                                "value" : "Kiinteistot",
                                "label" : "Kiinteistöt"
                            }, {
                                "value" : "Rakennukset",
                                "label" : "Rakennukset"
                            }, {
                                "value" : "Alueet",
                                "label" : "Alueet"
                            }, {
                                "value" : "Arvoalueet",
                                "label" : "Arvoalueet"
                            }
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
                     * Select
                     */
                    $scope.selectLayer = function() {
                        $scope.selectedLayers = MapService.selectLayer($scope.mapLayers, $scope.selectedLayers, {}, true, null, null);

                        $scope.fixLayerOrder();
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
                    });


                    /*
                     * -----------------MAP SWITCHING END-------------------------
                     */

                    /*
                     * ------------------ FETCH TABLE DATA ------------------------
                     */
                    /*
                     * Kiinteistö-taulukon päivitys
                     */
                    var kiinteistoFilterParams = null;
                     $scope.updateKiinteistoTable = function(){

	                    $scope.kiinteistoTable = new NgTableParams({
	                        page : 1,
	                        count : 50,
	                        total : 25
	                    // dummy data
	                    }, {
	                        counts : [
	                                10, 25, 50, 100
	                        ],
	                        paginationMaxBlocks: 20,
	                        getData : function($defer, params) {
	                            if (!$scope.create) {
	                                Auth.checkPermissions("rakennusinventointi", "kiinteisto").then(function(permissions) {
	                                    if (permissions.katselu) {
	                                        $scope.showKiinteistot = true;

	                                        kiinteistoFilterParams = ListService.parseParameters(params);
	                                        // Kunta ja kylä suodatus
	                                        kiinteistoFilterParams = $scope.appendSearchReqParams(kiinteistoFilterParams);

	                                        InventointiprojektiService.getKiinteistotOfInventointiprojekti($scope.inventointiprojekti.properties.id, kiinteistoFilterParams).then(function(data) {
	                                            if (data && data.total_count != null) {
	                                                var orderedData = params.sorting() ? $filter('orderBy')(data.features, params.orderBy()) : data.features;
	                                                params.total(data.total_count);
	                                                $scope.kiinteistoTotal = data.total_count;

	                                                if (orderedData) {
	                                                    MapService.selectLayer($scope.mapLayers, $scope.selectedLayers, {}, true, null, null);

	                                                    setLayerSource("Kiinteistot", orderedData);

	                                                    // Set the center. We currently do not have any better way to do this.
	                                                    //If the extent has not been set OR the new extent is bigger than the earlier extent, center to the new extent.
	                                                    var kiinteistoExtent = MapService.calculateExtentOfFeatures(orderedData);

	                                                    var oldExtent = angular.copy(extent);
	                                                    extent = MapService.getBiggestExtent(extent, kiinteistoExtent);

	                                                    if(oldExtent !== extent) {
	                                                        MapService.centerToExtent($scope.map, extent);
	                                                    }
	                                                }

	                                                $defer.resolve(orderedData);
	                                            } else {
	                                                clearLayerSource("Kiinteistot");

	                                                var orderedData = [];
	                                                $scope.kiinteistoTotal = 0;

	                                                $defer.resolve(orderedData);
	                                            }
	                                        }, function(data) {
	                                            locale.ready('error').then(function() {
	                                                AlertService.showError(locale.getString("error.Getting_estates_failed"), AlertService.message(data));
	                                            });

	                                            clearLayerSource('Kiinteistot');

	                                            var orderedData = [];
	                                            $scope.kiinteistoTotal = 0;
	                                            $defer.resolve(orderedData);
	                                        });
	                                    }
	                                });
	                            }
	                        }
	                    });
                    };
                    $scope.updateKiinteistoTable();

                   /*
                    * Kylä-taulukon päivitys
                    */
                    var kylaFilterParams = null;
                    $scope.updateKylaTable = function(){

                        $scope.kylaTable = new NgTableParams({
                            page : 1,
                            count : 50,
                            total : 25
                        // dummy data
                        }, {
                            counts : [
                                    10, 25, 50, 100
                            ],
                            getData : function($defer, params) {
                                if (!$scope.create) {
                                    Auth.checkPermissions("rakennusinventointi", "kyla").then(function(permissions) {
                                        if (permissions.katselu) {
                                            $scope.showKylat = true;
                                       		var kylaIdList = "";
                                            for (var ind = 0; ind < $scope.inventointiprojekti.properties.suodatetutKylat.length; ind++) {
                                            	kylaIdList = kylaIdList + $scope.inventointiprojekti.properties.suodatetutKylat[ind].id + ',';
                                            };
                                            kylaFilterParams = ListService.parseParameters(params);
	                                        // Kunta ja kylä suodatus
                                            kylaFilterParams = $scope.appendSearchReqParams(kylaFilterParams);
                                            InventointiprojektiService.getKylatOfInventointiprojekti($scope.inventointiprojekti.properties.id, kylaFilterParams
                                            ).then(function(data) {
                                                var orderedData = params.sorting() ? $filter('orderBy')(data.features, params.orderBy()) : data.features;
                                                params.total(data.total_count);
                                                if (data.total_count) {
                                                    $scope.kylaTotal = data.total_count;
                                                } else {
                                                    $scope.kylaTotal = 0;
                                                }

                                                $defer.resolve(orderedData);
                                            }, function(data) {
                                                locale.ready('error').then(function() {
                                                    AlertService.showError(locale.getString("error.Getting_villages_failed"), AlertService.message(data));
                                                });
                                                orderedData = [];
                                                $defer.resolve(orderedData);
                                            });
                                        }
                                    });
                                }
                            }
                        });
                    };
                    $scope.updateKylaTable();

                    $scope.inventoijat = [];
                    $scope.getInventoijat = function() {
                        if ($scope.inventointiprojekti.properties.id) {
                            Auth.checkPermissions("rakennusinventointi", "inventointiprojekti").then(function(permissions) {
                                if (permissions.katselu) {
                                    InventointiprojektiService.getInventoijatOfInventointiprojekti($scope.inventointiprojekti.properties.id).then(function(data) {
                                        // If no features, the inventoijat array will be undefined and it causes problems. Therefore modify it only if we receive inventors.
                                        if (data.features) {
                                            $scope.inventoijat = data.features;
                                        }

                                    }, function(data) {
                                        locale.ready('error').then(function() {
                                            AlertService.showError(locale.getString("error.Getting_inventors_failed"), AlertService.message(data));
                                        });
                                        $scope.inventoijat = [];

                                    });
                                }
                            });
                        }
                    };
                    $scope.getInventoijat();

                    $scope.muut_inventoijat = [];
                    $scope.getMuutInventoijat = function() {
                        if ($scope.inventointiprojekti.properties.id) {
                            Auth.checkPermissions("rakennusinventointi", "inventointiprojekti").then(function(permissions) {
                                if (permissions.katselu) {
                                    InventointiprojektiService.getMuutInventoijatOfInventointiprojekti($scope.inventointiprojekti.properties.id).then(function(data) {
                                        // If no features, the inventoijat array will be undefined and it causes problems. Therefore modify it only if we receive inventors.
                                        if (data.features) {
                                            $scope.muut_inventoijat = data.features;
                                        }

                                    }, function(data) {
                                        locale.ready('error').then(function() {
                                            AlertService.showError(locale.getString("error.Getting_inventors_failed"), AlertService.message(data));
                                        });
                                        $scope.muut_inventoijat = [];

                                    });
                                }
                            });
                        }
                    };
                    $scope.getMuutInventoijat();

                    /*
                     * Alue-taulukon päivitys
                     */
                    var alueFilterParams = null
                    $scope.updateAlueTable = function(){
	                    $scope.alueTable = new NgTableParams({
	                        page : 1,
	                        count : 50,
	                        total : 25
	                    // dummy data
	                    }, {
	                        counts : [
	                                10, 25, 50, 100
	                        ],
	                        getData : function($defer, params) {
	                            if (!$scope.create) {
	                                Auth.checkPermissions("rakennusinventointi", "inventointiprojekti").then(function(permissions) {
	                                    if (permissions.katselu) {
	                                        $scope.showAlueet = true;

	                                        alueFilterParams = ListService.parseParameters(params);
	                                        // Kunta ja kylä suodatus
	                                        alueFilterParams = $scope.appendSearchReqParams(alueFilterParams);

	                                        InventointiprojektiService.getAlueetOfInventointiprojekti($scope.inventointiprojekti.properties.id, alueFilterParams).then(function(data) {
	                                            if (data && data.total_count != null) {
	                                                var orderedData = params.sorting() ? $filter('orderBy')(data.features, params.orderBy()) : data.features;
	                                                params.total(data.total_count);
	                                                $scope.alueTotal = data.total_count;

	                                                if (orderedData) {
	                                                    MapService.selectLayer($scope.mapLayers, $scope.selectedLayers, {}, true, null, null);
	                                                    setLayerSource('Alueet', orderedData);

	                                                 // Set the center. We currently do not have any better way to do this.
	                                                    //If the extent has not been set OR the new extent is bigger than the earlier extent, center to the new extent.
	                                                    var alueExtent = MapService.calculateExtentOfFeatures(orderedData)

	                                                    var oldExtent = angular.copy(extent);
	                                                    extent = MapService.getBiggestExtent(extent, alueExtent);
	                                                    if(oldExtent !== extent) {
	                                                        MapService.centerToExtent($scope.map, extent);
	                                                    }

	                                                }
	                                            } else {
	                                                clearLayerSource('Alueet');

	                                                var orderedData = [];
	                                                $scope.alueTotal = 0;
	                                            }

	                                            $defer.resolve(orderedData);
	                                        }, function(data) {
	                                            locale.ready('error').then(function() {
	                                                AlertService.showError(locale.getString("error.Getting_areas_failed"), AlertService.message(data));
	                                            });

	                                            clearLayerSource("Alueet");

	                                            var orderedData = [];
	                                            $scope.alueTotal = 0;

	                                            $defer.resolve(orderedData);
	                                        });
	                                    }
	                                });
	                            }
	                        }
	                    });
                    };
                    $scope.updateAlueTable();

                    /*
                     * Arvoalue-taulukon päivitys
                     */
                    var arvoalueFilterParams = null;
                    $scope.updateArvoalueTable = function(){
	                    $scope.arvoalueTable = new NgTableParams({
	                        page : 1,
	                        count : 50,
	                        total : 25
	                    // dummy data
	                    }, {
	                        counts : [
	                                10, 25, 50, 100
	                        ],
	                        getData : function($defer, params) {
	                            if (!$scope.create) {
	                                Auth.checkPermissions("rakennusinventointi", "inventointiprojekti").then(function(permissions) {
	                                    if (permissions.katselu) {
	                                        $scope.showArvoalueet = true;

	                                        arvoalueFilterParams = ListService.parseParameters(params);
	                                        // Kunta ja kylä suodatus
	                                        arvoalueFilterParams = $scope.appendSearchReqParams(arvoalueFilterParams);

	                                        InventointiprojektiService.getArvoalueetOfInventointiprojekti($scope.inventointiprojekti.properties.id, arvoalueFilterParams).then(function(data) {
	                                            if (data && data.total_count != null) {
	                                                var orderedData = params.sorting() ? $filter('orderBy')(data.features, params.orderBy()) : data.features;
	                                                params.total(data.total_count);
	                                                $scope.arvoalueTotal = data.total_count;

	                                                if (orderedData) {
	                                                    MapService.selectLayer($scope.mapLayers, $scope.selectedLayers, {}, true, null, null);
	                                                    setLayerSource('Arvoalueet', orderedData);

	                                                    // Set the center. We currently do not have any better way to do this.
	                                                    //If the extent has not been set OR the new extent is bigger than the earlier extent, center to the new extent.
	                                                    var aalueExtent = MapService.calculateExtentOfFeatures(orderedData)
	                                                    var oldExtent = angular.copy(extent);
	                                                    extent = MapService.getBiggestExtent(extent, aalueExtent);
	                                                    if(oldExtent !== extent) {
	                                                        MapService.centerToExtent($scope.map, extent);
	                                                    }
	                                                }
	                                            } else {
	                                                clearLayerSource("Arvoalueet")

	                                                var orderedData = [];
	                                                $scope.arvoalueTotal = 0;
	                                            }

	                                            $defer.resolve(orderedData);
	                                        }, function(data) {
	                                            locale.ready('error').then(function() {
	                                                AlertService.showError(locale.getString("error.Getting_valueareas_failed"), AlertService.message(data));
	                                            });

	                                            clearLayerSource("Arvoalueet");

	                                            var orderedData = [];
	                                            $scope.arvoalueTotal = 0;
	                                            $defer.resolve(orderedData);
	                                        });
	                                    }
	                                });
	                            }
	                        }
	                    });
                    };
                    $scope.updateArvoalueTable();

                    /*
                     * Rakennus-taulukon päivitys
                     */
                    var rakennusFilterParams = null;
                    $scope.updateRakennusTable = function(){
	                    $scope.rakennusTable = new NgTableParams({
	                        page : 1,
	                        count : 50,
	                        total : 25
	                    // dummy data
	                    }, {
	                        counts : [
	                                10, 25, 50, 100
	                        ],
	                        getData : function($defer, params) {
	                            if (!$scope.create) {
	                                Auth.checkPermissions("rakennusinventointi", "inventointiprojekti").then(function(permissions) {
	                                    if (permissions.katselu) {
	                                        $scope.showRakennukset = true;

	                                        rakennusFilterParams = ListService.parseParameters(params);
	                                        // Kunta ja kylä suodatus
	                                        rakennusFilterParams = $scope.appendSearchReqParams(rakennusFilterParams);
	                                        $scope.promise = InventointiprojektiService.getRakennuksetOfInventointiprojekti($scope.inventointiprojekti.properties.id, rakennusFilterParams).then(function(data) {
	                                            if (data && data.total_count != null) {
	                                                var orderedData = params.sorting() ? $filter('orderBy')(data.features, params.orderBy()) : data.features;
	                                                params.total(data.total_count);
	                                                $scope.rakennusTotal = data.total_count;

	                                                if (orderedData) {
	                                                    MapService.selectLayer($scope.mapLayers, $scope.selectedLayers, {}, true, null, null);
	                                                    setLayerSource('Rakennukset', orderedData);

	                                                    // Set the center. We currently do not have any better way to do this.
	                                                    //If the extent has not been set OR the new extent is bigger than the earlier extent, center to the new extent.
	                                                    var rakennusExtent = MapService.calculateExtentOfFeatures(orderedData);

	                                                    var oldExtent = angular.copy(extent);
	                                                    extent = MapService.getBiggestExtent(extent, rakennusExtent);

	                                                    if(oldExtent !== extent) {
	                                                        MapService.centerToExtent($scope.map, extent);
	                                                    }
	                                                }
	                                            } else {
	                                                clearLayerSource('Rakennukset');

	                                                var orderedData = [];
	                                                $scope.rakennusTotal = 0;
	                                            }

	                                            $defer.resolve(orderedData);
	                                        }, function(data) {
	                                            locale.ready('inventoryproject').then(function() {
	                                                AlertService.showError(locale.getString("error.Getting_buildings_failed"), AlertService.message(data));
	                                            });

	                                            clearLayerSource("Rakennukset");

	                                            var orderedData = [];
	                                            $scope.rakennusTotal = 0;

	                                            $defer.resolve(orderedData);
	                                        });
	                                    }
	                                });
	                            }
	                        }
	                    });
                    };
                    $scope.updateRakennusTable();

                    /*
                     * SELECT A ROW FROM TABLE - OPEN THE DETAILS VIEW
                     */
                    $scope.selectKiinteisto = function(kiinteisto) {
                        KiinteistoService.fetchKiinteisto(kiinteisto.properties.id).then(function(kiinteisto) {
                            var queryObj = {'inventointiprojekti_id': $scope.inventointiprojekti.properties.id,
                                    'rivi': kiinteistoFilterParams['rivi'],
                                    'rivit': kiinteistoFilterParams['rivit']};
                            if(kiinteistoFilterParams['suodata_kylat']) {
                                queryObj['suodata_kylat'] = kiinteistoFilterParams['suodata_kylat'];
                            }
                            if(kiinteistoFilterParams['suodata_kunnat']) {
                                queryObj['suodata_kunnat'] = kiinteistoFilterParams['suodata_kunnat'];
                            }

                            EntityBrowserService.setQuery('kiinteisto', kiinteisto.properties.id,
                            		queryObj, $scope.kiinteistoTable.total());
                            ModalService.kiinteistoModal(kiinteisto, null);
                        }, function error(data) {
                            locale.ready('inventoryproject').then(function() {
                                AlertService.showError(locale.getString("inventoryproject.Opening_estate_failed"), AlertService.message(data));
                            });
                        });
                    };

                    $scope.selectRakennus = function(rakennus) {
                        // open up a rakennus for viewing (Adding / removing to
                        // inv. proj is done below)
                        if (!$scope.edit) {
                            RakennusService.fetchRakennus(rakennus.properties.id).then(function(rakennus) {
                                var queryObj = {'inventointiprojekti_id': $scope.inventointiprojekti.properties.id,
                                        'rivi': rakennusFilterParams['rivi'],
                                        'rivit': rakennusFilterParams['rivit']};
                                if(rakennusFilterParams['suodata_kylat']) {
                                    queryObj['suodata_kylat'] = rakennusFilterParams['suodata_kylat'];
                                }
                                if(rakennusFilterParams['suodata_kunnat']) {
                                    queryObj['suodata_kunnat'] = rakennusFilterParams['suodata_kunnat'];
                                }

                                EntityBrowserService.setQuery('rakennus', rakennus.properties.id,
                                		queryObj, $scope.rakennusTable.total());
                                ModalService.rakennusModal(true, rakennus, null, null);
                            }, function error(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString("error.Opening_building_failed"), AlertService.message(data));
                                });
                            });
                        }
                    };

                    $scope.selectAlue = function(alue) {
                        AlueService.fetchAlue(alue.properties.id).then(function(alue) {
                            var queryObj = {'inventointiprojekti_id': $scope.inventointiprojekti.properties.id,
                                    'rivi': alueFilterParams['rivi'],
                                    'rivit': alueFilterParams['rivit']};
                            if(alueFilterParams['suodata_kylat']) {
                                queryObj['suodata_kylat'] = alueFilterParams['suodata_kylat'];
                            }
                            if(alueFilterParams['suodata_kunnat']) {
                                queryObj['suodata_kunnat'] = alueFilterParams['suodata_kunnat'];
                            }

                            EntityBrowserService.setQuery('alue', alue.properties.id,
                            		queryObj, $scope.alueTable.total());
                            ModalService.alueModal(true, alue);
                        }, function error(data) {
                            locale.ready('error').then(function() {
                                AlertService.showError(locale.getString("error.Opening_area_failed"), AlertService.message(data));
                            });
                        });
                    };

                    $scope.selectArvoalue = function(arvoalue) {
                        ArvoalueService.fetchArvoalue(arvoalue.properties.id).then(function(arvoalue) {
                            var queryObj = {'inventointiprojekti_id': $scope.inventointiprojekti.properties.id,
                                    'rivi': arvoalueFilterParams['rivi'],
                                    'rivit': arvoalueFilterParams['rivit']};
                            if(arvoalueFilterParams['suodata_kylat']) {
                                queryObj['suodata_kylat'] = arvoalueFilterParams['suodata_kylat'];
                            }
                            if(arvoalueFilterParams['suodata_kunnat']) {
                                queryObj['suodata_kunnat'] = arvoalueFilterParams['suodata_kunnat'];
                            }

                            EntityBrowserService.setQuery('arvoalue', arvoalue.properties.id,
                            		queryObj, $scope.arvoalueTable.total());
                            ModalService.arvoalueModal(true, arvoalue);
                        }, function error(data) {
                            locale.ready('error').then(function() {
                                AlertService.showError(locale.getString("error.Opening_valuearea_failed"), AlertService.message(data));
                            });
                        });
                    };

                    $scope.selectKyla = function(kyla) {
                        KylaService.fetchKyla(kyla.properties.id).then(function(kyla) {
                            var queryObj = {'inventointiprojekti_id': $scope.inventointiprojekti.properties.id,
                                    'rivi': kylaFilterParams['rivi'],
                                    'rivit': kylaFilterParams['rivit']};
                            if(kylaFilterParams['suodata_kylat']) {
                                queryObj['suodata_kylat'] = kylaFilterParams['suodata_kylat'];
                            }
                            if(kylaFilterParams['suodata_kunnat']) {
                                queryObj['suodata_kunnat'] = kylaFilterParams['suodata_kunnat'];
                            }

                            EntityBrowserService.setQuery('kyla', kyla.properties.id,
                            		queryObj, $scope.kylaTable.total());
                            ModalService.kylaModal(true, kyla);
                        }, function error(data) {
                            locale.ready('error').then(function() {
                                AlertService.showError(locale.getString("error.Opening_village_failed"), AlertService.message(data));
                            });
                        });
                    };

                    $scope.selectInventoija = function(inventoija) {
                        UserService.getUser(inventoija.properties.inventoija_id).then(function(inventoija) {
                            ModalService.userModal(inventoija);
                        }, function error(data) {
                            locale.ready('error').then(function() {
                                AlertService.showError(locale.getString("error.Opening_inventor_failed"), AlertService.message(data));
                            });
                        });
                    };

                    /*
                     * FETCH RELATED DATA, USERS, COUNTIES ETC
                     */
                    /*
                     * Users
                     */
                    $scope.kayttajat = [];
                    $scope.getUsers = function() {
                        if ($scope.create || $scope.edit) {
                            Auth.checkPermissions("rakennusinventointi", "inventointiprojekti").then(function(permissions) {
                                if (permissions.katselu) {
                                    UserService.getUsers({
                                        'rivit' : 10000000,
                                        'aktiivinen' : 'true',
                                        'inventoijat': true
                                    }).then(function success(data) {
                                        $scope.kayttajat = data.features;
                                    }, function error(data) {
                                        locale.ready('error').then(function() {
                                            AlertService.showError(locale.getString("error.Getting_users_failed"), AlertService.message(data));
                                        });
                                    });
                                }
                            }, function error(data) {
                                AlertService.showError(locale.getString('common.Error'), AlertService.message(data));
                            });
                        }
                    };

                    $scope.getUsers();

                    /*
                     * InventointiprojektiTyyppi
                     */
                    $scope.inventointiprojektityyppiOptions = [];

                    $scope.getInventointiprojektiTyyppiOptions = function() {
                        if ($scope.create || $scope.inventointiprojektityyppiOptions.length == 0) {
                            ListService.getOptions('inventointiprojektityyppi').then(function success(options) {
                                $scope.inventointiprojektityyppiOptions = options;

                                // Set the default value to valikoiva if we're creating a new entity
                                if ($scope.create) {
                                    for (var i = 0; i < $scope.inventointiprojektityyppiOptions.length; i++) {
                                        if ($scope.inventointiprojektityyppiOptions[i].id == 2) {
                                            $scope.inventointiprojekti.properties.inventointiprojektityyppi = $scope.inventointiprojektityyppiOptions[i];
                                        }
                                    }
                                }
                            }, function error(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString("error.Getting_inventoryproject_type_options_failed"), AlertService.message(data));
                                });
                            });
                        }
                    };

                    /*
                     * InventointiprojektiLaji
                     */
                    $scope.inventointiprojektilajiOptions = [];

                    $scope.getInventointiprojektiLajiOptions = function() {
                        if ($scope.create || $scope.inventointiprojektilajiOptions.length == 0) {
                            ListService.getOptions('inventointiprojektilaji').then(function success(options) {
                                $scope.inventointiprojektilajiOptions = options;

                                // Set the default value to valikoiva if we're creating a new entity
                                if ($scope.create) {
                                    for (var i = 0; i < $scope.inventointiprojektilajiOptions.length; i++) {
                                        if ($scope.inventointiprojektilajiOptions[i].id == 1) {
                                            $scope.inventointiprojekti.properties.inventointiprojektilaji = $scope.inventointiprojektilajiOptions[i];
                                        }
                                    }
                                }
                            }, function error(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString("error.Getting_inventoryproject_kind_options_failed"), AlertService.message(data));
                                });
                            });
                        }
                    };
                    /*
                     * Kuntien ja kylien haku
                     */
                    $scope.kunnat = [];
                    // Kylien suodatuksen valintalista
                    $scope.kylat = [];
                    // Kuntien suodatuksen valintalista
                    $scope.kunnatSuodatukseen = [];

                    $scope.getKunnat = function() {
                        if ($scope.create || $scope.kunnat.length == 0) {
                            KuntaService.getKunnat({
                                'rivit' : '1000'
                            }).then(function success(kunta_data) {
                                var kunnat = []; // Tmp array, delete the properties from the objects
                                for (var i = 0; i < kunta_data.features.length; i++) {
                                    kunnat.push(kunta_data.features[i].properties);
                                }
                                // Inventointiprojektille käsin valittujen kuntien suodatus. Nämä ovat vain informatiivista tietoa.
                                $scope.kunnat = kunnat.filter(function(i) {
                                    return $scope.inventointiprojekti.properties.kunnat.map(function(e) {
                                        return e.id;
                                    }).indexOf(i.id) < 0;
                                });


                                // Haetaan inventointiprojektin kaikki kylät ja suodatetaan niiden mukaan kunnat
                                if ($scope.inventointiprojekti.properties.id) {

                                	InventointiprojektiService.getAllVillagesOfInventointiprojekti($scope.inventointiprojekti.properties.id).then(function success(kyla_data) {
                                		// Inventointiprojektista löytyneet kaikki kylät
                                		$scope.kylat = kyla_data;

                                        // Kerätään uniikit kuntaIdt kylistä
                                        var kuntaIdt = [];

                                        if($scope.kylat.length > 0){
                                            for (var ind = 0; ind < $scope.kylat.length; ind++) {
                                            	if(kuntaIdt.indexOf($scope.kylat[ind].kunta_id) === -1){
                                            		kuntaIdt.push($scope.kylat[ind].kunta_id);
                                            	}
                                            };
                                        }

                                        // Suodatetut kunnat
                                        $scope.kunnatSuodatukseen = kunnat.filter(function(kunta) {
                                        	return jQuery.inArray(kunta.id, kuntaIdt) !== -1;
                                        });

                                		$defer.resolve(kyla_data);

                                    }, function error(data) {
                                        locale.ready('error').then(function() {
                                            AlertService.showError(locale.getString("error.Getting_villages_failed"), AlertService.message(data));
                                        });
                                    });
                                }



                                $defer.resolve(kunta_data);

                            }, function error(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString("error.Getting_counties_failed"), AlertService.message(data));
                                });
                            });
                        }
                    };
                    $scope.getKunnat();

                    /*
                     * Valittujen kylien mukainen suodatus. Päivittää taulukot.
                     */
                    $scope.inventointiprojekti.properties.suodatetutKylat = [];
                    $scope.inventointiprojekti.properties.suodatetutKunnat = [];

                    $scope.suodataKylatJaKunnat = function(){
	               		$scope.updateKiinteistoTable();
	               		$scope.updateRakennusTable();
	               		$scope.updateAlueTable();
	               		$scope.updateArvoalueTable();
	               		$scope.updateKylaTable();

                    };


                    /*
                     * PRIVATE HELPER FUNCTIONS
                     */

                    $scope.addItemBackToList = function(item, model) {
                        for (var i = 0; i < model.length; i++) {
                            if (model[i].id == item.id) {
                                return;
                            }
                        }
                        model.push(item);
                    };

                    /*
                     * Lisää Http request parametreihin mahdolliset kunta ja kylä suodatusvalinnat.
                     * Muodostaa pilkulla erotellut id parametrit
                     */
                    $scope.appendSearchReqParams = function(params){

                    	// Valittujen kuntien läpikäynti
                    	var kuntaIdList = "";
                        for (var ind = 0; ind < $scope.inventointiprojekti.properties.suodatetutKunnat.length; ind++) {
                        	kuntaIdList += $scope.inventointiprojekti.properties.suodatetutKunnat[ind].id + ',';
                        };

                        if(kuntaIdList.length > 0){
                        	var kuntaParams = {
                        				'suodata_kunnat' : kuntaIdList.substring(0, kuntaIdList.length - 1)
                        			};
                        	// Lisätään parametreihin
                        	angular.extend(params, kuntaParams);
                        }

                    	// Valittujen kylien läpikäynti
                    	var kylaIdList = "";
                        for (var ind = 0; ind < $scope.inventointiprojekti.properties.suodatetutKylat.length; ind++) {
                        	kylaIdList = kylaIdList + $scope.inventointiprojekti.properties.suodatetutKylat[ind].id + ',';
                        };

                        if(kylaIdList.length > 0){
                        	var kylaParams = {
                        				'suodata_kylat' : kylaIdList.substring(0, kylaIdList.length - 1)
                        			};
                        	// Lisätään parametreihin
                        	angular.extend(params, kylaParams);
                        }


                        return params;
                    };

                    /*
                     * Change the table visibility
                     */
                    $scope.showTable = function(name) {
                        $scope.visibleKyla = false;
                        $scope.visibleRakennus = false;
                        $scope.visibleAlue = false;
                        $scope.visibleArvoalue = false;
                        $scope.visibleInventoija = false;
                        $scope.visibleKiinteisto = false;
                        switch (name) {
                            case 'kiinteisto':
                                $scope.visibleKiinteisto = true;
                                unselectLayersExcept("Kiinteistot");
                                if (!isLayerSelected('Kiinteistot')) {
                                    $scope.selectedLayers.push('Kiinteistot');
                                    MapService.selectLayer($scope.mapLayers, $scope.selectedLayers, {}, true, null, null);
                                }
                                break;
                            case 'rakennus':
                                $scope.visibleRakennus = true;
                                unselectLayersExcept("Kiinteistot");
                                if (!isLayerSelected('Rakennukset')) {
                                    $scope.selectedLayers.push('Rakennukset');
                                    MapService.selectLayer($scope.mapLayers, $scope.selectedLayers, {}, true, null, null);
                                }
                                break;
                            case 'kyla':
                            	$scope.visibleKyla = true;
                                break;
                            case 'alue':
                                $scope.visibleAlue = true;
                                unselectLayersExcept("Kiinteistot");
                                if (!isLayerSelected('Alueet')) {
                                    $scope.selectedLayers.push('Alueet');
                                    MapService.selectLayer($scope.mapLayers, $scope.selectedLayers, {}, true, null, null);
                                }
                                break;
                            case 'arvoalue':
                                $scope.visibleArvoalue = true;
                                unselectLayersExcept("Kiinteistot");
                                if (!isLayerSelected('Arvoalueet')) {
                                    $scope.selectedLayers.push('Arvoalueet');
                                    MapService.selectLayer($scope.mapLayers, $scope.selectedLayers, {}, true, null, null);
                                }
                                break;
                            case 'inventoija':
                                $scope.visibleInventoija = true;
                                break;
                            case 'kaikki':
                                $scope.visibleKiinteisto = true;
                                $scope.visibleKyla = true;
                                $scope.visibleRakennus = true;
                                $scope.visibleAlue = true;
                                $scope.visibleArvoalue = true;
                                $scope.visibleInventoija = true;

                                selectAllLayers();
                                break;
                            default:
                                $scope.visibleKiinteisto = true;
                                $scope.visibleKyla = false;
                                $scope.visibleRakennus = false;
                                $scope.visibleAlue = false;
                                $scope.visibleArvoalue = false;
                                $scope.visibleInventoija = false;

                                selectAllLayers();
                                break;
                        }
                    };
                    // By default, show all tables.
                    $scope.showTable();

                    /*
                     * Function for defining if a layer is already in the $scopes selectedLayers
                     */
                    function isLayerSelected(layerName) {
                        var is = false;
                        for (var i = 0; i < $scope.selectedLayers.length; i++) {
                            if ($scope.selectedLayers[i] == layerName) {
                                is = true
                                break;
                            }
                        }
                        return is;
                    }
                    ;

                    /*
                     * Function for selecting all available objectLayers
                     */
                    function selectAllLayers() {
                        // Select all layers
                        for (var i = 0; i < $scope.objectLayers.length; i++) {
                            var objLayer = $scope.objectLayers[i];
                            if (!isLayerSelected(objLayer.value)) {
                                $scope.selectedLayers.push(objLayer.value);
                            }
                        }
                        MapService.selectLayer($scope.mapLayers, $scope.selectedLayers, {}, true, null, null);
                    }
                    ;

                    /*
                     * Function for unselecting all layers except the given one.
                     */
                    function unselectLayersExcept(layerToKeep) {
                        for (var i = $scope.selectedLayers.length - 1; i >= 0; i--) {
                            var objLayer = $scope.selectedLayers[i];
                            if (objLayer.value != layerToKeep) {
                                $scope.selectedLayers.splice(i, 1);
                            }
                        }
                        MapService.selectLayer($scope.mapLayers, $scope.selectedLayers, {}, true, null, null);
                    }
                    ;

                    /*
                     * Function for clearing the layer source
                     */
                    function clearLayerSource(layerName) {
                        var layer = null;

                        for (var i = 0; i < $scope.mapLayers.length; i++) {
                            if ($scope.mapLayers[i].name == layerName) {
                                layer = $scope.mapLayers[i];
                                break;
                            }
                        }

                        if (layer != null) {
                            layer.source.geojson.object.features.length = 0;
                        }
                    }
                    ;

                    /*
                     * Set the given data as the layer source.
                     */
                    function setLayerSource(layerName, data) {
                        var layer = null;
                        for (var i = 0; i < $scope.mapLayers.length; i++) {
                            if ($scope.mapLayers[i].name == layerName) {
                                layer = $scope.mapLayers[i];
                                break;
                            }
                        }

                        if (layer != null && data != null) {
                            layer.source.geojson.object.features.length = 0;
                            for (var i = 0; i < data.length; i++) {
                                var feat = data[i];
                                if (feat.geometry && feat.geometry.coordinates) {
                                    // Set the id value - this is used in the feature click for navigation.
                                    if (!feat.properties.id) {
                                        if (layerName == 'Arvoalueet') {
                                            feat.properties.id = feat.properties.arvoalue_id;
                                        }
                                    }
                                    layer.source.geojson.object.features.push(feat);
                                }
                            }
                        }
                    }
                    ;

                    /*
                     * Nimi change - check the availability
                     */
                    $scope.uniqueNimi = true;
                    $scope.nimi_change = function() {
                        var available = InventointiprojektiService.checkNimi($scope.inventointiprojekti.properties.nimi, $scope.inventointiprojekti.properties.id).then(function success(data) {
                            if (data) {
                                $scope.form.nimi.$setValidity('kaytossa', true);
                                $scope.uniqueNimi = true;
                            } else {
                                $scope.form.nimi.$setValidity('kaytossa', false);
                                $scope.uniqueNimi = false;
                            }
                        }, function error(data) {
                            locale.ready('error').then(function() {
                                AlertService.showError(locale.getString("error.Validating_name_failed"), AlertService.message(data));
                            });
                        });
                        return available;
                    };

                    /*
                     * Create a new inventor (open the modal)
                     */
                    $scope.createInventor = function() {
                        ModalService.userModal(null);
                    };

                    /*
                     * Add existing user to the project
                     */
                    $scope.addInventor = function() {
                        if ($scope.tmp_inventoija.inventoija) {

                            $scope.tmp_inventoija.inventoija.properties.pivot = {};
                            // If the user has a organisation value, add it to the same place as the existing inventors have it in.
                            if ($scope.tmp_inventoija.inventoija.properties.organisaatio) {
                                $scope.tmp_inventoija.inventoija.properties.pivot['inventoija_organisaatio'] = $scope.tmp_inventoija.inventoija.properties.organisaatio;
                            }
                            // Move the entered profession value to the same place as the existing inventors have it in
                            if ($scope.tmp_inventoija.inventoija.properties.inventoija_arvo) {
                                $scope.tmp_inventoija.inventoija.properties.pivot['inventoija_arvo'] = $scope.tmp_inventoija.inventoija.properties.inventoija_arvo;
                            }

                            // Check if the inventoija is already an inventoija in the project - do not add duplicates.
                            var exists = false;
                            for (var i = 0; i < $scope.inventoijat.length; i++) {
                                if ($scope.inventoijat[i].properties.id == $scope.tmp_inventoija.inventoija.properties.id) {
                                    exists = true;
                                    break;
                                }
                            }

                            if (!exists) {
                                $scope.inventoijat.push(angular.copy($scope.tmp_inventoija.inventoija));
                            }

                            /*
                             * InventointiprojektiService.addKayttajaToInventointiprojekti($scope.inventointiprojekti.properties.id, $scope.tmp_inventoija.inventoija.properties.id, $scope.tmp_inventoija.inventoija.properties.etunimi, $scope.tmp_inventoija.inventoija.properties.sukunimi,
                             * $scope.tmp_inventoija.inventoija.inventoija_arvo, $scope.tmp_inventoija.inventoija.inventoija_organisaatio).then(function success(data) { $scope.inventoijaTable.reload(); }, function error(data) { locale.ready('error').then(function() {
                             * AlertService.showError(locale.getString("error.Adding_inventor_failed"), AlertService.message(data)); }); });
                             */
                            $scope.tmp_inventoija = {};
                        }
                    };

                    /*
                     * Delete user(inventor) from the project
                     */
                    $scope.deleteInventor = function(inventoija) {
                        for (var i = 0; i < $scope.inventoijat.length; i++) {
                            if ($scope.inventoijat[i].properties.id == inventoija.properties.id) {
                                $scope.inventoijat.splice(i, 1);
                                break;
                            }
                        }
                    };

                    /*
                     * Add a new inventointiajanjakso
                     */
                    $scope.addAjanjakso = function() {
                        var a = {
                            'alkupvm' : null,
                            'loppupvm' : null
                        };
                        $scope.inventointiprojekti.properties.ajanjakso.push(a);
                    };

                    /*
                     * Delete existing inventointiajanjakso
                     */
                    $scope.deleteAjanjakso = function(index) {
                        if (index == 0) {
                            return;
                        }
                        $scope.inventointiprojekti.properties.ajanjakso.splice(index, 1);
                    };

                    /*
                     * Create a new user
                     */
                    $scope.$on('Kayttaja_luotu', function(event, data) {

                        $scope.getUsers();

                        // Set the created user as selected one
                        var u = {
                            'properties' : data.kayttaja
                        };

                        $scope.tmp_inventoija.inventoija = u;
                    });

                    /*
                     * FORM METHODS
                     */
                    /*
                     * CLOSE (Cancel view mode and hide the modal)
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
                     * CANCEL EDIT MODE
                     */
                    $scope.cancelEdit = function() {
                        // Set the values back to the original
                        for ( var property in $scope.original) {
                            if ($scope.inventointiprojekti.hasOwnProperty(property)) {
                                $scope.inventointiprojekti[property] = angular.copy($scope.original[property]);
                            }
                        }

                        $scope.edit = false;
                    };

                    /*
                     * EDIT MODE
                     */
                    $scope.editMode = function() {
                        $scope.edit = true;

                        $scope.getInventointiprojektiTyyppiOptions();
                        $scope.getInventointiprojektiLajiOptions();
                        $scope.getKunnat();
                        $scope.getUsers();
                    };
                    $scope.getInventointiprojektiTyyppiOptions();
                    $scope.getInventointiprojektiLajiOptions();

                    /*
                     * Maximize or restore the modal
                     */
                    $scope.resize = function() {
                        $scope.resizeIcon = ModalService.toggleFullScreen($scope.resizeIcon);
                        $scope.redrawMap();
                    };

                    $scope.updateInventointiprojektityyppi = function(item) {
                        $scope.inventointiprojekti.properties.tyyppi_id = item.id;
                    };

                    $scope.updateInventointiprojektilaji = function(item) {
                        $scope.inventointiprojekti.properties.laji_id = item.id;
                    };

                    /*
                     * SAVE THE PROJECT
                     */
                    $scope.save = function() {
                        $scope.disableButtonsFunc();

                        // Strip the properties from the inventoijat and change the property names to match what the BE requires.
                        var inventors = [];

                        for (var i = 0; i < $scope.inventoijat.length; i++) {
                            var tmp = $scope.inventoijat[i];
                            var n = {};

                            n.inventoija_nimi = tmp.properties.etunimi + " " + tmp.properties.sukunimi;
                            if (tmp.properties.pivot) {
                                n.inventoija_arvo = tmp.properties.pivot.inventoija_arvo;
                                n.inventoija_organisaatio = tmp.properties.pivot.inventoija_organisaatio;
                            }
                            n.inventoija_id = tmp.properties.id;
                            inventors.push(n);
                        }

                        $scope.inventointiprojekti.properties.inventoijat = inventors;

                        InventointiprojektiService.saveInventointiprojekti($scope.inventointiprojekti).then(function(id) {
                            AlertService.showInfo(locale.getString('common.Save_ok'), locale.getString('inventoryproject.Inventory_project_saved_successfully', {
                                name : $scope.inventointiprojekti.properties.nimi
                            }));
                            $scope.edit = false

                            if ($scope.create) {
                                $scope.inventointiprojekti.properties["id"] = id;
                                $scope.create = false;
                            }

                            // "update" the original after successful save
                            $scope.original = angular.copy($scope.inventointiprojekti);
                            $scope.disableButtonsFunc();
                        }, function error(data) {
                            locale.ready('inventoryproject').then(function() {
                                AlertService.showError(locale.getString("inventoryproject.Save_failed"), AlertService.message(data));
                            });
                            $scope.disableButtonsFunc();
                        });
                    };

                    /*
                     * DELETE THE PROJECT
                     */
                    $scope.deleteInventointiprojekti = function(modalNameId) {
                        var conf = confirm(locale.getString('common.Confirm_delete2', {'item': $scope.inventointiprojekti.properties.nimi}));
                        if (conf) {
                            InventointiprojektiService.deleteInventointiprojekti($scope.inventointiprojekti).then(function success() {
                                locale.ready('inventoryproject').then(function() {
                                    AlertService.showInfo(locale.getString("inventoryproject.Inventoryproject_deleted"));
                                });
                                $scope.close();
                            }, function error(data) {
                                locale.ready('inventoryproject').then(function() {
                                    AlertService.showError(locale.getString("inventoryproject.Delete_inventoryproject_failed"), AlertService.message(data));
                                });
                            });
                        }
                    };
                    /*
                     * Generate and show direct link to the item
                     */
                    $scope.popover = {
                        title : locale.getString('common.Address'),
                        content : $location.absUrl() + "?modalType=INVENTOINTIPROJEKTI&modalId=" + $scope.inventointiprojekti.properties.id
                    };

                    /*
                     * Set the filters
                     */
                    $scope.filter = "";
                    $scope.filterByInventor = function(inventoija) {
                        extent = null; //Null the old value so that view is centered according to the filtering
                        if ($scope.filter == inventoija.properties.id) {
                            $scope.kiinteistoTable.filter()['properties'] = {};
                            $scope.alueTable.filter()['properties'] = {};
                            $scope.arvoalueTable.filter()['properties'] = {};
                            $scope.rakennusTable.filter()['properties'] = {};
                            $scope.kylaTable.filter()['properties'] = {};
                            $scope.filter = "";
                        } else {
                            $scope.filter = inventoija.properties.id;

                            var props = {
                                'inventoija_id' : $scope.filter
                            };
                            $scope.kiinteistoTable.filter()['properties'] = props;
                            $scope.alueTable.filter()['properties'] = props;
                            $scope.arvoalueTable.filter()['properties'] = props;
                            $scope.rakennusTable.filter()['properties'] = props;
                            $scope.kylaTable.filter()['properties'] = props;
                        }
                    };

                    /*
                     * OPENLAYERS MAP
                     */
                    /*
                     * Array for holding all of the visible layers we have for the map
                     */
                    $scope.mapLayers = [];
                    if ($scope._center != null) {
                        // 12 is the zoom level - it's the max in that we can use.
                        angular.extend($scope, MapService.map($scope.mapLayers, $scope._center, MapService.getUserZoom()));
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

                    /*
                     * Set the kiinteisto marker on the map
                     */
                    var searchObj = {};
                    // if (!$scope.create) {
                    // searchObj["inventointiprojekti_id"] = $scope.inventointiprojekti.properties.id;
                    // }

                    var emptyLayer = false;
                    if ($scope.create) {
                        emptyLayer = true;
                    }

                    MapService.selectLayer($scope.mapLayers, [
                    // 'Kiinteistot', 'Rakennukset', 'Alueet', 'Arvoalueet'
                    ], searchObj, emptyLayer);

                    // Move handler of the map. Make the pointer appropriate.
                    // Show popup on mouseover. (TODO: how to make it work in
                    // fullscreen mode?)
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
                                    map.getTarget().style.cursor = 'pointer';
                                }
                            }
                        });
                    });

                    // Click handler of the map. "Move" the feature by wiping it
                    // and creating a new one.
                    $scope.$on('openlayers.map.singleclick', function(event, data) {
                        $scope.$apply(function() {
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
                                        $scope.selectKiinteisto({'properties': featureHit.getProperties()});
                                    } else if (layerHit.getProperties().name == 'Rakennukset') {
                                        $scope.selectRakennus({'properties': featureHit.getProperties()});

                                    } else if (layerHit.getProperties().name == 'Alueet') {
                                        $scope.selectAlue({'properties': featureHit.getProperties()});

                                    } else if (layerHit.getProperties().name == 'Arvoalueet') {
                                        $scope.selectArvoalue({'properties': featureHit.getProperties()});
                                    }
                                }
                            }
                        });
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

                    // Used because the map may disappear when resizing the modal
                    $scope.showMap = true;

                    $scope.getColumnName = function(column) {
                        return ListService.getColumnName(column);
                    };

                    $scope.showMuutoshistoria = function() {
                        MuutoshistoriaService.getInventointiprojektiMuutosHistoria($scope.inventointiprojekti.properties.id).then(function(historia) {
                            ModalService.inventointiprojektiMuutoshistoriaModal(historia, $scope.inventointiprojekti.properties.nimi);
                        });
                    };

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
