/**
 * Service joka sisältää suurimman osan modalien "vakioiden" asettamisesta ja yleisten funktioiden esittelyistä.
 */
angular.module('mip.general').factory('ModalControllerService', [
        'AlertService', 'ListService', '$rootScope', 'ModalService', 'locale', 
        'olData', '$timeout', 'MapService',
        function(AlertService, ListService, $rootScope, ModalService, locale,
                olData, $timeout, MapService) {

            var functions = {
                disableButtons : false,
                extent : null,
                edit : false,
                create : false,
                noYes : ListService.getNoYes(),
                // for translations ot work
                selectText : locale.getString('common.Select'),
                textSelectMapLayers : locale.getString('common.Map_layers'),
                textSelectLayers : locale.getString('common.Layers'),
                setModalId : function() {
                    this.modalId = ModalService.getNextModalId();
                },
                setMapId : function(tyyppi) {
                    this.mapId = tyyppi + 'Map' + $rootScope.getNextMapId();
                },
                setMapPopupId : function() {
                    this.mapPopupId = 'MapPopup' + this.mapId;
                },
                /**
                 * Set the footer buttons disabled e.g. while saving.
                 */
                disableButtonsFunc : function() {
                    // this = $scope.
                    if (this.disableButtons) {
                        this.disableButtons = false;
                    } else {
                        this.disableButtons = true;
                    }
                },
                close : function() {
                    if (this.edit) {
                        this.cancelEdit();
                    }
                    ModalService.closeModal(this.modalNameId);
                },
                /**
                 * Muutosten peruuttamisessa kutsuttava metodi
                 * 
                 * @desc Peruutetaan muutokset kopioimalla originaliin tallennettujen propertyjen arvot muutoksen alla olevaan entiteettiin. Lisäksi tehdään lisätoimenpiteitä callbackissä, jos controllerissa on esitelty _cancelEdit funktio.
                 * 
                 */
                cancelEdit : function() {
                    for ( var property in this.original) {
                        if (this[this.entity].hasOwnProperty(property)) {
                            this[this.entity][property] = angular.copy(this.original[property]);
                        }
                    }
                    if (this._cancelEdit && typeof this._cancelEdit === 'function') {
                        this._cancelEdit();
                    }
                },
                editMode : function() {
                    this.edit = true;
                    if (this._editMode && typeof this._editMode === 'function') {
                        this._editMode();
                    }
                },
                /**
                 * Aseta objektitaso näkyväksi controlleriin.
                 * @params
                 * 1: Tason nimi joka asetetaan näkyväksi
                 * 2: Data joka tasolle asetetaan (ei pakollinen). Feature tai Array featureja
                 */
                /*
                selectLayer : function(layerName, data, clearLayer) {
                    this.selectedLayers = MapService.selectLayer(this.mapLayers, this.selectedLayers, {}, true, null, null);
                    
                    var layer = null;
                    for(var i = 0; i<this.mapLayers.length; i++) {
                        if(this.mapLayers[i].name == layerName) {
                            layer = this.mapLayers[i];
                            if(data && layer) {
                                if(clearLayer == true) {
                                    layer.source.geojson.object.features.length = 0;
                                }
                                if(angular.isArray(data)) {
                                    layer.source.geojson.object.features.concat(data);
                                } else {
                                    layer.source.geojson.object.features.push(data);
                                }
                            }
                            
                        }
                    }
                },*/
                /**
                 * Asetetaan MapServiceen tallennetut käyttäjän valitsemat tasot valituiksi
                 * @param
                 * 1: Tasot jotka valitaan
                 */
                selectDefaultLayer : function(layers) {
                    //Haetaan käyttäjän valitsemat tasot
                    var userLayers = MapService.getUserLayers();
                    for(var i = 0; i < userLayers.length; i++) {
                        for(var j = 0; j< layers.length; j++) {
                            //Asetetaan taso valituksi controllerissa
                            if(userLayers[i] == layers[j].properties.nimi) {
                                this.selectedMapLayers.push(layers[j].properties);
                            }
                        }
                    }
                    //Kutsutaan tasojen valintaa
                    this.selectMapLayer(true);
                    
                },
                /**
                 * Haetaan saatavilla olevat karttatasot kannasta (MapServiceltä)
                 */
                getAvailableMapLayers : function(selectDefaultLayers) {
                    MapService.getAvailableMapLayers().then(function success(layers) {
                        this.availableMapLayers = layers;

                        if(selectDefaultLayers === true){
                            this.selectDefaultLayer(layers);
                        }                                   
                    }.bind(this));
                },
                selectMapLayer : function(initial) {                   
                    this.selectedMapLayers = MapService.selectBaseLayer(this.mapLayers, this.selectedMapLayers);
                                        
                    if(!initial) {
                        // Update the user's map layer preferences
                        if (this.selectedMapLayers.length > 0) {
                            var arrayOfLayers = [];
                            for (var i = 0; i < this.selectedMapLayers.length; i++) {
                                
                                arrayOfLayers.push(this.selectedMapLayers[i].nimi);
                            }

                            MapService.setUserLayers(arrayOfLayers);
                        }
                    }          
                }
            }

            return functions;
        }
]);