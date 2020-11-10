/*
 * Controller for kyla entities.
 */
angular.module('mip.kyla').controller(
        'KylaController',
        [
                '$scope',
                'TabService',
                '$location',
                'KylaService',
                'CONFIG',
                'existing',
                'AlertService',
                'ModalService',
                'NgTableParams',
                '$timeout',
                'MapService',
                'KuntaService',
                'kunnat',
                'kyla',
                'locale',
                'permissions',
                'FileService',
                'Auth',
                'ListService',
                'KiinteistoService',
                'RakennusService',
                'AlueService',
                'ArvoalueService',
                '$filter',
                'MuutoshistoriaService',
                'EntityBrowserService',
                'selectedModalNameId',
                function($scope, TabService, $location, KylaService, CONFIG, existing, AlertService, ModalService, NgTableParams, $timeout, MapService, KuntaService, kunnat, kyla, locale, permissions, FileService, Auth, ListService,
                        KiinteistoService, RakennusService, AlueService, ArvoalueService, $filter, MuutoshistoriaService, EntityBrowserService, selectedModalNameId) {
                    // Is the form in edit mode or not
                    $scope.edit = false;

                    // Are we creating a new one or doing legitimate editing?
                    // If this is true, some buttons are hidden.
                    $scope.create = false;

                    // Unique modal id which is used for the collapsible panels
                    $scope.modalId = ModalService.getNextModalId();

                    // Valitun modalin nimi ja järjestysnumero
                    $scope.modalNameId = selectedModalNameId;

                    // Enable / Disable save and cancel buttons while doing operations.
                    $scope.disableButtons = false;
                    $scope.disableButtonsFunc = function() {
                        if ($scope.disableButtons) {
                            $scope.disableButtons = false;
                        } else {
                            $scope.disableButtons = true;
                        }
                    };

                    // TODO Get the kyla that was selected (if any; will be
                    // empty if creating a new one)
                    if (kyla) {
                        $scope.kyla = kyla;
                    } else {
                        $scope.kyla = {
                            'geometry' : {
                                'coordinates' : []
                            },
                            'properties' : {}
                        }
                    }
                    // Store the original kyla for possible cancel operation
                    $scope.original = angular.copy($scope.kyla);

                    // existing = true when viewing an existing property
                    // false when creating a new one
                    if (!existing) {
                        $scope.edit = true;
                        $scope.create = true;
                        $scope.kyla['properties'] = {};
                    }

                    $scope.kunnat = kunnat;
                    $scope.kunta = {};

                    // Store permissions to kyla entities to scope
                    $scope.permissions = permissions;
                    /*
                     * kunta_id has been changed, update kunta name selections
                     */
                    $scope.kuntaChanged = function() {
                        // update the kunta name
                        if (!$scope.kyla.properties.kunta_id) {
                            $scope.kyla.properties.kunta = '';
                        } else {
                            for (var i = 0; i < kunnat.features.length; i++) {
                                var kunta = kunnat.features[i];

                                if (kunta.properties.id == $scope.kyla.properties.kunta_id) {
                                    $scope.kunta.nimi = kunta.properties.nimi;
                                    $scope.kunta.nimi_se = kunta.properties.nimi_se;
                                    $scope.kunta.kuntanumero = kunta.properties.kuntanumero;
                                    break;
                                }
                            }
                        }
                    };

                    $scope.kuntaChanged();

                    $scope.showKuntaModal = function() {
                        KuntaService.fetchKunta($scope.kyla.properties.kunta_id).then(function success(kunta) {
                            EntityBrowserService.setQuery('kunta', kunta.properties.id, {'kyla_id': $scope.kyla.properties.id}, 1);
                            ModalService.kuntaModal(true, kunta);
                        }, function error(data) {
                            locale.ready('common').then(function() {
                                AlertService.showError(locale.getString('common.Error'), AlertService.message(data));
                            });
                        });
                    };

                    /*
                     * Cancel view mode
                     */
                    $scope.close = function() {
                        if ($scope.edit) {
                            $scope.cancelEdit();
                        }
                     // Sulkee modaalin ja poistaa listalta
                    	ModalService.closeModal($scope.modalNameId);
                        $scope.$destroy();
                    };

                    /*
                     * Cancel edit mode
                     */
                    $scope.cancelEdit = function() {
                        // Asetetaan kylan tiedot alkuperäisiin arvoihin
                        for ( var property in $scope.original) {
                            if ($scope.kyla.hasOwnProperty(property)) {
                                $scope.kyla[property] = angular.copy($scope.original[property]);
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
                        KylaService.saveKyla($scope.kyla).then(function(id) {
                            // Update the kyla nimi
                            if ($scope.create) {
                                $scope.kyla.properties["id"] = id;
                                $scope.create = false;
                            }
                            $scope.edit = false

                            // "update" the original after successful save
                            $scope.original = angular.copy($scope.kyla);

                            FileService.reorderImages($scope.imageIds, $scope.kyla.properties.id, CONFIG.ENTITY_TYPE_IDS.kyla).then(function success(data) {
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
                    $scope.deleteKyla = function(modalNameId) {
                        var conf = confirm(locale.getString('common.Confirm_delete2', {'item': $scope.kyla.properties.nimi}));
                        if (conf) {
                            KylaService.deleteKyla($scope.kyla).then(function success() {
                                locale.ready('kyla').then(function() {
                                    AlertService.showInfo(locale.getString('kyla.Village_deleted'));
                                });
                                $scope.close();
                            }, function error() {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString('error.Error'), locale.getString('error.Village_delete_fail'));
                                });
                            });
                        }
                    };
                    /*
                     * Generate and show direct link to the item
                     */
                    $scope.popover = {
                        title : locale.getString('common.Address'),
                        content : $location.absUrl() + "?modalType=KYLA&modalId=" + $scope.kyla.properties.id
                    };

                    /*
                     * Images
                     */
                    $scope.images = [];
                    $scope.getImages = function() {
                        if ($scope.kyla.properties.id) {
                            FileService.getImages({
                                'jarjestys' : 'jarjestys',
                                'jarjestys_suunta' : 'nouseva',
                                'rivit' : 1000,
                                'kyla_id' : $scope.kyla.properties.id
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
                     * Images were modified, fetch them again
                     */
                    $scope.$on('Kuva_modified', function(event, data) {
                        if ($scope.kyla.properties.id == data.id) {
                            // $scope.images = [];
                            $scope.getImages();
                        }
                    });

                    /*
                     * Add image to the kyla
                     */
                    $scope.addImage = function() {
                        ModalService.imgUploadModal('kyla', $scope.kyla);
                    };

                    /*
                     * Open the selected image for viewing
                     */
                    $scope.openImage = function(image) {
                        ModalService.imageModal(image, 'kyla', $scope.kyla, $scope.permissions, $scope.images);
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

                    $scope.selectKiinteisto = function(kiinteisto) {
                        if (!$scope.edit) {
                            KiinteistoService.fetchKiinteisto(kiinteisto.properties.id).then(function(kiinteisto) {
                                EntityBrowserService.setQuery('kiinteisto', kiinteisto.properties.id, {'kyla_id': $scope.kyla.properties.id, 'rivi': kiinteistoFilterParameters['rivi'], 'rivit': kiinteistoFilterParameters['rivit']}, $scope.kiinteistoTable.total());
                                ModalService.kiinteistoModal(kiinteisto, null);
                            }, function error(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString("error.Opening_estate_failed"), AlertService.message(data));
                                });
                            });
                        }
                    };

                    $scope.selectRakennus = function(rakennus) {
                        if (!$scope.edit) {
                            RakennusService.fetchRakennus(rakennus.properties.id).then(function(rakennus) {
                                EntityBrowserService.setQuery('rakennus', rakennus.properties.id, {'kyla_id': $scope.kyla.properties.id, 'rivi': rakennusFilterParameters['rivi'], 'rivit': rakennusFilterParameters['rivit']}, $scope.rakennusTable.total());
                                ModalService.rakennusModal(true, rakennus, null, null);
                            }, function error(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString("error.Opening_building_failed"), AlertService.message(data));
                                });
                            });
                        }
                    };

                    $scope.selectAlue = function(alue) {
                        if (!$scope.edit) {
                            AlueService.fetchAlue(alue.properties.id).then(function(alue) {
                                EntityBrowserService.setQuery('alue', alue.properties.id, {'kyla_id': $scope.kyla.properties.id, 'rivi': alueFilterParameters['rivi'], 'rivit': alueFilterParameters['rivit']}, $scope.alueTable.total());
                                ModalService.alueModal(true, alue);
                            }, function error(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString("error.Opening_area_failed"), AlertService.message(data));
                                });
                            });
                        }
                    };

                    $scope.selectArvoalue = function(arvoalue) {
                        if (!$scope.edit) {
                            ArvoalueService.fetchArvoalue(arvoalue.properties.id).then(function(arvoalue) {
                                EntityBrowserService.setQuery('arvoalue', arvoalue.properties.id, {'kyla_id': $scope.kyla.properties.id, 'rivi': arvoalueFilterParameters['rivi'], 'rivit': arvoalueFilterParameters['rivit']}, $scope.arvoalueTable.total());
                                ModalService.arvoalueModal(true, arvoalue);
                            }, function error(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString("error.Opening_valuearea_failed"), AlertService.message(data));
                                });
                            });
                        }
                    };


                    // Fetch permissions to view other entities (rakennus, alue, arvoalue, kiinteisto) separately
                    // and set them as they become available to prevent this modal from taking forever to open...
                    $scope.showRakennukset = false;
                    $scope.showAlueet = false;
                    $scope.showArvoalueet = false;
                    $scope.showKiinteistot = false;

                    /*
                     * Totals for each entity type
                     */
                    $scope.kiinteistoTotal = 0;
                    $scope.rakennusTotal = 0;
                    $scope.alueTotal = 0;
                    $scope.arvoalueTotal = 0;

                    $scope.currentLocale = locale.getLocale();

                    /*
                     * Change the table visibility
                     */
                    $scope.showTable = function(name) {
                        $scope.visibleRakennus = false;
                        $scope.visibleAlue = false;
                        $scope.visibleArvoalue = false;
                        $scope.visibleKiinteisto = false;
                        switch (name) {
                            case 'kiinteisto':
                                $scope.visibleKiinteisto = true;
                                break;
                            case 'rakennus':
                                $scope.visibleRakennus = true;
                                break;
                            case 'alue':
                                $scope.visibleAlue = true;
                                break;
                            case 'arvoalue':
                                $scope.visibleArvoalue = true;
                                break;
                            default:
                                $scope.visibleKiinteisto = true;
                                $scope.visibleRakennus = true;
                                $scope.visibleAlue = true;
                                $scope.visibleArvoalue = true;
                                break;
                        }
                    };
                    $scope.showTable();

                    var kiinteistoFilterParameters = null;
                    $scope.kiinteistoTable = new NgTableParams({
                        page : 1,
                        count : 50,
                        total : 25
                    }, {
                        counts : [
                                10, 25, 50, 100
                        ],
                        getData : function($defer, params) {
                            if (!$scope.create) {
                                Auth.checkPermissions("rakennusinventointi", "kiinteisto").then(function(permissions) {
                                    if (permissions.katselu) {
                                        $scope.showKiinteistot = true;

                                        kiinteistoFilterParameters = ListService.parseParameters(params);
                                        KylaService.getKiinteistotOfKyla($scope.kyla.properties.id, kiinteistoFilterParameters).then(function(data) {

                                            var orderedData = params.sorting() ? $filter('orderBy')(data.features, params.orderBy()) : data.features;

                                            params.total(data.total_count);

                                            if (data.total_count) {
                                                $scope.kiinteistoTotal = data.total_count;
                                            }

                                            $defer.resolve(orderedData);
                                        }, function(data) {
                                            locale.ready('error').then(function() {
                                                AlertService.showError(locale.getString("error.Getting_estates_failed"), AlertService.message(data));
                                            });
                                            orderedData = [];
                                            $defer.resolve(orderedData);
                                        });
                                    }
                                });
                            }
                        }
                    });

                    var rakennusFilterParameters = null;
                    $scope.rakennusTable = new NgTableParams({
                        page : 1,
                        count : 50,
                        total : 25
                    }, {
                        counts : [
                                10, 25, 50, 100
                        ],
                        getData : function($defer, params) {
                            if (!$scope.create) {
                                Auth.checkPermissions("rakennusinventointi", "rakennus").then(function(permissions) {
                                    if (permissions.katselu) {
                                        $scope.showRakennukset = true;

                                        rakennusFilterParameters = ListService.parseParameters(params);
                                        KylaService.getRakennuksetOfKyla($scope.kyla.properties.id, rakennusFilterParameters).then(function(data) {
                                            var orderedData = params.sorting() ? $filter('orderBy')(data.features, params.orderBy()) : data.features;
                                            params.total(data.total_count);
                                            if (data.total_count) {
                                                $scope.rakennusTotal = data.total_count;
                                            }

                                            $defer.resolve(orderedData);
                                        }, function(data) {
                                            locale.ready('error').then(function() {
                                                AlertService.showError(locale.getString("error.Getting_villages_buildings_failed"), AlertService.message(data));
                                            });
                                            orderedData = [];
                                            $defer.resolve(orderedData);
                                        });
                                    }
                                });
                            }
                        }
                    });

                    var alueFilterParameters = null;
                    $scope.alueTable = new NgTableParams({
                        page : 1,
                        count : 50,
                        total : 25
                    }, {
                        counts : [
                                10, 25, 50, 100
                        ],
                        getData : function($defer, params) {
                            if (!$scope.create) {
                                Auth.checkPermissions("rakennusinventointi", "alue").then(function(permissions) {
                                    if (permissions.katselu) {
                                        $scope.showAlueet = true;

                                        alueFilterParameters = ListService.parseParameters(params);
                                        KylaService.getAlueetOfKyla($scope.kyla.properties.id, alueFilterParameters).then(function(data) {
                                            var orderedData = params.sorting() ? $filter('orderBy')(data.features, params.orderBy()) : data.features;
                                            params.total(data.total_count);
                                            if (data.total_count) {
                                                $scope.alueTotal = data.total_count;
                                            }
                                            $defer.resolve(orderedData);
                                        }, function(data) {
                                            locale.ready('error').then(function() {
                                                AlertService.showError(locale.getString("error.Getting_areas_failed"), AlertService.message(data));
                                            });
                                            orderedData = [];
                                            $defer.resolve(orderedData);
                                        });
                                    }
                                });
                            }
                        }
                    });

                    var arvoalueFilterParameters = null;
                    $scope.arvoalueTable = new NgTableParams({
                        page : 1,
                        count : 50,
                        total : 25
                    }, {
                        counts : [
                                10, 25, 50, 100
                        ],
                        getData : function($defer, params) {
                            if (!$scope.create) {
                                Auth.checkPermissions("rakennusinventointi", "arvoalue").then(function(permissions) {
                                    if (permissions.katselu) {
                                        $scope.showArvoalueet = true;

                                        arvoalueFilterParameters = ListService.parseParameters(params);
                                        KylaService.getArvoalueetOfKyla($scope.kyla.properties.id, arvoalueFilterParameters).then(function(data) {
                                            var orderedData = params.sorting() ? $filter('orderBy')(data.features, params.orderBy()) : data.features;
                                            params.total(data.total_count);
                                            if (data.total_count) {
                                                $scope.arvoalueTotal = data.total_count;
                                            }
                                            $defer.resolve(orderedData);
                                        }, function(data) {
                                            locale.ready('error').then(function() {
                                                AlertService.showError(locale.getString("error.Getting_valueareas_failed"), AlertService.message(data));
                                            });
                                            orderedData = [];
                                            $defer.resolve(orderedData);
                                        });
                                    }
                                });
                            }
                        }
                    });

                    $scope.getColumnName = function(column) {
                        return ListService.getColumnName(column);
                    };

                    $scope.showMuutoshistoria = function() {
                        MuutoshistoriaService.getKylaMuutosHistoria($scope.kyla.properties.id).then(function(historia) {
                            ModalService.kylaMuutoshistoriaModal(historia, $scope.kyla.properties.kylanumero);
                        });
                    };

                }

        ]);
