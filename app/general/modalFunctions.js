/**
 * Service joka sisältää suurimman osan modalien "vakioiden" asettamisesta ja yleisten funktioiden esittelyistä.
 */
angular.module('mip.general').factory('ModalControllerService', [
        'AlertService', 'ListService', '$rootScope', 'ModalService', 'locale',
        'olData', '$timeout', 'MapService', 'hotkeys',
        function(AlertService, ListService, $rootScope, ModalService, locale,
                olData, $timeout, MapService, hotkeys) {

            var functions = {
                disableButtons : false,
                extent : null,
                edit : false,
                create : false,
                // TODO: Kovakoodattu koska eivät toimi enää. Liittynee mipdialog.js yms muutoksiin, ei ehditä lukemaan käännöstä.
                noYes : [
                    {
                        value : false,
                        label : 'Ei' // locale.getString('common.No')
                    }, {
                        value : true,
                        label : 'Kyllä' //locale.getString('common.Yes')
                    }
                ], // ListService.getNoYes()
                // for translations ot work
                selectText : 'Valitse', //locale.getString('common.Select')
                textSelectMapLayers : 'Karttatasot', //locale.getString('common.Map_layers')
                textSelectLayers : 'Tasot', //locale.getString('common.Layers')
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
                },
                /*
                * Tallennus ja muokkaus pikanäppäinten bindaus controllereihin.
                *
                */
                bindHotkeys : function(scope) {
                    hotkeys.add({
                        combo : 'ctrl+m',
                        description : 'EditMode',
                        allowIn: ['INPUT', 'SELECT', 'TEXTAREA'],
                        callback : function (event, hotkey) {
                            event.preventDefault();

                            // Jos ollaan create tilassa, ei muokkausta voida sallia. Defaultataan trueksi, jotta tulee
                            // ehkä vähemmin virheellisiä olettamuksia
                            var isCreate = true;
                            if((scope.create !== undefined && scope.create === false) || (scope.vm !== undefined && scope.vm.create === false)) {
                                isCreate = false;
                            }
                            // Jos ei ole muokkausoikeuksia, ei muokkausta voida sallia
                            var hasEditPermissions = false;
                            if((scope.permissions !== undefined && scope.permissions.muokkaus === true) || (scope.vm !== undefined && scope.vm.permissions !== undefined && scope.vm.permissions.muokkaus === true)) {
                                hasEditPermissions = true;
                            }

                            if(!isCreate && hasEditPermissions) {
                                //Tarkistetaan onko scopen alla suoraan edit vai vm.edit
                                if(scope.edit != undefined) {
                                    AlertService.showInfo("Muokkaus painettu ('ctrl+m')");
                                    scope.edit ? !scope.cancelEdit() : scope.editMode()
                                } else if (scope.vm != undefined) {
                                    //Tarkistetaan löytyykö Toimenpiteiden peruutaMuokkaus funktiota
                                    if(typeof scope.vm.peruutaMuokkaus === "function"){
                                        AlertService.showInfo("Muokkaus painettu ('ctrl+m')");
                                        scope.vm.edit ? scope.vm.peruutaMuokkaus() : scope.vm.editMode();
                                    } else{
                                        AlertService.showInfo("Muokkaus painettu ('ctrl+m')");
                                        scope.vm.edit ? scope.vm.cancelEdit() : scope.vm.editMode();
                                    }
                                }
                            }
                        }
                    });
                    hotkeys.add({
                        combo : 'ctrl+s',
                        description : 'Save',
                        allowIn: ['INPUT', 'SELECT', 'TEXTAREA'],
                        callback : function (event, hotkey) {
                            event.preventDefault();

                            // Jos ei ole muokkausoikeuksia, ei muokkausta voida sallia
                            var hasEditPermissions = false;
                            if((scope.permissions !== undefined && scope.permissions.muokkaus === true) || (scope.vm !== undefined && scope.vm.permissions !== undefined && scope.vm.permissions.muokkaus === true)) {
                                hasEditPermissions = true;
                            }

                            if(hasEditPermissions) {
                                if(scope.edit != undefined && scope.edit === true) {
                                    AlertService.showInfo("Tallennus painettu ('ctrl+s')");
                                    scope.save();
                                } else if (scope.vm != undefined && scope.vm.edit === true){
                                    AlertService.showInfo("Tallennus painettu ('ctrl+s')");
                                    scope.vm.save();
                                }
                            } else {
                                return;
                            }
                        }
                    });
                },
                /*
                * Tallennus ja muokkaus pikanäppäinten bindauksen poisto controllereista
                *
                */
                unbindHotkeys : function() {
                    hotkeys.del('ctrl+m');
                    hotkeys.del('ctrl+s');
                }
            }

            return functions;
        }
]);