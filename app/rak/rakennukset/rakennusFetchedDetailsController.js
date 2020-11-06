/*
 * Controller for the fetched details of the kiinteisto. 
 */
angular.module('mip.rakennus').controller('RakennusFetchedDetailsController', [
		'$scope', '$rootScope',	'data',	'locale', 'olData',	'MapService', 
		'modalId', 'ModalService', 'selectedModalNameId', '$timeout',
		function($scope, $rootScope, data, locale, olData, MapService, 
		        modalId, ModalService, selectedModalNameId, $timeout) {

			var _mapId = $rootScope.getNextMapId();
			$scope.mapPopupId = "rakennusMapPopup" + _mapId;
			$scope.mapId = "rakennusDetailsMap" + _mapId;
			$scope.showMap = false;
			$scope.map = null;

            // Unique modal id which is used for the collapsible panels
            $scope.modalId = ModalService.getNextModalId();
			
            // Valitun modalin nimi ja järjestysnumero
            $scope.modalNameId = selectedModalNameId;
			
			$scope.options = {
				kayttotarkoitus : {
					value : 1,
					labelFin : "Tiili",
					labelSwe : "Til"
				}
			}

			$scope.panels = {};

			if (data.features) {
				$scope.results = data.features;
				$scope.panels.activePanel = 0;
			}

            //for translations ot work
            $scope.selectText = locale.getString('common.Select');
            $scope.textSelectMapLayers = locale.getString('common.Map_layers');
            $scope.textSelectLayers = locale.getString('common.Layers');

			// Set the center and convert the received coordinates into another projection
			// Parse the addresses and owners also
			for (var i = 0; i < $scope.results.length; i++) {
				var f = $scope.results[i];

				if (f.geometry && f.geometry.coordinates.length == 2) {
					// Set the center if it has not yet been set. Note: Center is in EPSG:3067.
					if ($scope._center == null) {
						$scope._center = {
							lon : $scope.results[i].geometry.coordinates[0],
							lat : $scope.results[i].geometry.coordinates[1]
						};
					}
					// Convert the coordinates from 3067 to 4326
					f.geometry.coordinates = MapService.epsg3067ToEpsg4326(f.geometry.coordinates[0], f.geometry.coordinates[1]);

					f.properties['showLabel'] = true;
					f.properties['MMLFeatureIndex'] = i + 1;
				}
			}

			/*
			 * ---------------------- OPENLAYERS MAP ----------------------
			 */

			olData.getMap($scope.mapId).then(function(map) {
				$scope.map = map;
			});
			// all possible layers; shown in dropdown button
			$scope.objectLayers = [
				{
					"value" : "Rakennukset",
					"label" : "Rakennukset"
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

				var rakennusLayer = null;
				for (var i = 0; i < $scope.mapLayers.length; i++) {
					if ($scope.mapLayers[i].name == 'Rakennukset') {
						rakennusLayer = $scope.mapLayers[i];
					}
				}

				if (rakennusLayer != null && $scope.results.length > 0) {
					if (rakennusLayer.source.geojson.object.features.length == 0) {
						rakennusLayer.source.geojson.object.features = $scope.results;
					}
				}
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
				// Add default layer (rakennukset)
				$scope.selectedLayers.push('Rakennukset');
				$scope.selectedLayers = MapService.selectLayer($scope.mapLayers, $scope.selectedLayers, {}, true, null, null);

				/*
				 * Add rakennus marker, first select the layer and then set the layer source to the kiinteisto.
				 */
				var rakennusLayer = null;
				for (var i = 0; i < $scope.mapLayers.length; i++) {
					if ($scope.mapLayers[i].name == 'Rakennukset') {
						rakennusLayer = $scope.mapLayers[i];
					}
				}

				if (rakennusLayer != null && $scope.results.length > 0) {
					rakennusLayer.source.geojson.object.features = $scope.results;
				}
			});

			if ($scope._center != null) {// 12 is the zoom level - it's
				// the max in that we can use.
				angular.extend($scope, MapService.map($scope.mapLayers, $scope._center, MapService.getUserZoom()));
			} else {
				angular.extend($scope, MapService.map($scope.mapLayers, undefined, MapService.getUserZoom()));
			}

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
							if (layerHit.getProperties().name == 'Rakennukset') {
								var indx = featureHit.getProperties().MMLFeatureIndex;
								$scope.activatePanel(indx - 1);
							}
						}
					}
				});
			});
			
			/*
             * Watch zoom level changes and save the zoom to the MapService.
             */
            $scope.$watch('center.zoom', function(zoom) {
                MapService.setUserZoom(zoom);
            });
			
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

							if ($scope.pointTool) {
								map.getTarget().style.cursor = 'pointer';
							} else {
								map.getTarget().style.cursor = 'move';
							}
						}
					}
				});
			});

			/*
			 * -------------------------- OPERATIONS ------------------------------
			 */

			// Close
			$scope.close = function() {
            	// Sulkee modaalin ja poistaa listalta
            	ModalService.closeModal($scope.modalNameId);
				$scope.$destroy();
			};

			// SAVE
			$scope.save = function(result, modalNameId) {
				/*
				 * Broadcast the selected building. The receiving end will select which properties to use.
				 */
				$rootScope.$broadcast('Rakennustiedot_modified', {
					'rakennus' : result,
					'modalId' : modalId
				});

            	// Sulkee modaalin ja poistaa listalta
            	ModalService.closeModal(modalNameId);
				$scope.$destroy();
			};

			$scope.activatePanel = function(indx) {
				$scope.panels.activePanel = indx;
			};

			$scope.showMap = true;
		}
]);
