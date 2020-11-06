/*
 * Controller for porrashuone entities.
 */
angular.module('mip.porrashuone').controller(
        'PorrashuoneController',
        [
                '$scope', '$q', 'TabService', '$location', 'PorrashuoneService', 'RakennusService', 'FileService',
                'CONFIG', 'existing', 'AlertService', 'KiinteistoService', 'ModalService', '$timeout', 'MapService',
                'rakennus_id', 'KuntaService', 'KylaService', '$rootScope', 'olData', 'porrashuone', 'coordinates',
                'locale', 'ListService', 'permissions', 'UserService', 'InventointiprojektiService', 'MuutoshistoriaService',
                '$filter', 'EntityBrowserService', 'selectedModalNameId', 'AlueService', 'ArvoalueService',
                function($scope, $q, TabService, $location, PorrashuoneService, RakennusService, FileService,
                        CONFIG, existing, AlertService, KiinteistoService, ModalService, $timeout, MapService,
                        rakennus_id, KuntaService, KylaService, $rootScope, olData, porrashuone, coordinates,
                        locale, ListService, permissions, UserService, InventointiprojektiService, MuutoshistoriaService,
                        $filter, EntityBrowserService, selectedModalNameId, AlueService, ArvoalueService) {
                    // map id fetching
                    var _mapId = $rootScope.getNextMapId();
                    $scope.mapId = "porrashuoneMap" + _mapId;
                    $scope.mapPopupId = "porrashuoneMapPopup" + _mapId;
                    $scope.map = null;

                    // Unique modal id which is used for the collapsible panels
                    $scope.modalId = ModalService.getNextModalId();

                    // Valitun modalin nimi ja järjestysnumero
                    $scope.modalNameId = selectedModalNameId;

                    // Is the form in edit mode or not
                    $scope.edit = false;

                    // Are we creating a new one or doing legitimate editing?
                    // If this is true, some buttons are hidden.
                    $scope.create = false;

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

                    if (porrashuone) {
                        $scope.porrashuone = porrashuone;
                    } else {
                        $scope.porrashuone = {
                            'geometry' : {
                                'coordinates' : []
                            },
                            'properties' : {}
                        };
                    }

                    if (coordinates) {
                        $scope.porrashuone.geometry.coordinates = coordinates;
                    }
                    // Store the original porrashuone for possible cancel
                    // operation
                    $scope.original = angular.copy($scope.porrashuone);

                    // existing = true when viewing an existing property
                    // false when creating a new one
                    if (!existing) {
                        $scope.edit = true;
                        $scope.create = true;
                    }

                    if (rakennus_id) {
                        $scope.porrashuone.properties['rakennus_id'] = rakennus_id;
                        $scope.porrashuone.properties.rakennus_id.readonly = true;
                    }

                    // Store permissions to porrashuone entities to scope
                    $scope.permissions = permissions;

                    // The kiinteisto and rakennus that the porrashuone belongs to the.
                    // Will be resolved later on.
                    $scope.rakennus = {};
                    $scope.kiinteisto = {};

                    $scope.showRakennusModal = function(rakennus) {
                        RakennusService.fetchRakennus(rakennus.properties.id).then(function success(rakennus) {
                            EntityBrowserService.setQuery('rakennus', rakennus.properties.id, {'porrashuone_id': $scope.porrashuone.properties.id}, 1);
                            ModalService.rakennusModal(true, rakennus, null, null);
                        }, function error(data) {
                            locale.ready('common').then(function() {
                                AlertService.showError(locale.getString('common.Error'), AlertService.message(data));
                            });
                        });
                    };
                    $scope.showKiinteistoModal = function(kiinteisto) {
                        KiinteistoService.fetchKiinteisto(kiinteisto.properties.id).then(function success(kiinteisto) {
                            EntityBrowserService.setQuery('kiinteisto', kiinteisto.properties.id, {'porrashuone_id': $scope.porrashuone.properties.id}, 1);
                            ModalService.kiinteistoModal(kiinteisto, null);
                        }, function error(data) {
                            locale.ready('common').then(function() {
                                AlertService.showError(locale.getString('common.Error'), AlertService.message(data));
                            });
                        });
                    };
                    $scope.showKuntaModal = function(kunta_id) {
                        KuntaService.fetchKunta(kunta_id).then(function success(kunta) {
                            EntityBrowserService.setQuery('kunta', kunta.properties.id, {'porrashuone_id': $scope.porrashuone.properties.id}, 1);
                            ModalService.kuntaModal(true, kunta);
                        }, function error(data) {
                            locale.ready('common').then(function() {
                                AlertService.showError(locale.getString('common.Error'), AlertService.message(data));
                            });
                        });
                    };
                    $scope.showKylaModal = function(kyla_id) {
                        KylaService.fetchKyla(kyla_id).then(function success(kyla) {
                            EntityBrowserService.setQuery('kyla', kyla.properties.id, {'porrashuone_id': $scope.porrashuone.properties.id}, 1);
                            ModalService.kylaModal(true, kyla);
                        }, function error(data) {
                            locale.ready('common').then(function() {
                                AlertService.showError(locale.getString('common.Error'), AlertService.message(data));
                            })
                        });
                    };

                    $scope.noYes = ListService.getNoYes();

                    $scope.porrastyyppiOptions = [];
                    $scope.getPorrastyyppiOptions = function() {
                        if ($scope.create || ($scope.edit && $scope.porrastyyppiOptions.length == 0)) {
                            ListService.getOptions('porrastyyppi').then(function success(options) {
                                $scope.porrastyyppiOptions = options;
                            }, function error(data) {
                                locale.ready('staircase').then(function() {
                                    AlertService.showError(locale.getString("staircase.Getting_staircasetype_options_failed"), AlertService.message(data));
                                });
                            });
                        }
                    };
                    $scope.getPorrastyyppiOptions();

                    /*
                     * Add image to the alue
                     */
                    $scope.addImage = function() {
                        ModalService.imgUploadModal('porrashuone', $scope.porrashuone);
                    };
                    /*
                     * Images
                     */
                    $scope.images = [];
                    $scope.getImages = function() {
                        if ($scope.porrashuone.properties.id) {
                            FileService.getImages({
                                'jarjestys' : 'jarjestys',
                                'jarjestys_suunta' : 'nouseva',
                                'rivit' : 1000,
                                'porrashuone_id' : $scope.porrashuone.properties.id
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
                        ModalService.imageModal(image, 'porrashuone', $scope.porrashuone, $scope.permissions, $scope.images);
                    };

                    /*
                     * Files
                     */
                    $scope.files = [];
                    $scope.getFiles = function() {
                        if ($scope.porrashuone.properties.id) {
                            FileService.getFiles({
                                'rivit' : 1000,
                                'porrashuone_id' : $scope.porrashuone.properties.id
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
                     * Add file to the porrashuone
                     */
                    $scope.addFile = function() {
                        ModalService.fileUploadModal('porrashuone', $scope.porrashuone);
                    };

                    /*
                     * Open the selected file for viewing
                     */
                    $scope.openFile = function(file) {
                        ModalService.fileModal(file, 'porrashuone', $scope.porrashuone);
                    };

                    /*
                     * Files were modified, fetch them again
                     */
                    $scope.$on('Tiedosto_modified', function(event, data) {
                        if ($scope.porrashuone.properties.id == data.id) {
                            $scope.getFiles();
                        }
                    });

                    /*
                     * Images were modified, fetch them again
                     */
                    $scope.$on('Kuva_modified', function(event, data) {
                        if ($scope.porrashuone.properties.id == data.id) {
                            $scope.getImages();
                        }
                    });

                    // Map is added to the DOM after the modal is shown,
                    // otherwise it
                    // will not be drawn until page resize
                    $scope.showMap = false;

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
                        // Asetetaan porrashuoneen tiedot alkuperäisiin arvoihin
                        for ( var property in $scope.original) {
                            if ($scope.porrashuone.hasOwnProperty(property)) {
                                $scope.porrashuone[property] = angular.copy($scope.original[property]);
                            }
                        }

                        // restore the point
                        for (var i = 0; i < $scope.mapLayers.length; i++) {
                            var mapLayer = $scope.mapLayers[i];

                            if (mapLayer.name == 'Porrashuoneet') {
                                mapLayer.source.geojson.object.features.length = 0;

                                mapLayer.source.geojson.object.features.push({
                                    type : "Feature",
                                    geometry : {
                                        type : "Point",
                                        coordinates : [
                                                $scope.lon, $scope.lat
                                        ]
                                    }
                                });

                                break;
                            }
                        }

                        $scope.getImages();

                        $scope.edit = false;
                    };

                    /*
                     * Readonly / edit mode
                     */
                    $scope.editMode = function() {
                        $scope.edit = true;
                        $scope.getPorrastyyppiOptions();

                        $scope.getUsers();
                        $scope.getInventointiprojektit();
                        $scope.setDefaultInventoryProject();
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
                        PorrashuoneService.savePorrashuone($scope.porrashuone).then(function(id) {
                            AlertService.showInfo(locale.getString('common.Save_ok'), locale.getString('staircase.Save_ok', {
                                name : $scope.porrashuone.properties.porrashuoneen_tunnus
                            }));
                            $scope.edit = false

                            if ($scope.create) {
                                $scope.porrashuone.properties["id"] = id;
                                $scope.create = false;
                            }

                            // "update" the original after successful save
                            $scope.original = angular.copy($scope.porrashuone);

                            FileService.reorderImages($scope.imageIds, $scope.porrashuone.properties.id, CONFIG.ENTITY_TYPE_IDS.porrashuone).then(function success(data) {
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

                            $scope.disableButtonsFunc();
                        }, function error(data) {
                            AlertService.showError(locale.getString('common.Error'), AlertService.message(data));
                            $scope.disableButtonsFunc();
                        });
                    };

                    /*
                     * Delete
                     */
                    $scope.deletePorrashuone = function(modalNameId) {
                        var conf = confirm(locale.getString('common.Confirm_delete2', {'item': $scope.porrashuone.properties.porrashuoneen_tunnus + " " + $scope.porrashuone.properties.porrashuonetyyppi.nimi_fi}));
                        if (conf) {
                            PorrashuoneService.deletePorrashuone($scope.porrashuone).then(function success() {
                                $scope.close();
                                locale.ready('staircase').then(function() {
                                    AlertService.showInfo(locale.getString('staircase.Deleted'));
                                });
                            }, function error(data) {
                                locale.ready('staircase').then(function() {
                                    AlertService.showError(locale.getString('staircase.Delete_fail'), AlertService.message(data));
                                });
                            });
                        }
                    };

                    $scope.showMuutoshistoria = function() {
                        MuutoshistoriaService.getPorrashuoneMuutosHistoria($scope.porrashuone.properties.id).then(function(historia) {
                            var title = $scope.porrashuone.properties.porrashuoneen_tunnus;
                            ModalService.porrashuoneMuutoshistoriaModal(historia, title);
                        });
                    };

                    /*
                     * Generate and show direct link to the item
                     */
                    $scope.popover = {
                        title : locale.getString('common.Address'),
                        content : $location.absUrl() + "?modalType=PORRASHUONE&modalId=" + $scope.porrashuone.properties.id
                    };

                    /*
                     * OPENLAYERS MAP
                     */

                    // if the coordinate is set, center the map on it
                    $scope.center = null;

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
                     * Select kiinteisto or rakennus layers (or both)
                     */
                    $scope.selectLayer = function() {
                        $scope.selectedLayers = MapService.selectLayer($scope.mapLayers, $scope.selectedLayers, {}, true, null, null);

                        var kiinteistoLayer = null;
                        for (var i = 0; i < $scope.mapLayers.length; i++) {
                            if ($scope.mapLayers[i].name == 'Kiinteistot') {
                                kiinteistoLayer = $scope.mapLayers[i];
                            }
                        }

                        if (kiinteistoLayer != null && $scope.kiinteisto.geometry.coordinates.length == 2) {
                            if (kiinteistoLayer.source.geojson.object.features.length == 0) {
                                kiinteistoLayer.source.geojson.object.features.push($scope.kiinteisto);
                            }
                        }

                        var rakennusLayer = null;
                        for (var i = 0; i < $scope.mapLayers.length; i++) {
                            if ($scope.mapLayers[i].name == 'Rakennukset') {
                                rakennusLayer = $scope.mapLayers[i];
                            }
                        }

                        if (rakennusLayer != null && $scope.rakennus) {
                            if (rakennusLayer.source.geojson.object.features.length == 0) {
                                rakennusLayer.source.geojson.object.features = $scope.rakennus;
                            }
                        }

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

                    // Click handler of the map. "Move" the feature by wiping it
                    // and creating a new one.
                    $scope.$on('openlayers.map.singleclick', function(event, data) {
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
                                    RakennusService.fetchRakennus(featureHit.getProperties().id).then(function(rakennus) {
                                        ModalService.rakennusModal(true, rakennus, null, null);
                                    });
                                } else if (layerHit.getProperties().name == 'Kiinteistot') {
                                    KiinteistoService.fetchKiinteisto(featureHit.getProperties().id).then(function(kiinteisto) {
                                        ModalService.kiinteistoModal(kiinteisto, null);
                                    });
                                }
                            }
                        }
                    });

                    // Move handler of the map. Make the pointer appropriate.
                    // Show popup on mouseover. (TODO: how to make it work in
                    // fullscreen mode?)
                    $scope.$on('openlayers.map.pointermove', function(event, data) {
                        $scope.$apply(function() {
                            if ($scope.map) {
                                var map = $scope.map;

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
                            }
                        });
                    });

                    if ($scope.center != null) {
                        angular.extend($scope, MapService.map($scope.mapLayers, $scope.center), MapService.getUserZoom());
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
                     * Drag & drop for the image functionality
                     */
                    $scope.dragControlListeners = {
                        orderChanged : function(event) {
                            $scope.reorderImages();
                        }
                    };
                    /*
                     * Reorder the images
                     */
                    $scope.imageIds = [];
                    $scope.reorderImages = function() {
                        $scope.imageIds.length = 0;
                        for (var i = 0; i < $scope.images.length; i++) {
                            $scope.imageIds.push($scope.images[i].properties.id);
                        }
                    };

                    /*
                     * Center the map to the location of the estate
                     */
                    $scope.centerToLocation = function() {
                        if ($scope.rakennus.properties.sijainti) {
                            var coord = $scope.rakennus.properties.sijainti.split(" ");
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
                    $scope.showMap = true;

                    // Is the user inventory auditor?
                    $scope.isInventor = false;

                    // Used to force the inventoija users to set the inventointiprojekti before the saving is allowed
                    $scope.userRole = UserService.getProperties().user.rooli;

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
                     * Inventory projects
                     */
                    $scope.inventointiprojektit = [];
                    $scope.getInventointiprojektit = function() {
                        // Now get the actual data...
                        if ($scope.isInventor) {
                            UserService.getUserInventoryProjects(UserService.getProperties().user.id).then(function success(data) {
                                $scope.inventointiprojektit = data;
                            }, function error(data) {
                                locale.ready('error').then(function success() {
                                    AlertService.showError(locale.getString("error.Getting_inventoryprojects_failed"), AlertService.message(data));
                                })
                            });
                        } else {
                            if ($scope.create || ($scope.edit && $scope.inventointiprojektit.length == 0)) {
                                InventointiprojektiService.getInventointiprojektit({
                                    'rivit' : 1000000
                                }).then(function success(results) {
                                    $scope.inventointiprojektit = results.features;
                                });
                            }
                        }
                    };
                    $scope.getInventointiprojektit();

                    /*
                     * Set the inventointiprojekti value or delete everything if no project selected.
                     */
                    $scope.inventointiprojektiChanged = function(force) {
                        if ($scope.porrashuone.properties.inventointiprojekti && $scope.porrashuone.properties.inventointiprojekti.properties && $scope.porrashuone.properties.inventointiprojekti.properties.id && force == true) {
                            $scope.porrashuone.properties.inventointiprojekti.inventointiprojekti_id = $scope.porrashuone.properties.inventointiprojekti.properties.id;
                        }
                        if ($scope.porrashuone.properties.inventointiprojekti.inventointiprojekti_id) {
                            $scope.porrashuone.properties.inventointiprojekti.inventoija_id = UserService.getProperties().user.id;

                            $scope.porrashuone.properties.inventointiprojekti.kenttapaiva = new Date();

                            var promise = $scope.getInventoryDate($scope.porrashuone.properties.inventointiprojekti.inventointiprojekti_id, 'kiinteisto', $scope.rakennus.properties.kiinteisto_id);

                            promise.then(function success(data) {
                                var date = null;

                                if (angular.isDate(data)) {
                                    date = data;
                                } else {
                                    date = $filter('pvm')(data);
                                    date = new Date(date);
                                }

                                $scope.porrashuone.properties.inventointiprojekti.inventointipaiva = date;

                                var p = {
                                    inventointiprojekti_id : $scope.porrashuone.properties.inventointiprojekti.inventointiprojekti_id,
                                    inventoija_id : $scope.porrashuone.properties.inventointiprojekti.inventoija_id,
                                    kenttapaiva : $scope.porrashuone.properties.inventointiprojekti.kenttapaiva,
                                    inventointipaiva : $scope.porrashuone.properties.inventointiprojekti.inventointipaiva
                                };

                                $scope.updateDefaultInventoryProject(p);
                            });
                        } else {
                            delete $scope.porrashuone.properties.inventointiprojekti;
                        }
                    };

                    $scope.updateDefaultInventoryProject = function(p) {
                        UserService.setDefaultInventoryproject(p);
                    };

                    $scope.setDefaultInventoryProject = function() {
                        if (UserService.getProperties().user.rooli == 'inventoija') {
                            var p = UserService.getDefaultInventoryproject();
                            if (p.inventointiprojekti_id != null) {
                                $scope.porrashuone.properties.inventointiprojekti = p;
                            } else {
                                if ($scope.inventointiprojektit.length == 1) {
                                    $scope.porrashuone.properties.inventointiprojekti = $scope.inventointiprojektit[0];
                                    $scope.inventointiprojektiChanged(true);
                                }
                            }
                        }
                    };

                    $scope.getInventoryDate = function(inventointiprojekti_id, tyyppi, entiteetti_id) {
                        var deferred = $q.defer();
                        if (entiteetti_id) {
                            InventointiprojektiService.getInventointipaiva(inventointiprojekti_id, tyyppi, entiteetti_id).then(function success(data) {
                                if (data && data.properties && data.properties.inventointipaiva) {
                                    deferred.resolve(data.properties.inventointipaiva);
                                } else {
                                    deferred.resolve(new Date());
                                }
                            }, function error(data) {
                                deferred.reject(new Date());
                            });
                        } else {
                            deferred.resolve(new Date());
                        }
                        return deferred.promise;
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

                    if ($scope.porrashuone['properties']) {
                        RakennusService.fetchRakennus($scope.porrashuone.properties.rakennus_id, true).then(function success(data) {
                            $scope.rakennus = data;
                            $scope.porrashuone.properties['rakennus_id'] = $scope.rakennus.properties.id;

                            $scope.selectedLayers.push('Rakennukset');
                            MapService.selectLayer($scope.mapLayers, $scope.selectedLayers, {}, true, null, null);

                            if ($scope.rakennus.geometry && $scope.rakennus.geometry.coordinates && $scope.rakennus.geometry.coordinates.length == 2) {
                                $scope.lat = $scope.rakennus.geometry.coordinates[1];
                                $scope.lon = $scope.rakennus.geometry.coordinates[0];

                                $scope.rakennus.properties.sijainti = $scope.rakennus.geometry.coordinates[0] + " " + $scope.rakennus.geometry.coordinates[1]; // The sijainti property has the value as a string.
                            }

                            var rakennusLayer = null;

                            for (var i = 0; i < $scope.mapLayers.length; i++) {
                                if ($scope.mapLayers[i].name == 'Rakennukset') {
                                    rakennusLayer = $scope.mapLayers[i];
                                }
                            }

                            if (rakennusLayer != null && $scope.rakennus.geometry && $scope.rakennus.geometry.coordinates) {
                                rakennusLayer.source.geojson.object.features.push($scope.rakennus);
                            }

                            $scope.centerToLocation();

                            KiinteistoService.fetchKiinteisto($scope.rakennus.properties.kiinteisto_id, true).then(function success(data) {
                                $scope.kiinteisto = data;
                            }, function error(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString('error.Getting_estate_failed'), AlertService.message(data));
                                });
                            });
                        }, function error(data) {
                            locale.ready('error').then(function() {
                                AlertService.showError(locale.getString('error.Getting_building_failed'), AlertService.message(data));
                            });
                        });
                    }



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
