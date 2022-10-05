/*
 * Controller for rakennus entities.
 */
angular.module('mip.rakennus').controller(
        'RakennusController',
        [
                '$scope', '$q', 'TabService', '$location', 'RakennusService', 'CONFIG', 'existing', 'AlertService', 'KiinteistoService', 'ModalService', 'kiinteisto_id',
                '$timeout', 'MapService', 'PorrashuoneService', 'KuntaService', 'KylaService', '$rootScope', 'olData', 'rakennus', 'coordinates', 'locale', 'SuunnittelijaService',
                'ListService', 'permissions', 'porrashuonePermissions', 'NgTableParams', '$filter', 'FileService', 'UserService', 'InventointiprojektiService', 'MuutoshistoriaService',
                'EntityBrowserService', 'selectedModalNameId', 'AlueService', 'ArvoalueService', 'LocationService',
                function($scope, $q, TabService, $location, RakennusService, CONFIG, existing, AlertService, KiinteistoService, ModalService, kiinteisto_id,
                        $timeout, MapService, PorrashuoneService, KuntaService, KylaService, $rootScope, olData, rakennus, coordinates, locale, SuunnittelijaService,
                        ListService, permissions, porrashuonePermissions, NgTableParams, $filter, FileService, UserService, InventointiprojektiService, MuutoshistoriaService,
                        EntityBrowserService, selectedModalNameId, AlueService, ArvoalueService, LocationService) {
                    // map id fetching
                    var _mapId = $rootScope.getNextMapId();
                    $scope.mapId = "rakennusMap" + _mapId;
                    $scope.mapPopupId = "rakennusMapPopup" + _mapId;

                    // Unique modal id which is used for the collapsible panels
                    $scope.modalId = ModalService.getNextModalId();

                    // Valitun modalin nimi ja järjestysnumero
                    $scope.modalNameId = selectedModalNameId;

                    //Siirtämiseen valittujen kuvien array
                    $scope._selectedImages =[];

                    $scope.map = null;

                    // Is the form in edit mode or not
                    $scope.edit = false;

                    // Are we creating a new one or doing legitimate editing?
                    // If this is true, some buttons are hidden.
                    $scope.create = false;

                    // Options for NoYes dropdown list
                    $scope.noYes = ListService.getNoYes();

                    $scope.pointTool = false;

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

                    if (rakennus) {

                        $scope.rakennus = rakennus;

                        if (!$scope.rakennus.properties.osoitteet) {
                            $scope.rakennus.properties.osoitteet = [];
                        }

                        if (!$scope.rakennus.properties.omistajat) {
                            $scope.rakennus.properties.omistajat = [];
                        }

                    } else {
                        $scope.rakennus = {
                            'geometry' : {
                                'coordinates' : []
                            },
                            'properties' : {
                                'purettu' : $scope.noYes[0].value,
                                'kulttuurihistoriallisetarvot' : [],
                                'rakennustyypit' : [],
                                'arvotustyyppi' : {},
                                'alkuperaisetkaytot' : [],
                                'katetyypit' : [],
                                'kattotyypit' : [],
                                'kuntotyyppi' : {},
                                'nykykaytot' : [],
                                'perustustyypit' : [],
                                'rakennustyypit' : [],
                                'runkotyypit' : [],
                                'suojelutiedot' : [],
                                'vuoraustyypit' : [],
                                'muutosvuodet' : [],
                                'osoitteet' : [],
                                'omistajat' : [],
                                'suunnittelijat' : []
                            }
                        };
                    }

                    // Store permissions to rakennus entities to scope
                    $scope.permissions = permissions;
                    $scope.porrashuonePermissions = porrashuonePermissions;

                    /*
                     * Fetch related data
                     */

                    $scope.porrashuoneet = {};

                    if ($scope.rakennus.properties.id) {
                        RakennusService.getPorrashuoneetOfRakennus($scope.rakennus.properties.id).then(function success(data) {
                            $scope.porrashuoneet = data.features;
                        }, function error(data) {
                            locale.ready('error').then(function() {
                                AlertService.showError(locale.getString("error.Getting_stairwells_failed"), AlertService.message(data));
                            });
                        });
                    }
                    $scope.showPorrashuoneModal = function(porrashuone) {
                        PorrashuoneService.fetchPorrashuone(porrashuone.properties.id).then(function success(porrashuone) {
                            EntityBrowserService.setQuery('porrashuone', porrashuone.properties.id, {'rakennus_id': $scope.rakennus.properties.id}, $scope.porrashuoneet.length);
                            ModalService.porrashuoneModal(true, porrashuone, $scope.rakennus.properties.id);
                        }, function error(data) {
                            locale.ready('error').then(function() {
                                AlertService.showError(locale.getString('error.Opening_stairwell_failed'), AlertService.message(data));
                            });
                        });
                    };

                    $scope.$on('Porrashuone_modified', function() {
                        $scope.porrashuoneet = [];
                        RakennusService.getPorrashuoneetOfRakennus($scope.rakennus.properties.id).then(function success(data) {
                            $scope.porrashuoneet = data.features;
                        }, function error(data) {
                            locale.ready('error').then(function() {
                                AlertService.showError(locale.getString("error.Getting_stairwells_failed"), AlertService.message(data));
                            });
                        });
                    });

                    /*
                     * Get the related kiinteisto if it is not set (TODO: or is different, check the id!)
                     */
                    if (kiinteisto_id && !$scope.rakennus.properties.kiinteisto) {
                        KiinteistoService.fetchKiinteisto(kiinteisto_id, true).then(function success(data) {

                            $scope.rakennus.properties.kiinteisto = data.properties;

                        }, function error(data) {
                            locale.ready('error').then(function() {
                                AlertService.showError(locale.getString("error.Getting_estate_failed"), AlertService.message(data));
                            });
                        });
                    } else if ($scope.rakennus.properties.kiinteisto_id && !$scope.rakennus.properties.kiinteisto) {
                        KiinteistoService.fetchKiinteisto($scope.rakennus.properties.kiinteisto_id, true).then(function success(data) {

                            $scope.rakennus.properties.kiinteisto = data.properties;

                        }, function error(data) {
                            locale.ready('error').then(function() {
                                AlertService.showError(locale.getString("error.Getting_estate_failed"), AlertService.message(data));
                            });
                        });
                    }

                    /*
                     * Add porrashuone to the rakennus
                     */
                    $scope.addPorrashuone = function() {
                        EntityBrowserService.setQuery('porrashuone', null, {'rakennus_id': $scope.rakennus.properties.id}, 1);

                        if ($scope.rakennus.geometry) {
                            ModalService.porrashuoneModal(false, null, $scope.rakennus.properties.id, $scope.rakennus.geometry.coordinates);
                        } else {
                            ModalService.porrashuoneModal(false, null, $scope.rakennus.properties.id);
                        }
                    }

                    $scope.fixSuunnittelijaObjects = function() {
                        for (var i = 0; i < $scope.rakennus.properties.suunnittelijat.length; i++) {
                            var s = $scope.rakennus.properties.suunnittelijat[i];

                            // add properties to suunnittelija
                            var values = angular.copy(s.suunnittelija);
                            delete s.suunnittelija;
                            s.suunnittelija = {};
                            s.suunnittelija['properties'] = values;
                        }
                    };

                    // existing = true when viewing an existing property
                    // false when creating a new one
                    if (!existing) {
                        $scope.edit = true;
                        $scope.create = true;
                    } else {
                        $scope.rakennus.properties['kiinteisto_id'] = $scope.rakennus.properties.kiinteisto_id;

                        // Fix suunnittelija_id (cast string to int)
                        for (var i = 0; i < $scope.rakennus.properties.suunnittelijat.length; i++) {
                            var s = $scope.rakennus.properties.suunnittelijat[i];
                            s.suunnittelija_id = parseInt(s.suunnittelija_id);
                            s.suunnittelija_tyyppi_id = parseInt(s.suunnittelija_tyyppi_id);

                        }

                        $scope.fixSuunnittelijaObjects();
                    }

                    // Store the original rakennus for possible cancel operation
                    $scope.original = angular.copy($scope.rakennus);

                    /*
                     * Kulttuurihistorialliset arvot
                     */
                    $scope.kultHistArvot = [];

                    ListService.getOptions('kulttuurihistoriallinenarvo', 'rakennus').then(function success(options) {
                        for (var i = 0; i < options.data.features.length; i++) {
                            var opt = options.data.features[i];
                            $scope.kultHistArvot.push({
                                id : opt.properties.id,
                                nimi_fi : opt.properties.nimi_fi,
                                nimi_se : opt.properties.nimi_se
                            });
                        }
                    }, function error(data) {
                        locale.ready('error').then(function() {
                            AlertService.showError(locale.getString("error.Getting_culturohistorical_values_failed"), AlertService.message(data));
                        });
                    });

                    // Map is added to the DOM after the modal is shown,
                    // otherwise it
                    // will not be drawn until page resize
                    $scope.showMap = false;

                    /*
                     * Close view mode
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
                        // Asetetaan rakennuksen tiedot alkuperäisiin arvoihin
                        for ( var property in $scope.original) {
                            if ($scope.rakennus.hasOwnProperty(property)) {
                                $scope.rakennus[property] = angular.copy($scope.original[property]);
                            }
                        }

                        if ($scope.rakennus.properties.sijainti != null) {
                            // restore the point
                            for (var i = 0; i < $scope.mapLayers.length; i++) {
                                var mapLayer = $scope.mapLayers[i];

                                if (mapLayer.name == 'Rakennukset') {
                                    //mapLayer.source.geojson.object.features.length = 0;

                                    //Remove only the wanted one
                                    for (var i = 0; i < mapLayer.source.geojson.object.features.length; i++) {
                                        var f = mapLayer.source.geojson.object.features[i];
                                        if (f.properties == undefined || f.properties.id == $scope.rakennus.properties.id) {
                                            mapLayer.source.geojson.object.features.splice(i, 1);
                                            break;
                                        }
                                    }


                                    var coord = $scope.rakennus.properties.sijainti.split(" ");

                                    mapLayer.source.geojson.object.features.push({
                                        type : "Feature",
                                        geometry : {
                                            type : "Point",
                                            coordinates : [
                                                    coord[0], coord[1]
                                            ]
                                        }
                                    });

                                    break;
                                }
                            }
                        }

                        $scope.getImages();

                        $scope.edit = false;

                        if ($scope.pointTool) {
                            $scope.togglePointTool();
                        }
                    };

                    /* Kattotyyppi */
                    $scope.kattotyyppiOptions = [];
                    $scope.getKattotyyppiOptions = function() {
                        if ($scope.create || $scope.kattotyyppiOptions.length == 0) {
                            ListService.getOptions('kattotyyppi').then(function success(options) {
                                $scope.kattotyyppiOptions = options.filter(function(i) {
                                    return $scope.rakennus.properties.kattotyypit.map(function(e) {
                                        return e.id;
                                    }).indexOf(i.id) < 0;
                                });
                            }, function error(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString("error.Getting_ceiling_options_failed"), AlertService.message(data));
                                });
                            });
                        }
                    };
                    $scope.getKattotyyppiOptions();

                    /* Rakennustyyppi */
                    $scope.rakennustyyppiOptions = [];
                    $scope.getRakennustyyppiOptions = function() {
                        if ($scope.create || $scope.rakennustyyppiOptions.length == 0) {
                            ListService.getOptions('rakennustyyppi').then(function success(options) {
                                $scope.rakennustyyppiOptions = options.filter(function(i) {
                                    return $scope.rakennus.properties.rakennustyypit.map(function(e) {
                                        return e.id;
                                    }).indexOf(i.id) < 0;
                                });
                            }, function error(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString("error.Getting_building_options_failed"), AlertService.message(data));
                                });
                            });
                        }
                    };
                    $scope.getRakennustyyppiOptions();

                    /* Alkuperainen kaytto */
                    $scope.alkuperaisetkaytotOptions = [];
                    $scope.getAlkuperaisetkaytotOptions = function() {
                        if ($scope.create || $scope.alkuperaisetkaytotOptions.length == 0) {
                            ListService.getOptions('kayttotarkoitus').then(function success(options) {
                                $scope.alkuperaisetkaytotOptions = options.filter(function(i) {
                                    return $scope.rakennus.properties.alkuperaisetkaytot.map(function(e) {
                                        return e.id;
                                    }).indexOf(i.id) < 0;
                                });
                            }, function error(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString("error.Getting_originalusage_options_failed"), AlertService.message(data));
                                });
                            });
                        }
                    };
                    $scope.getAlkuperaisetkaytotOptions();

                    /* Nykykaytto */
                    $scope.nykykaytotOptions = [];
                    $scope.getNykykaytotOptions = function() {
                        if ($scope.create || $scope.nykykaytotOptions.length == 0) {
                            ListService.getOptions('kayttotarkoitus').then(function success(options) {
                                $scope.nykykaytotOptions = options.filter(function(i) {
                                    return $scope.rakennus.properties.nykykaytot.map(function(e) {
                                        return e.id;
                                    }).indexOf(i.id) < 0;
                                });
                            }, function error(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString("error.Getting_currentusage_options_failed"), AlertService.message(data));
                                });
                            });
                        }
                    };
                    $scope.getNykykaytotOptions();

                    /* Perustustyyppi */
                    $scope.perustustyyppiOptions = [];
                    $scope.getPerustustyyppiOptions = function() {
                        if ($scope.create || $scope.perustustyyppiOptions.length == 0) {
                            ListService.getOptions('perustus').then(function success(options) {
                                $scope.perustustyyppiOptions = options.filter(function(i) {
                                    return $scope.rakennus.properties.perustustyypit.map(function(e) {
                                        return e.id;
                                    }).indexOf(i.id) < 0;
                                });
                            }, function error(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString("error.Getting_foundation_options_failed"), AlertService.message(data));
                                });
                            });
                        }
                    };
                    $scope.getPerustustyyppiOptions();

                    /* Runkotyyppi */
                    $scope.runkotyyppiOptions = [];
                    $scope.getRunkotyyppiOptions = function() {
                        if ($scope.create || $scope.runkotyyppiOptions.length == 0) {
                            ListService.getOptions('runko').then(function success(options) {
                                $scope.runkotyyppiOptions = options.filter(function(i) {
                                    return $scope.rakennus.properties.runkotyypit.map(function(e) {
                                        return e.id;
                                    }).indexOf(i.id) < 0;
                                });
                            }, function error(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString("error.Getting_frame_options_failed"), AlertService.message(data));
                                });
                            });
                        }
                    };
                    $scope.getRunkotyyppiOptions();

                    /* Vuoraustyyppi */
                    $scope.vuoraustyyppiOptions = [];
                    $scope.getVuoraustyyppiOptions = function() {
                        if ($scope.create || $scope.vuoraustyyppiOptions.length == 0) {
                            ListService.getOptions('vuoraus').then(function success(options) {
                                $scope.vuoraustyyppiOptions = options.filter(function(i) {
                                    return $scope.rakennus.properties.vuoraustyypit.map(function(e) {
                                        return e.id;
                                    }).indexOf(i.id) < 0;
                                });
                            }, function error(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString("error.Getting_lining_options_failed"), AlertService.message(data));
                                });
                            });
                        }
                    };
                    $scope.getVuoraustyyppiOptions();

                    /* Katetyyppi */
                    $scope.katetyyppiOptions = [];
                    $scope.getKatetyyppiOptions = function() {
                        if ($scope.create || $scope.katetyyppiOptions.length == 0) {
                            ListService.getOptions('kate').then(function success(options) {
                                $scope.katetyyppiOptions = options.filter(function(i) {
                                    return $scope.rakennus.properties.katetyypit.map(function(e) {
                                        return e.id;
                                    }).indexOf(i.id) < 0;
                                });
                            }, function error(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString("error.Getting_cover_options_failed"), AlertService.message(data));
                                });
                            });
                        }
                    };
                    $scope.getKatetyyppiOptions();

                    /* Kuntotyyppi */
                    $scope.kuntotyyppiOptions = [];
                    $scope.getKuntotyyppiOptions = function() {
                        if ($scope.create || $scope.kuntotyyppiOptions.length == 0) {
                            ListService.getOptions('kunto').then(function success(options) {
                                $scope.kuntotyyppiOptions = options;
                            }, function error(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString("error.Getting_condition_options_failed"), AlertService.message(data));
                                });
                            });
                        }
                    };
                    $scope.getKuntotyyppiOptions();

                    /* Nykytyyli */
                    $scope.nykytyyliOptions = [];
                    $scope.getNykytyyliOptions = function() {
                        if ($scope.create || $scope.nykytyyliOptions.length == 0) {
                            ListService.getOptions('nykyinen_tyyli').then(function success(options) {
                                $scope.nykytyyliOptions = options;
                            }, function error(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString("error.Getting_contemporarystyle_options_failed"), AlertService.message(data));
                                });
                            });
                        }
                    };
                    $scope.getNykytyyliOptions();

                    /* Arvotus */
                    $scope.arvotusOptions = [];
                    $scope.getArvotusOptions = function() {
                        if ($scope.create || $scope.arvotusOptions.length == 0) {
                            ListService.getOptions('arvotus').then(function success(options) {
                                $scope.arvotusOptions = options;
                            }, function error(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString("error.Getting_building_valuation_options_failed"), AlertService.message(data));
                                });
                            });
                        }
                    };
                    $scope.getArvotusOptions();

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
                     * Readonly / edit mode
                     */
                    $scope.editMode = function() {
                        $scope.edit = true;

                        $scope.getKattotyyppiOptions();
                        $scope.getRakennustyyppiOptions();
                        $scope.getAlkuperaisetkaytotOptions();
                        $scope.getNykykaytotOptions();
                        $scope.getPerustustyyppiOptions();
                        $scope.getRunkotyyppiOptions();
                        $scope.getVuoraustyyppiOptions();
                        $scope.getKatetyyppiOptions();
                        $scope.getKuntotyyppiOptions();
                        $scope.getNykytyyliOptions();
                        $scope.getArvotusOptions();
                        $scope.getSuojeluOptions();

                        $scope.getUsers();
                        $scope.getInventointiprojektit();
                    };

                    $scope.addItemBackToList = function(item, model) {
                        for (var i = 0; i < model.length; i++) {
                            if (model[i].id == item.id) {
                                return;
                            }
                        }
                        model.push(item);
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
                     * Helper method for the details tool
                     */
                    $scope.getDetails = function(useKiinteistotunnus) {
                        var kt = null;
                        var sijainti = null;

                        if (useKiinteistotunnus == true) {
                            kt = $scope.rakennus.properties.kiinteisto.kiinteistotunnus;

                            // If kiinteistotunnus is not available, show warning and do nothing.
                            if (kt == null) {
                                locale.ready('common').then(function() {
                                    locale.ready('error').then(function() {
                                        AlertService.showWarning(locale.getString('common.Error'), locale.getString('error.Estate_identifier_not_available'));
                                    });
                                });
                            }
                        } else {
                            // If no location set, show warning and do nothing.
                            if ($scope.rakennus.properties.sijainti == null) {
                                locale.ready('common').then(function() {
                                    locale.ready('error').then(function() {
                                        AlertService.showWarning(locale.getString('common.Error'), locale.getString('error.Location_not_available'));
                                    });
                                });
                            } else {

                                var coord = $scope.rakennus.properties.sijainti.split(" ");
                                // Transform the coordinates of the estate
                                var prj = ol.proj.transform([
                                        coord[0], coord[1]
                                ], 'EPSG:4326', 'EPSG:3067').map(function(c) {
                                    return c.toFixed(4);
                                });

                                var lat = parseFloat(prj[1]);
                                var lon = parseFloat(prj[0]);

                                sijainti = lon + " " + lat;
                            }
                        }

                        if (kt || sijainti) {
                            MapService.fetchBuildingDetails(kt, sijainti).then(function success(data) {
                                // The query can be successfull even though we receive 0 buildings - show the received details only if we received buildings.
                                if (data.data.features) {
                                    ModalService.rakennusFetchedDetailsModal(data.data, $scope.rakennus, $scope.modalId);
                                } else {
                                    AlertService.showInfo("", AlertService.message(data));
                                }
                            }, function error(error) {
                                if(error && error.data && error.data.data && error.data.data.properties && error.data.data.properties.ktj_service === 'not_configured') {
                                    AlertService.showWarning(AlertService.message(error));
                                } else {
                                    locale.ready('error').then(function() {
                                        AlertService.showError(locale.getString('common.Error'), AlertService.message(error));
                                    });
                                }
                            });
                        }
                    };

                    $scope.getDetailsTool = false;
                    $scope.toggleGetDetailsTool = function() {
                        $timeout(function() {
                            $scope.getDetailsTool = !$scope.getDetailsTool;
                            // TODO: Cancel out the createRakennusTool etc.
                        });
                    };

                    /*
                     * Selected details are broadcasted from the modal.
                     */
                    $scope.$on('Rakennustiedot_modified', function(event, data) {
                        //BUG#7081: Rakennusrekisteritietojen päivittyminen kahdelle muokattavana olealle rakennukselle
                        // check that the data was meant to be used by this modal window
                        if(data.modalId != $scope.modalId) {
                            // this modal did not ask for the data
                            return;
                        }

                        if ($scope.create == true || $scope.edit == true) {
                            // Set the rakennus properties we use
                            $scope.rakennus.properties.rakennustunnus = data.rakennus.properties.rakennustunnus;

                            for (var i = 0; i < data.rakennus.properties.osoitteet.length; i++) {
                                data.rakennus.properties.osoitteet[i].jarjestysnumero = parseInt(data.rakennus.properties.osoitteet[i].jarjestysnumero);
                                data.rakennus.properties.osoitteet[i].katunumero = data.rakennus.properties.osoitteet[i].katunumero;
                            }
                            $scope.rakennus.properties.osoitteet = data.rakennus.properties.osoitteet;
                            $scope.rakennus.properties.postinumero = data.rakennus.properties.postinumero;
                            $scope.rakennus.properties.sijainti = data.rakennus.geometry.coordinates[0] + " " + data.rakennus.geometry.coordinates[1]; // The sijainti property has the value as a string.

                            // Place the marker on the map also
                            var coord = data.rakennus.geometry.coordinates;
                            var lat = coord[1];
                            var lon = coord[0];

                            for (var i = 0; i < $scope.mapLayers.length; i++) {
                                var mapLayer = $scope.mapLayers[i];
                                if (mapLayer.name == 'Rakennukset') {
                                    mapLayer.source.geojson.object.features.length = 0;

                                    mapLayer.source.geojson.object.features.push({
                                        type : "Feature",
                                        geometry : {
                                            type : "Point",
                                            coordinates : [
                                                    lon, lat
                                            ]
                                        }
                                    });

                                    break;
                                }
                            }
                            // And center the map to the location
                            $scope.centerToLocation();
                        }
                    });

                    /*
                     * Images were modified, fetch them again
                     */
                    $scope.$on('Kuva_modified', function(event, data) {
                        if ($scope.rakennus.properties.id == data.id) {
                            $scope.getImages();
                        }
                    });

                    /*
                     * Save changes
                     */
                    $scope.save = function() {
                        $scope.disableButtonsFunc();

                        RakennusService.saveRakennus($scope.rakennus).then(function(id) {
                            /*
                             * Update the rakennus id
                             */
                            if ($scope.create) {
                                $scope.rakennus.properties["id"] = id;
                                $scope.create = false;
                            }

                            RakennusService.fetchRakennus(id).then(function success(data) {
                                $scope.rakennus = data;

                                // Set the "sijainti" property again
                                if ($scope.rakennus.geometry && $scope.rakennus.geometry.coordinates) {
                                    $scope.lat = $scope.rakennus.geometry.coordinates[1];
                                    $scope.lon = $scope.rakennus.geometry.coordinates[0];
                                    $scope.rakennus.properties["sijainti"] = $scope.lon + " " + $scope.lat;
                                }

                                $scope.fixSuunnittelijaObjects();

                                // "update" the original after successful save
                                $scope.original = angular.copy($scope.rakennus);

                            }, function error(data) {
                                locale.ready('common').then(function success() {
                                    AlertService.showError(locale.getString('common.Error'), AlertService.message(data));
                                });
                            });

                            locale.ready('building').then(function() {
                                AlertService.showInfo(locale.getString('building.Save_ok', {
                                    name : $scope.rakennus.properties.inventointinumero
                                }));
                            });
                            $scope.edit = false;

                            FileService.reorderImages($scope.imageIds, $scope.rakennus.properties.id, CONFIG.ENTITY_TYPE_IDS.rakennus).then(function success(data) {
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
                            locale.ready('common').then(function() {
                                AlertService.showError(locale.getString('common.Error'), AlertService.message(data));
                            });
                            $scope.disableButtonsFunc();
                        });
                    };

                    /*
                     * Delete
                     */
                    $scope.deleteRakennus = function(modalNameId) {
                        var conf = confirm(locale.getString('common.Confirm_delete2', {'item': $scope.rakennus.properties.inventointinumero + " " + $scope.rakennus.properties.rakennustyypit[0].nimi_fi}));
                        if (conf) {
                            RakennusService.deleteRakennus($scope.rakennus).then(function success() {
                                locale.ready('building').then(function() {
                                    AlertService.showInfo(locale.getString('building.Delete_ok'));
                                });
                                $scope.close();
                            }, function error(data) {
                                locale.ready('common').then(function() {
                                    AlertService.showError(locale.getString('common.Error'), AlertService.message(data));
                                });
                            });
                        }
                    };

                    /*
                     * Show kiinteistö
                     */
                    $scope.showKiinteistoModal = function(id) {
                        KiinteistoService.fetchKiinteisto(id).then(function(kiinteisto) {
                            EntityBrowserService.setQuery('kiinteisto', kiinteisto.properties.id, {'rakennus_id': $scope.rakennus.properties.id}, 1);
                            ModalService.kiinteistoModal(kiinteisto, null);
                        }, function error(data) {
                            locale.ready('building').then(function() {
                                AlertService.showError(locale.getString('error.Opening_estateview_failed'), AlertService.message(data));
                            });
                        });
                    }
                    $scope.showKuntaModal = function(id) {
                        KuntaService.fetchKunta(id).then(function(kunta) {
                            EntityBrowserService.setQuery('kunta', kunta.properties.id, {'rakennus_id': $scope.rakennus.properties.id}, 1);
                            ModalService.kuntaModal(true, kunta);
                        }, function error(data) {
                            locale.ready('error').then(function() {
                                AlertService.showError(locale.getString('error.Opening_county_failed'), AlertService.message(data));
                            });
                        });
                    }
                    $scope.showKylaModal = function(id) {
                        KylaService.fetchKyla(id).then(function(kyla) {
                            EntityBrowserService.setQuery('kyla', kyla.properties.id, {'rakennus_id': $scope.rakennus.properties.id}, 1);
                            ModalService.kylaModal(true, kyla);
                        }, function error(data) {
                            locale.ready('error').then(function() {
                                AlertService.showError(locale.getString('error.Opening_village_failed'), AlertService.message(data));
                            });
                        });
                    }

                    $scope.showMuutoshistoria = function() {
                        MuutoshistoriaService.getRakennusMuutosHistoria($scope.rakennus.properties.id).then(function(historia) {
                            ModalService.rakennusMuutoshistoriaModal(historia, $scope.rakennus.properties.inventointinumero);
                        });
                    };

                    /*
                     * Suunnittelija
                     */
                    $scope.suunnittelijat = [];
                    $scope.getSuunnittelijat = function(search) {

                        SuunnittelijaService.getSuunnittelijat({
                            'rivit' : 50,
                            'jarjestys' : 'sukunimi',
                            'nimi': search
                        }).then(function success(data) {
                            $scope.suunnittelijat.length = 0;

                            // Strip the properties
                            // for(var i = 0; i<data.features.length; i++) {
                            // var s = data.features[i].properties;
                            // $scope.suunnittelijat.push(s);
                            // }

                            $scope.suunnittelijat = data.features;
                        }, function error(data) {
                            locale.ready('error').then(function() {
                                AlertService.showError(locale.getString('error.Getting_designers_failed'), AlertService.message(data));
                            });
                        });

                    };
                    $scope.getSuunnittelijat();

                    /*
                     * Suunnittelijatyypit
                     */
                    $scope.suunnittelijatyypit = [];
                    $scope.getSuunnittelijatyypit = function() {
                        if ($scope.create || $scope.suunnittelijatyypit.length == 0) {
                            ListService.getOptions('suunnittelijatyyppi').then(function success(tyypit) {
                                $scope.suunnittelijatyypit = tyypit;
                            }, function error(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString("common.Error"), AlertService.message(data));
                                });
                            });
                        }
                    };
                    $scope.getSuunnittelijatyypit();

                    /*
                     * Add a new suunnittelija
                     */
                    $scope.addSuunnittelija = function() {
                        var s = {
                            'suunnittelija_tyyppi_id' : null,
                            'lisatieto' : "",
                            'suunnitteluvuosi_alku' : null,
                            'suunnitteluvuosi_loppu' : null,
                            'id' : null
                        };
                        $scope.rakennus.properties.suunnittelijat.push(s);
                    };

                    /*
                     * Remove a suunnittelija
                     */
                    $scope.deleteSuunnittelija = function(index) {
                        $scope.rakennus.properties.suunnittelijat.splice(index, 1);
                    };

                    $scope.selectSuunnittelija = function(suunnittelija) {
                        SuunnittelijaService.fetchSuunnittelija(suunnittelija.suunnittelija.properties.id).then(function(suunnittelija) {
                            EntityBrowserService.setQuery('suunnittelija', suunnittelija.properties.id, {'rakennus_id': $scope.rakennus.properties.id}, $scope.rakennus.properties.suunnittelijat.length, $scope.rakennus.properties.suunnittelijat);
                            ModalService.suunnittelijaModal(true, suunnittelija);
                        }, function error(data) {
                            locale.ready('error').then(function() {
                                AlertService.showError(locale.getString('error.Opening_designer_failed'), AlertService.message(data));
                            });
                        });
                    };

                    /*
                     * Create a new suunnittelija (open the modal)
                     */
                    $scope.indexForNewSuunnittelija = null;
                    $scope.createSuunnittelija = function(index) {
                        $scope.indexForNewSuunnittelija = index;
                        ModalService.suunnittelijaModal(false);
                    };
                    $scope.$on('Suunnittelija_modified', function(event, data) {
                        $scope.tmp_suunnittelija = data.suunnittelija.properties;
                        $scope.getSuunnittelijat();
                    });

                    // After creating a new suunnittelija, select it automatically, refresh the suunnittelijalist
                    $scope.$on('Suunnittelija_luotu', function(event, data) {
                        $scope.getSuunnittelijat();
                        var s = {
                            suunnittelija : data.suunnittelija,
                            suunnittelija_id : data.suunnittelija.properties.id
                        }

                        // Add the suunnittelija to the correct index.
                        $scope.rakennus.properties.suunnittelijat.splice($scope.indexForNewSuunnittelija, 1, s);
                        $scope.indexForNewSuunnittelija = null;
                    });

                    /*
                     * Generate and show direct link to the item
                     */
                    // TODO: If rakennus doesn't have an id?
                    $scope.popover = {
                        title : locale.getString('common.Address'),
                        content : $location.absUrl() + "?modalType=RAKENNUS&modalId=" + $scope.rakennus.properties.id
                    };

                    /*
                     * Images
                     */
                    $scope.images = [];
                    $scope.getImages = function() {
                        if ($scope.rakennus.properties.id) {
                            FileService.getImages({
                                'jarjestys' : 'jarjestys',
                                'jarjestys_suunta' : 'nouseva',
                                'rivit' : 1000,
                                'rakennus_id' : $scope.rakennus.properties.id
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
                     * Files
                     */
                    $scope.files = [];
                    $scope.getFiles = function() {
                        if ($scope.rakennus.properties.id) {
                            FileService.getFiles({
                                'rivit' : 1000,
                                'rakennus_id' : $scope.rakennus.properties.id
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
                        if ($scope.rakennus.properties.id == data.id) {
                            $scope.getFiles();
                        }
                    });

                    /*
                     * Open the selected file for viewing
                     */
                    $scope.openFile = function(file) {
                        ModalService.fileModal(file, 'rakennus', $scope.rakennus);
                    };

                    /*
                     * Add file to the rakennus
                     */
                    $scope.addFile = function() {
                        ModalService.fileUploadModal('rakennus', $scope.rakennus);
                    };

                    /*
                     * Add image to the building
                     */
                    $scope.addImage = function() {
                        ModalService.imgUploadModal('rakennus', $scope.rakennus);
                    };
                    /*
                     * Open the selected image for viewing
                     */
                    $scope.openImage = function(image) {
                        ModalService.imageModal(image, 'rakennus', $scope.rakennus, $scope.permissions, $scope.images);
                    };

                    // function for toggling the point tool
                    $scope.togglePointTool = function() {
                        $timeout(function() {
                            $scope.pointTool = !$scope.pointTool;
                        });
                    };
                    /*
                     * Autodiscover to the client's location
                     */
                    $scope.autodiscover = function() {
                        $scope.center.autodiscover = true;
                    };

                    $scope.deletePoint = function() {
                        for (var i = 0; i < $scope.mapLayers.length; i++) {
                            var mapLayer = $scope.mapLayers[i];
                            if (mapLayer.name == 'Rakennukset') {
                                // mapLayer.source.geojson.object.features.length = 0;

                                for (var i = 0; i < mapLayer.source.geojson.object.features.length; i++) {
                                    var f = mapLayer.source.geojson.object.features[i];
                                    if (f.properties == undefined || f.properties.id == $scope.rakennus.properties.id) {
                                        mapLayer.source.geojson.object.features.splice(i, 1);
                                        break;
                                    }
                                }

                                break;
                            }
                        }

                        $scope.rakennus.properties.sijainti = null;
                    };

                    /*
                     * Center the map to the location of the estate
                     */
                    $scope.centerToLocation = function(coordinates) {
                        if(coordinates !== undefined) {
                            // Center to coordinates
                            var lat = coordinates[1];
                            var lon = coordinates[0];

                            var prj = ol.proj.transform([
                                lon, lat
                                ], 'EPSG:4326', 'EPSG:3067').map(function(c) {
                                    return c.toFixed(4);
                            });

                            lat = parseFloat(prj[1]);
                            lon = parseFloat(prj[0]);

                            $scope.center.lat = lat;
                            $scope.center.lon = lon;

                        } else if ($scope.rakennus.properties.sijainti) {
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
                        $scope.rakennus.properties.suojelutiedot.push(s);
                    };

                    /*
                     * Remove a suojelutieto
                     */
                    $scope.deleteSuojelutieto = function(index) {
                        $scope.rakennus.properties.suojelutiedot.splice(index, 1);
                    }

                    /*
                     * Add a new alteration year
                     */
                    $scope.addMuutosvuosi = function() {
                        var s = {
                            'alkuvuosi' : null,
                            'loppuvuosi' : null,
                            'selite' : null
                        };
                        $scope.rakennus.properties.muutosvuodet.push(s);
                    };

                    /*
                     * Remove an alteration year
                     */
                    $scope.deleteMuutosvuosi = function(index) {
                        $scope.rakennus.properties.muutosvuodet.splice(index, 1);
                    };

                    /*
                     * Add address
                     */
                    $scope.addOsoite = function() {
                        var os = {
                            'jarjestysnumero' : $scope.rakennus.properties.osoitteet.length + 1
                        };
                        $scope.rakennus.properties.osoitteet.push(os);
                    };

                    /*
                     * Remove address
                     */
                    $scope.deleteOsoite = function(index) {
                        $scope.rakennus.properties.osoitteet.splice(index, 1);
                    };

                    /*
                     * Add owner
                     */
                    $scope.addOmistaja = function() {
                        var om = {};
                        $scope.rakennus.properties.omistajat.push(om);
                    };
                    /*
                     * Delete owner
                     */
                    $scope.deleteOmistaja = function(index) {
                        $scope.rakennus.properties.omistajat.splice(index, 1);
                    };

                    /*
                     * Nimi change - check the availability
                     */
                    $scope.uniqueInventointinumero = true;
                    $scope.inventointinumero_change = function() {
                        var available = RakennusService.checkInventointinumero($scope.rakennus.properties.kiinteisto.id, $scope.rakennus).then(function success(data) {
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

                    /*
                     * MuutRakennukset: the other rakennus entities of this kiinteisto. If any.
                     */
                    $scope.muutRakennukset = [];
                    $scope.getMuutRakennukset = function() {
                        var kiinteistoId = null;

                        if ($scope.rakennus.properties.kiinteisto_id) {
                            kiinteistoId = $scope.rakennus.properties.kiinteisto_id;
                        } else if (kiinteisto_id) {
                            kiinteistoId = kiinteisto_id;
                        }
                        if (kiinteistoId) {
                            var promise = KiinteistoService.getRakennuksetOfKiinteisto(kiinteistoId);

                            promise.then(function(rakennukset) {
                                $scope.muutRakennukset = rakennukset;

                                if (!$scope.create) {
                                    for (var i = 0; i < $scope.muutRakennukset.length; i++) {
                                        var f = $scope.muutRakennukset[i];
                                        if (f.properties.id == $scope.rakennus.properties.id) {
                                            $scope.muutRakennukset.splice(i, 1);
                                            break;
                                        }
                                    }
                                }

                                // Hack hack hack:
                                // We want to show the inventointinumero on top of the circle only in this view.
                                // Applying a custom style or selecting a new layer "TextLayer" didn't do the job well, therefore this.
                                for (var i = 0; i < $scope.muutRakennukset.length; i++) {
                                    $scope.muutRakennukset[i].properties['showLabel'] = true;
                                }

                                var rakennusLayer = null;

                                for (var i = 0; i < $scope.mapLayers.length; i++) {
                                    if ($scope.mapLayers[i].name == 'Rakennukset') {
                                        rakennusLayer = $scope.mapLayers[i];
                                    }
                                }

                                // Clear the layer before adding the rakennukset again.
                                // Clear except for the existing one!!!
                                // rakennusLayer.source.geojson.object.features.length = 0;

                                if (rakennusLayer != null && $scope.muutRakennukset) {
                                    for (var i = 0; i < $scope.muutRakennukset.length; i++) {
                                        if($scope.muutRakennukset[i].geometry && $scope.muutRakennukset[i].geometry.coordinates.length == 2) {
                                            rakennusLayer.source.geojson.object.features.push($scope.muutRakennukset[i]);
                                        }
                                    }
                                }
                            }, function(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString("error.Getting_buildings_failed"), AlertService.message(data));
                                });
                                $scope.muutRakennukset = [];
                            });
                        }

                    };
                    $scope.getMuutRakennukset();

                    /*
                     * OPENLAYERS MAP
                     */
                    // Get the rakennus coordinates
                    if ($scope.rakennus.geometry && $scope.rakennus.geometry.coordinates.length == 2) {
                        $scope.lat = $scope.rakennus.geometry.coordinates[1];
                        $scope.lon = $scope.rakennus.geometry.coordinates[0];

                        // while we're at it, push them to kiinteisto's
                        // properties as well; that way they'll get POSTed or
                        // PUT
                        $scope.rakennus.properties["sijainti"] = $scope.lon + " " + $scope.lat;
                        $scope.original.properties["sijainti"] = $scope.lon + " " + $scope.lat;
                    } else if (coordinates) { // If the building has no location, but we arrived here from the kiinteisto, set that
                        $scope.lat = coordinates[1];
                        $scope.lon = coordinates[0];
                    } else {
                        // No kiinteisto coordinates, fetch the kiinteisto and center to it. Arrived from the list view
                       KiinteistoService.fetchKiinteisto($scope.rakennus.properties.kiinteisto_id).then(function(kiinteisto){
                            if(kiinteisto.geometry.coordinates) {
                               $scope.centerToLocation(kiinteisto.geometry.coordinates);
                            }
                        });
                    }

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
                        }, {
                            "value": "Reitit",
                            "label": locale.getString('map.Routes')
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

                        if (rakennusLayer != null && $scope.rakennus.geometry && $scope.rakennus.geometry.coordinates.length == 2) {
                            if (rakennusLayer.source.geojson.object.features.length == 0) {
                                rakennusLayer.source.geojson.object.features.push($scope.rakennus);
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

                        var reittiLayer = null;
                        for(var i = 0; i<$scope.mapLayers.length; i++) {
                            if($scope.mapLayers[i].name == 'Reitit') {
                                reittiLayer = $scope.mapLayers[i];
                            }
                        }
                        $scope.updateLayerData('Reitit');

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
                             if(l.name == 'Reitit') {
                                LocationService.getReitit({'entiteettiTyyppi': 'Rakennus', 'entiteettiId': $scope.rakennus.properties.id}).then(function success(data) {
                                   l.source.geojson.object.features = data.features;
                                   $scope.reitit = data.features;
                                }, function error(data) {
                                   AlertService.showError("error.Getting_routes_failed");
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

                      //Add viewParams filtering to the layer
                        for (var i = 0; i < $scope.mapLayers.length; i++) {
                            var l = $scope.mapLayers[i];
                            if (l.name == 'POHJAKARTTA_MIP rakennukset') {
                                l.source.params['viewparams'] ='rakennus_id:'+ $scope.rakennus.properties.id;
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

                        if (rakennusLayer != null && $scope.rakennus.geometry && $scope.rakennus.geometry.coordinates && $scope.rakennus.geometry.coordinates.length == 2) {
                            rakennusLayer.source.geojson.object.features.push($scope.rakennus);
                        }
                    });

                    /*
                     * -----------------MAP SWITCHING END-------------------------
                     */
                    if ($scope.center != null) {// 12 is the zoom level - it's
                        // the max in that we can use.
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

                    // Jos reittejä muokataan, päivitetään reittitason sisältö
                    $scope.$on('Reitti_modified', function(event, data) {
                        $scope.updateLayerData('Reitit');
                    });

                    /*
                     * Watch zoom level changes and save the zoom to the MapService.
                     */
                    $scope.$watch('center.zoom', function(zoom) {
                        MapService.setUserZoom(zoom);
                    });

                    // Move handler of the map. Make the pointer appropriate.
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

                    // Click handler of the map. "Move" the feature by wiping it
                    // and creating a new one.
                    $scope.$on('openlayers.map.singleclick', function(event, data) {
                        // ...but only in edit mode.
                        if ($scope.edit) {
                            if ($scope.pointTool) {
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
                                    if (mapLayer.name == 'Rakennukset') {

                                        // mapLayer.source.geojson.object.features.length = 0;

                                        for (var i = 0; i < mapLayer.source.geojson.object.features.length; i++) {
                                            var f = mapLayer.source.geojson.object.features[i];
                                            if (f.properties == undefined || f.properties.id == $scope.rakennus.properties.id) {
                                                mapLayer.source.geojson.object.features.splice(i, 1);
                                                break;
                                            }
                                        }

                                        mapLayer.source.geojson.object.features.push({
                                            type : "Feature",
                                            geometry : {
                                                type : "Point",
                                                coordinates : [
                                                        lon, lat
                                                ]
                                            }
                                        });

                                        break;
                                    }
                                }

                                if (!$scope.rakennus.properties) {
                                    $scope.rakennus.properties = {
                                        sijainti : null
                                    };
                                }

                                // update kiinteisto properties as well, as
                                // those are what we POST or PUT
                                $scope.rakennus.properties["sijainti"] = lon + " " + lat;

                                // disengage point setting!
                                $scope.togglePointTool();

                                // used to force the map to redraw
                                $scope.$apply();
                            } else {

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
                                            PorrashuoneService.fetchPorrashuone(featureHit.getProperties().id).then(function(porrashuone) {
                                                ModalService.porrashuoneModal(true, porrashuone, null, null);
                                            });
                                        }
                                    }
                                }
                            }
                        } else if ($scope.map) {
                            var map = $scope.map;
                            var pixel = map.getEventPixel(data.event.originalEvent);
                            var layerHit = null;
                            var featureHit = map.forEachFeatureAtPixel(pixel, function(feature, layer) {
                                layerHit = layer;
                                return feature;
                            });
                            if (typeof featureHit !== 'undefined') {
                                if (layerHit.getProperties().name == 'Reitit') {
                                    var featureId = featureHit.getProperties().id;
                                    for(var i = 0; i < $scope.reitit.length; i++) {
                                        if($scope.reitit[i].properties.id === featureId) {
                                            ModalService.reittiModal($scope.reitit[i], 'rakennusinventointi', 'rakennus', $scope.rakennus);
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    });

                    $scope.showMap = true;

                    /*
                     * Column name translation helper
                     */
                    $scope.getColumnName = function(column) {
                        return ListService.getColumnName(column);
                    };

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

                    $scope.languageOptions = [
                            {
                                id : 'fin',
                                label : locale.getString('common.Finnish')
                            }, {
                                id : 'swe',
                                label : locale.getString('common.Swedish')
                            }
                    ];

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
                                    'inventoijat' : true
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
                                    'rivit' : 1000000,
                                    'jarjestys' : 'nimi'
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
                    $scope.inventointiprojektiChanged = function() {
                        if ($scope.rakennus.properties.inventointiprojekti.inventointiprojekti_id) {

                            //Asetetaan käyttäjä
                            $scope.rakennus.properties.inventointiprojekti.inventoija_id = UserService.getProperties().user.id;

                            /*
                             * Inventointipäivän asetus. Haetaan inventointiprojektilistasta valittu inventointiprojekti ja tältä
                             * oikean inventoijan kohdalta inventointipaiva.
                             * Jos inventointipaivaa ei ole (tai sen asettaminen ei muuten onnistunut), asetetaan inventointipaivaksi kuluva paiva.
                             */
                            if($scope.rakennus.properties.kiinteisto.inventointiprojektit) {
                                for(var i = 0; i<$scope.rakennus.properties.kiinteisto.inventointiprojektit.length; i++) {
                                    var ip = $scope.rakennus.properties.kiinteisto.inventointiprojektit[i];

                                    var dateToSet = null;
                                    if(ip.id == $scope.rakennus.properties.inventointiprojekti.inventointiprojekti_id) {
                                        for(var j = 0; j<ip.inventoijat.length; j++) {
                                            if(ip.inventoijat[j].inventoija_id == $scope.rakennus.properties.inventointiprojekti.inventoija_id) {
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
                                $scope.rakennus.properties.inventointiprojekti.inventointipaiva = dateToSet;
                            }
                            if($scope.rakennus.properties.inventointiprojekti.inventointipaiva == null) {
                                $scope.rakennus.properties.inventointiprojekti.inventointipaiva = new Date();
                            }

                            /*
                             * Kenttäpäivän asetus, samoin kuten inventointipaiva yllä, paitsi että kenttapaiva ei saa kuluvaa paivaa arvoksi, vaan jää tyhjäksi.
                             */
                            if($scope.rakennus.properties.kiinteisto.inventointiprojektit) {
                                for(var i = 0; i<$scope.rakennus.properties.kiinteisto.inventointiprojektit.length; i++) {
                                    var ip = $scope.rakennus.properties.kiinteisto.inventointiprojektit[i];

                                    var dateToSet = null;
                                    if(ip.id == $scope.rakennus.properties.inventointiprojekti.inventointiprojekti_id) {
                                        for(var j = 0; j<ip.inventoijat.length; j++) {
                                            if(ip.inventoijat[j].inventoija_id == $scope.rakennus.properties.inventointiprojekti.inventoija_id) {
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
                                $scope.rakennus.properties.inventointiprojekti.kenttapaiva = dateToSet;
                            }
                        } else {
                            delete $scope.rakennus.properties.inventointiprojekti;
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

                    $scope.currentLocale = locale.getLocale();

                    $scope.showMoveRakennusModal = function() {
                        $timeout(function() {
                            ModalService.siirraRakennusModal($scope.rakennus);
                        },10);
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
                            }
                        }

                    });

                    /*
                     * Käydään läpi kaikki suojelutiedot, ja jos yhdenkin tyyppi on asettamatta, palautetaan false
                     */
                    $scope.validateSuojelutyypit = function() {
                        for(var i = 0; i<$scope.rakennus.properties.suojelutiedot.length; i++) {
                            var s = $scope.rakennus.properties.suojelutiedot[i];
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
