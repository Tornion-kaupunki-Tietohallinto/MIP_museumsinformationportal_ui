/*
 * Tutkimusalueen lisäyscontroller - ollaan ladattu järjestelmään tiedosto(t), joista on luettu sijainteja
 * ja näistä voidaan luoda tutkimusalueita.
 */
angular.module('mip.tutkimus').controller('LisaaTutkimusalueController', [
        '$scope', '$rootScope', 'data', 'locale', 'olData', 'MapService', 'hotkeys',
        'ModalService', 'selectedModalNameId', '$timeout', 'ModalControllerService',
        'parentModalId', 'tutkimus', 'TutkimusalueService', 'AlertService', 'tutkimusalue',
        function($scope, $rootScope, data, locale, olData, MapService, hotkeys,
                ModalService, selectedModalNameId, $timeout, ModalControllerService,
                parentModalId, tutkimus, TutkimusalueService, AlertService, tutkimusalue) {

            var vm = this;

            /**
             * Controllerin set-up. Suoritetaan ainoastaan kerran.
             */
            vm.setUp = function() {
                angular.extend(vm, ModalControllerService);
                vm.entity = 'tutkimusalue';
                vm.setModalId();

                vm.setMapId(vm.entity);
                vm.setMapPopupId();
                // Valitun modalin nimi ja järjestysnumero
                vm.modalNameId = selectedModalNameId;

                vm.tutkimusalueet = data;
                //Jos tutkimusalue on asetettu, asetetaan sijaintia ainoastaan tuolle tutkimusalueelle, ei lisätä uusia tutkimusalueita
                vm.tutkimusalue = tutkimusalue;

                vm.center = {
                        lat : null,
                        lon : null,
                        autodiscover : false,
                        bounds: []
                    };

                // all possible layers; shown in dropdown button
                vm.objectLayers = [
                    {
                        "value" : "Tutkimusalueet",
                        "label" : locale.getString('ark.Research_area')
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
                    vm.centerToExtent(vm.tutkimusalueet);

                });

            };
            vm.setUp();


            //Lisätään kaikille featureille label property, joka näytetään polygonin tekstinä kartalla
            vm.addLabelToFeatures = function() {
                for(var i = 0; i<vm.tutkimusalueet.length; i++) {
                    var feature = vm.tutkimusalueet[i];
                    if(feature.properties) {
                        feature.properties.label = i+1;
                    } else {
                        feature.properties = {'label' : i+1};
                    }
                }
            };
            vm.addLabelToFeatures();

            vm.markFeaturesToBeSaved = function() {
                for(var i = 0; i<vm.tutkimusalueet.length; i++) {
                    var feature = vm.tutkimusalueet[i];
                    feature.save = true;
                }
            }
            //Jos ollaan lisäämässä tutkimusalueita ensimmäistä kertaa, asetetaan ne oletuksena tallennettaviksi.
            //Jos ollaan asettamassa sijaintia yhdelle tutkimusalueelle, ei oletuksena kaikkia merkitä
            //tallennettavaksi vaan valinta tehdään pelkästään yhdelle

            if(!vm.tutkimusalue) {
            	vm.markFeaturesToBeSaved();
            }
            /**
             * Keskitetään kartta. Pitää olla timeoutin sisällä, muuten ei vaikutusta
             */
            vm.centerToExtent = function(data) {
                $timeout(function() {
                    var taExtent = MapService.calculateExtentOfFeatures(vm.tutkimusalueet);

                    var oldExtent = angular.copy(vm.extent);
                    vm.extent = MapService.getBiggestExtent(vm.extent, taExtent);

                    if(oldExtent !== vm.extent) {
                        MapService.centerToExtent(vm.map, vm.extent);
                    }
                });
            }

            vm.panels = {};

            if (vm.tutkimusalueet) {
                vm.panels.activePanel = 0;
            }


            // Close
            $scope.close = function() {
                // Sulkee modaalin ja poistaa listalta
                ModalService.closeModal(vm.modalNameId);
                $scope.$destroy();
            };

            /*
             * Tutkimusalueen nimen uniikki-tarkistus
             */
            vm.uniikkiNimi = true;
            vm.nimiIndex = -1;
            vm.uniikkiNimiTarkistus = function(input_nimi, index) {
            	if(input_nimi.length === 0) {
            		vm.uniikkiNimi = false;
                	vm.nimiIndex = index;
                	return;
            	}

                for(var i = 0; i<vm.tutkimusalueet.length; i++) {

                	if(i != index){
                    	var nimi = vm.tutkimusalueet[i].properties.nimi;
                    	if(nimi && nimi.length > 0) {
	                        if(nimi === input_nimi) {
	                        	// virhe näytölle ja tallenna painike harmaaksi
	                        	vm.uniikkiNimi = false;
	                        	vm.nimiIndex = index;
	                        	break;
	                        }else{
	                        	vm.uniikkiNimi = true;
	                        }
                    	}
                	}
                }
                if(vm.uniikkiNimi === true) {
	                //Tarkastetaan vielä bäkkäristä jo olemassa olevien tutkimusalueiden osalta:
	            	var available = TutkimusalueService.tarkistaTutkimusalueenNimi(input_nimi, tutkimus.properties.id).then(function success (data) {
						if (data) {
							vm.uniikkiNimi = true;
						} else {
							vm.uniikkiNimi = false;
                        	vm.nimiIndex = index;
						}
					});
                }
            };

            vm.verifySaved = function(ta) {
            	//Jos tutkimusalue on valittuna, on mahdollista asettaa ainoastaan 1 tallennettavaksi
            	if(vm.tutkimusalue) {
        			var countOfSaved = 0;
            		for(var i = 0; i<vm.tutkimusalueet.length; i++) {
            			var t = vm.tutkimusalueet[i];
            			if(t.save && t.save === true) {
            				countOfSaved++;
            			}
            		}

            		if(countOfSaved > 1) {
            			AlertService.showWarning(locale.getString('ark.Only_one_location_can_be_selected'));
            			ta.save = false;
            		}

            	}
            }

            /*
             * Tallennettavilla oltava nimi.
             * Tarkastus tehdään ainoastaan jos tutkimusalueita lisätään. Jos vm.tutkimusalue on asetettu
             * ollaan lisäämässä ainoastaan sijaintia olemassa olevalle tutkimusalueelle, jolloin sillä on jo nimi.
             */
            vm.pakollistenNimienTarkistus = function() {
            	if(!vm.tutkimusalue) {
	                for(var i = 0; i<vm.tutkimusalueet.length; i++) {

	                	// Valittu tallennettavaksi
	                	if(vm.tutkimusalueet[i].save){
	                    	if(!vm.tutkimusalueet[i].properties.nimi){
	                        	// virhe näytölle ja tallenna painike harmaaksi
	                            locale.ready('common').then(function() {
	                                AlertService.showError(locale.getString('common.Error'), locale.getString('common.Name_is_mandatory'));
	                            });
	                    		return false;
	                    	}
	               		}
	                }
            	}
                return true;
            };

            //Tallennetaan taListassa olevat tutkimusalueet. Lopulta poistutaan.
            vm.saveTutkimusalueRec = function(taList) {
                if(taList.length == 0) {
                    // Sulkee modaalin ja poistaa listalta
                    ModalService.closeModal(vm.modalNameId);
                    $scope.$destroy();

                    return ;
                } else {
                    taList[taList.length-1].properties.ark_tutkimus_id = tutkimus.properties.id;

                    //Jos ollaan tallentamassa ainoastaan sijaintia olemassaolevalle tutkimusalueelle
                    //Lisätään tutkimusalueelle sen id.
                    if(vm.tutkimusalue) {
                    	taList[taList.length-1]['properties']['id'] = vm.tutkimusalue.properties.id;
                        taList[taList.length-1]['properties']['vain_sijainti'] = true;
                    }

                    TutkimusalueService.saveTutkimusalue(taList[taList.length-1]).then(function(id) {
                        taList[taList.length-1].properties['id'] = id;

                        $rootScope.$broadcast('Tutkimusalue_lisatty', {
                            'tutkimusalue' : taList[taList.length-1],
                            'modalId' : parentModalId,
                            'tutkimusId' : tutkimus.properties.id
                        });

                        taList.splice(-1, 1);
                        vm.saveTutkimusalueRec(taList);
                    }, function(data) {
                        AlertService.showError(locale.getString('error.Error'), data);
                    });
                }
            }
            //Otetaan tallennettavaksi merkityt tutkimusalueet ja tallennetaan yksi kerrallaan
            //Jos ei tehdä yksi kerrallaan, selaimet voivat sekoilla liian monen samanaikaisen requestin kanssa.
            vm.saveTutkimusalueet = function() {
                //Otetaan kaikki tallennettavaksi merkityt tutkimusalueet
                var tallennettavat = [];
                for(var i = 0; i<vm.tutkimusalueet.length; i++) {
                    if(vm.tutkimusalueet[i].save) {

                        // Samalla asetetaan tutkimusalueen sijainti
                        vm.tutkimusalueet[i].properties.sijainti = "";
                        // Käydään geometria läpi ja lisätään sijainti-kenttään pilkulla eroteltuina
                        // x1 y1,x2 y2,x3 y3 ...
                        for(var j = 0; j< vm.tutkimusalueet[i].geometry.coordinates[0].length; j++) {
                            var pair = vm.tutkimusalueet[i].geometry.coordinates[0][j];
                            vm.tutkimusalueet[i].properties.sijainti += pair[0] + " " + pair[1] + ",";
                        }
                        // Poistetaan viimeinen ,
                        vm.tutkimusalueet[i].properties.sijainti = vm.tutkimusalueet[i].properties.sijainti.slice(0, -1);

                        tallennettavat.push(vm.tutkimusalueet[i]);
                    }
                }

                //Tarkastetaan, että jos vm.tutkimusalue on asetettu, niin tallennettavissa voi olla ainoastaan 1 sijainti
                //Muutoin jossain on tapahtunut joku probleema. Tätä ei pitäisi kuitenkaan koskaan tapahtua.
                if(vm.tutkimusalue) {
                	if(tallennettavat.length != 1) {
                		return;
                	}
                }
                vm.saveTutkimusalueRec(tallennettavat);
            };
            //Tallennetaan tallennettavaksi merkityt tutkimusalueet ja lopuksi suljetaan modali.
            vm.save = function() {
            	if(vm.pakollistenNimienTarkistus()) {
            		vm.saveTutkimusalueet();
            	}
            }

            vm.activatePanel = function(indx) {
                vm.panels.activePanel = indx;
            };

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
                // Add default layer (kohteet)
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
                         l.source.geojson.object.features = vm.tutkimusalueet;
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

                        if (!vm.edit || vm.deleteTool) {
                            var pixel = map.getEventPixel(data.event.originalEvent);

                            var layerHit = null;
                            var featureHit = map.forEachFeatureAtPixel(pixel, function (feature, layer) {
                                layerHit = layer;
                                map.getTarget().style.cursor = 'pointer';
                                return feature;
                            });

                            if (typeof featureHit === 'undefined') {
                                MapService.hideMapPopup(vm.mapPopupId);
                                map.getTarget().style.cursor = 'move';
                                return;
                            } else {
                                MapService.showMapPopup(vm.mapPopupId, data, featureHit, layerHit, true);
                            }
                        } else {
                            MapService.hideMapPopup(vm.mapPopupId);

                            if (vm.drawingTool || vm.pointTool || vm.getDetailsTool) {
                                map.getTarget().style.cursor = 'pointer';
                            } else {
                                map.getTarget().style.cursor = 'move';
                            }
                        }
                    }
                });
            });

            /**
             * Mäpätään tasosta löytynyt kenttä tutkimusalueen kenttään
             */
            vm.mapKeyToField = function(ta, key, value) {
                if(ta.valmap == undefined) {
                    ta.valmap = [];
                }
                ta.valmap.push({oldKey: key, newKey: value});
            }

            /**
             * Päivitetään tietyn tutkimusalueen tietyn avaimen arvo uudeksi
             */
            vm.updateValue = function(tutkimusalue, key, newValue) {
                tutkimusalue.properties[key] = newValue;
            };

            /**
             * Mäpätään kentät käyttäjän valintojen mukaisesti. Poistetaan mäppäyksen jälkeen kenttä josta arvo otettiin.
             * Param: Tutkimusalue jolle mäppäys tehdään
             */
            vm.mapObjectFields = function(ta) {
                for(var i = 0; i<ta.valmap.length; i++) {
                    //Propertyn nimi jonka sisältö lisätään
                    var ok = ta.valmap[i].oldKey;
                    var nk = ta.valmap[i].newKey;
                    if(ta.properties[nk] === undefined) {
                        ta.properties[nk] = "";
                    }
                    ta.properties[nk] += ok + ": " + ta.properties[ok] + "\n";
                    delete ta.properties[ok];
                }
            };

            // DEBUG!
            hotkeys.bindTo($scope).add({
                combo : 'ö',
                description : 'Tutkimuksen tiedot',
                callback : function () {
                    console.log(angular.copy(vm.tutkimusalueet));
                }
            });


            vm.showMap = true;
        }
]);
