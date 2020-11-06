/*
 * Controller for suunnittelija entities.
 */
angular.module('mip.suunnittelija').controller(
        'SuunnittelijaController',
        [
                '$rootScope', '$scope', 'TabService', '$location', 'SuunnittelijaService', 'CONFIG', 'existing', 'AlertService', 'ModalService',
                '$timeout', 'MapService', 'suunnittelija', 'locale', 'RakennusService', 'permissions', 'rakennusPermissions', 'ListService',
                'NgTableParams', 'Auth', '$filter', 'olData', 'MuutoshistoriaService', 'EntityBrowserService', 'selectedModalNameId', 'KiinteistoService',
                'AlueService', 'ArvoalueService', 'FileService',
                function($rootScope, $scope, TabService, $location, SuunnittelijaService, CONFIG, existing, AlertService, ModalService,
                        $timeout, MapService, suunnittelija, locale, RakennusService, permissions, rakennusPermissions, ListService,
                        NgTableParams, Auth, $filter, olData, MuutoshistoriaService, EntityBrowserService, selectedModalNameId, KiinteistoService,
                        AlueService, ArvoalueService, FileService) {
                    // map id fetching
                    var _mapId = $rootScope.getNextMapId();
                    $scope.mapId = "suunnittelijaMap" + _mapId;
                    $scope.mapPopupId = "suunnittelijaMapPopup" + _mapId;

                    // Unique modal id which is used for the collapsible panels
                    $scope.modalId = ModalService.getNextModalId();

                    // Valitun modalin nimi ja järjestysnumero
                    $scope.modalNameId = selectedModalNameId;

                    var extent = null; //Used to center the map to the area of the features

                    // Is the form in edit mode or not
                    $scope.edit = false;

                    // Are we creating a new one or doing legitimate editing?
                    // If this is true, some buttons are hidden.
                    $scope.create = false;

                    $scope.rakennusTotal = null;

                    //for translations ot work
                    $scope.selectText = locale.getString('common.Select');
                    $scope.textSelectMapLayers = locale.getString('common.Map_layers');
                    $scope.textSelectLayers = locale.getString('common.Layers');

                    // Enable / Disable save and cancel buttons while doing operations.
                    $scope.disableButtons = false;
                    $scope.disableButtonsFunc = function() {
                        if ($scope.disableButtons) {
                            $scope.disableButtons = false;
                        } else {
                            $scope.disableButtons = true;
                        }
                    };

                    // TODO Get the suunnittelija that was selected (if any; will be
                    // empty if creating a new one)
                    if (suunnittelija) {
                        $scope.suunnittelija = suunnittelija;
                    } else {
                        $scope.suunnittelija = {
                            'properties' : {}
                        };
                    }

                    // Store the original suunnittelija for possible cancel operation
                    $scope.original = angular.copy($scope.suunnittelija);

                    // existing = true when viewing an existing property
                    // false when creating a new one
                    if (!existing) {
                        $scope.edit = true;
                        $scope.create = true;
                    }

                    // Map is added to the DOM after the modal is shown,
                    // otherwise it
                    // will not be drawn until page resize
                    $scope.showMap = false;

                    // Store permissions to suunnittelija & rakennus entities to scope
                    $scope.permissions = permissions;
                    $scope.rakennusPermissions = rakennusPermissions;

                    /*
                     * Cancel view mode
                     */
                    $scope.close = function() {
                        if ($scope.edit) {
                            $scope.cancelEdit();
                        }
                        $scope.showMap = false; // TODO: Onko tarpeellinen?
                        // Sulkee modaalin ja poistaa listalta
                    	ModalService.closeModal($scope.modalNameId);
                        $scope.$destroy();
                    };

                    /*
                     * Cancel edit mode
                     */
                    $scope.cancelEdit = function() {
                        // Asetetaan suunnittelijan tiedot alkuperäisiin arvoihin
                        for ( var property in $scope.original) {
                            if ($scope.suunnittelija.hasOwnProperty(property)) {
                                $scope.suunnittelija[property] = angular.copy($scope.original[property]);
                            }
                        }

                        $scope.edit = false;
                        $scope.getImages();
                    };

                    /*
                     * Readonly / edit mode
                     */
                    $scope.editMode = function() {
                        $scope.edit = true;
                    };

                    $scope.resizeIcon = "▢";

                    /*
                     * Maximize or restore the modal
                     */
                    $scope.resize = function() {
                        $scope.resizeIcon = ModalService.toggleFullScreen($scope.resizeIcon);

                    };

                    /*
                     * Save changes
                     */
                    $scope.save = function() {
                        $scope.disableButtonsFunc();

                        // Set the suunnittelija_ammattiarvo_id according to the selections
                        if ($scope.suunnittelija.properties.ammattiarvo) {
                            $scope.suunnittelija.properties.suunnittelija_ammattiarvo_id = $scope.suunnittelija.properties.ammattiarvo.id;
                        }

                        SuunnittelijaService.saveSuunnittelija($scope.suunnittelija).then(function(id) {
                            AlertService.showInfo(locale.getString('common.Save_ok'));
                            $scope.edit = false

                            if ($scope.create) {
                                $scope.suunnittelija.properties["id"] = id;
                                $scope.create = false;
                            }

                            // "update" the original after successful save
                            $scope.original = angular.copy($scope.suunnittelija);
                            $scope.disableButtonsFunc();

                            $rootScope.$broadcast('Suunnittelija_modified', {
                                'suunnittelija' : $scope.suunnittelija
                            });

                            $rootScope.$broadcast('Suunnittelija_luotu', {
                                'suunnittelija' : $scope.suunnittelija
                            });

                            FileService.reorderImages($scope.imageIds, $scope.suunnittelija.properties.id, CONFIG.ENTITY_TYPE_IDS.suunnittelija).then(function success(data) {
                            	// Get updated images
                                $scope.getImages();

                            }, function error(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString('error.Image_reorder_failed'), AlertService.message(data));
                                });

                            });

                        }, function error(data) {
                            locale.ready('designer').then(function() {
                                AlertService.showError(locale.getString('designer.Save_failed'), AlertService.message(data));
                            });
                            $scope.disableButtonsFunc();
                        });
                    };

                    /*
                     * Delete
                     */
                    $scope.deleteSuunnittelija = function(modalNameId) {
                    	locale.ready('common').then(function() {
                    		var conf = confirm(locale.getString('common.Confirm_delete_designer'));

	                        if (conf) {
	                            SuunnittelijaService.deleteSuunnittelija($scope.suunnittelija).then(function success() {
	                                locale.ready('common').then(function() {
	                                    AlertService.showInfo(locale.getString('common.Deleted'));
	                                });
	                                $scope.close();
	                            }, function error(data) {
	                                locale.ready('designer').then(function() {
	                                    AlertService.showError(locale.getString('designer.Delete_failed'), AlertService.message(data));
	                                });
	                            });
	                        }
                    	});
                    };

                    /*
                     * Generate and show direct link to the item
                     */
                    $scope.popover = {
                        title : locale.getString('common.Address'),
                        content : $location.absUrl() + "?modalType=SUUNNITTELIJA&modalId=" + $scope.suunnittelija.properties.id
                    };

                    /*
                     * Kuvat
                     */
                    $scope.images = [];
                    $scope.getImages = function() {
                        if ($scope.suunnittelija.properties.id) {
                            FileService.getImages({
                                'jarjestys' : 'jarjestys',
                                'jarjestys_suunta' : 'nouseva',
                                'rivit' : 1000,
                                'suunnittelija_id' : $scope.suunnittelija.properties.id
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
                     * Drag & drop for the image functionality
                     */
                    $scope.dragControlListeners = {
                        orderChanged : function(event) {
                            $scope.reorderImages();
                        }
                    };
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
                     * Tiedostot
                     */
                    $scope.files = [];
                    $scope.getFiles = function() {
                        if ($scope.suunnittelija.properties.id) {
                            FileService.getFiles({
                                'rivit' : 1000,
                                'suunnittelija_id' : $scope.suunnittelija.properties.id
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
                     * Files were modified, fetch them again
                     */
                    $scope.$on('Tiedosto_modified', function(event, data) {
                        if ($scope.suunnittelija.properties.id == data.id) {
                            $scope.getFiles();
                        }
                    });

                    /*
                     * Images were modified, fetch them again
                     */
                    $scope.$on('Kuva_modified', function(event, data) {
                        if ($scope.suunnittelija.properties.id == data.id) {
                            $scope.getImages();
                        }
                    });

                    /*
                     * Open the selected file for viewing
                     */
                    $scope.openFile = function(file) {
                        ModalService.fileModal(file, 'suunnittelija', $scope.suunnittelija);
                    };

                    /*
                     * Lisää tiedosto
                     */
                    $scope.addFile = function() {
                        ModalService.fileUploadModal('suunnittelija', $scope.suunnittelija);
                    };

                    /*
                     * Lisää kuva
                     */
                    $scope.addImage = function() {
                        ModalService.imgUploadModal('suunnittelija', $scope.suunnittelija);
                    };
                    /*
                     * Open the selected image for viewing
                     */
                    $scope.openImage = function(image) {
                        ModalService.imageModal(image, 'suunnittelija', $scope.suunnittelija, $scope.permissions, $scope.images);
                    };

                    /*
                     * OPENLAYERS MAP
                     */

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

                        var rakennusLayer = null;
                        for (var i = 0; i < $scope.mapLayers.length; i++) {
                            if ($scope.mapLayers[i].name == 'Rakennukset') {
                                rakennusLayer = $scope.mapLayers[i];
                            }
                        }

                        var kiinteistoLayer = null;
                        for(var i = 0; i<$scope.mapLayers.length; i++) {
                            if($scope.mapLayers[i].name == 'Kiinteistot') {
                                kiinteistoLayer = $scope.mapLayers[i];
                            }
                        }
                        $scope.updateLayerData('Kiinteistot');

                        var alueLayer = null;
                        for(var i = 0; i<$scope.mapLayers.length; i++) {
                            if($scope.mapLayers[i].name == 'Alueet') {
                                alueLayer = $scope.mapLayers[i];
                            }
                        }
                        $scope.updateLayerData('Alueet');

                        var arvoalueLayer = null;
                        for(var i = 0; i<$scope.mapLayers.length; i++) {
                            if($scope.mapLayers[i].name == 'Arvoalueet') {
                                arvoalueLayer = $scope.mapLayers[i];
                            }
                        }
                        $scope.updateLayerData('Arvoalueet');


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
                             if(l.name == 'Kiinteistot') {
                                 var searchObj = {};
                                 searchObj["aluerajaus"] = "" + $scope.smallerBounds[0] + " " + $scope.smallerBounds[1] + "," + $scope.smallerBounds[2] + " " + $scope.smallerBounds[3];
                                 searchObj["rivit"] = 50;

                                 var data = KiinteistoService.getKiinteistot(searchObj);
                                 data.then(function(a) {
                                     l.source.geojson.object.features.length == 0;
                                     l.source.geojson.object.features = a.features;
                                     $scope.fixLayerOrder();
                                 });
                             }
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
                                 var searchObj = {};
                                 searchObj["aluerajaus"] = "" + $scope.smallerBounds[0] + " " + $scope.smallerBounds[1] + "," + $scope.smallerBounds[2] + " " + $scope.smallerBounds[3];
                                 searchObj["rivit"] = 50;

                                 var data = ArvoalueService.getArvoalueet(searchObj);
                                 data.then(function(a) {
                                     l.source.geojson.object.features.length == 0;
                                     l.source.geojson.object.features = a.features;
                                     $scope.fixLayerOrder();
                                 });
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

                        if (!initial) {
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
                        // Get the users layer preferences and select them automatically.
                        var userLayers = MapService.getUserLayers();

                        for (var i = 0; i < userLayers.length; i++) {
                            for (var j = 0; j < layers.length; j++) {
                                if (userLayers[i] == layers[j].properties.nimi) {
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

                        // Add default layer (rakennukset)
                        $scope.selectedLayers.push('Rakennukset');
                        $scope.selectedLayers = MapService.selectLayer($scope.mapLayers, $scope.selectedLayers, {}, true, null, null);

                    });

                    /*
                     * -----------------MAP SWITCHING END-------------------------
                     */
                    $scope.center = {
                            autodiscover : false,
                            bounds: []
                        };

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

                    if ($scope._center != null) {
                        angular.extend($scope, MapService.map($scope.mapLayers, $scope._center, MapService.getUserZoom()));
                    } else {
                        angular.extend($scope, MapService.map($scope.mapLayers, undefined, MapService.getUserZoom()));
                    }

                    /*
                     * MapService.selectLayer($scope.mapLayers, [ 'Rakennukset' ], searchObj, emptyLayer);
                     */
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

                    // Click handler of the map.
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
                                    if (layerHit.getProperties().name == 'Rakennukset') {
                                        RakennusService.fetchRakennus(featureHit.getProperties().pivot.rakennus_id).then(function(rakennus) {
                                            EntityBrowserService.setQuery('rakennus', rakennus.properties.id, {'suunnittelija_id': $scope.suunnittelija.properties.id, 'rivi': filterParameters['rivi'], 'rivit': filterParameters['rivit']}, $scope.rakennusTable.total());
                                            ModalService.rakennusModal(true, rakennus, null, null);
                                        });
                                    }
                                }
                            }
                        });
                    });

                    /*
                     * OPERATIONS
                     */
                    /*
                     * GET OPTIONS
                     */
                    /*
                     * Ammattiarvot
                     */
                    $scope.ammattiarvot = [];
                    $scope.getAmmattiarvot = function() {
                        if ($scope.create || $scope.ammattiarvot.length == 0) {
                            ListService.getOptions('suunnittelijaammattiarvo').then(function success(ammattiarvot) {
                                $scope.ammattiarvot = ammattiarvot;
                            }, function error(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString("common.Error"), AlertService.message(data));
                                });
                            });
                        }
                    };
                    $scope.getAmmattiarvot();

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
                                Auth.checkPermissions("rakennusinventointi", "suunnittelija").then(function(permissions) {
                                    if (permissions.katselu) {
                                        if ($scope.create == false) {
                                            filterParameters = ListService.parseParameters(params);

                                            SuunnittelijaService.getRakennuksetOfSuunnittelija($scope.suunnittelija.properties.id).then(function(data) {
                                                if (data && data.total_count != null) {
                                                    var orderedData = params.sorting() ? $filter('orderBy')(data.features, params.orderBy()) : data.features;
                                                    params.total(data.total_count);
                                                    $scope.rakennusTotal = data.total_count;

                                                    if (orderedData) {
                                                        MapService.selectLayer($scope.mapLayers, $scope.selectedLayers, {}, true, null, null);
                                                        setLayerSource('Rakennukset', orderedData);

                                                        //Set the center. We currently do not have any better way to do this.
                                                        //If the extent has not been set OR the new extent is bigger than the earlier extent, center to the new extent.
                                                        var rakennusExtent = MapService.calculateExtentOfFeatures(orderedData);

                                                        extent = MapService.getBiggestExtent(extent, rakennusExtent);

                                                        MapService.centerToExtent($scope.map, extent);
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
                                    }
                                });
                            }
                        }
                    });

                    $scope.showMap = true;

                    $scope.getColumnName = function(column) {
                        var c = column.split('.');
                        if (c.length == 2) {
                            return ListService.getColumnName(c[1], c[0]);
                        }
                        return ListService.getColumnName(column);
                    };

                    $scope.selectRakennus = function(rakennus) {
                        // open up a rakennus for viewing (Adding / removing to
                        // inv. proj is done below)
                        if (!$scope.edit) {
                            RakennusService.fetchRakennus(rakennus.properties.pivot.rakennus_id).then(function(rakennus) {
                                EntityBrowserService.setQuery('rakennus', rakennus.properties.id, {'suunnittelija_id': $scope.suunnittelija.properties.id, 'rivi': filterParameters['rivi'], 'rivit': filterParameters['rivit']}, $scope.rakennusTable.total());
                                ModalService.rakennusModal(true, rakennus, null, null);
                            }, function error(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString("error.Opening_building_failed"), AlertService.message(data));
                                });
                            });
                        }
                    };

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

                    $scope.showMuutoshistoria = function() {
                        MuutoshistoriaService.getSuunnittelijaMuutosHistoria($scope.suunnittelija.properties.id).then(function(historia) {
                            ModalService.suunnittelijaMuutoshistoriaModal(historia, $scope.suunnittelija.properties.sukunimi + " " + $scope.suunnittelija.properties.etunimi);
                        });
                    };

                    /*
                     * Nimi change - check the availability
                     */
                    $scope.uniqueNimi = true;
                    $scope.nimi_change = function() {
                        var nimi = "";
                        if ($scope.suunnittelija.properties.sukunimi) {
                            nimi += $scope.suunnittelija.properties.sukunimi;
                        }
                        if ($scope.suunnittelija.properties.etunimi) {
                            nimi += " " + $scope.suunnittelija.properties.etunimi;
                        }

                        if (nimi.length > 0) {

                            var available = SuunnittelijaService.checkNimi(nimi).then(function success(data) {
                                if (data.features.length == 0) {
                                    $scope.uniqueNimi = true;
                                } else {
                                    $scope.uniqueNimi = false;
                                    $scope.duplicateNameCount = data.features.length;
                                }
                            }, function error(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString("error.Validating_name_failed"), AlertService.message(data));
                                });
                            });
                            return available;
                        } else {
                            return $scope.uniqueNimi;
                        }
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

                                $scope.updateLayerData('Kiinteistot');
                                $scope.updateLayerData('Alueet');
                                $scope.updateLayerData('Arvoalueet');
                            }
                        }

                    });

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
