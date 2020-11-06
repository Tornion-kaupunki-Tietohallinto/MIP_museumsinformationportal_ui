/*
 * Controller for the kunta.
 */
angular.module('mip.kunta').controller(
        'KuntaController',
        [
                '$scope',
                '$location',
                'TabService',
                'CONFIG',
                'existing',
                '$http',
                'ModalService',
                'AlertService',
                'KuntaService',
                'NgTableParams',
                'ListService',
                '$filter',
                'KylaService',
                'RakennusService',
                'AlueService',
                'ArvoalueService',
                'KiinteistoService',
                'kunta',
                'locale',
                'permissions',
                'Auth',
                'FileService',
                'MuutoshistoriaService',
                'EntityBrowserService',
                'selectedModalNameId',
                function($scope, $location, TabService, CONFIG, existing, $http, ModalService, AlertService, KuntaService, NgTableParams, ListService, $filter, KylaService, RakennusService, AlueService, ArvoalueService, KiinteistoService, kunta,
                        locale, permissions, Auth, FileService, MuutoshistoriaService, EntityBrowserService, selectedModalNameId) {

                    /*
                     * -------------- INITIALIZATION -------------------------------
                     */
                    // Is the form in edit mode or not
                    $scope.edit = false;

                    // Are we creating a new one or doing legitimate editing?
                    // If this is true, some buttons are hidden.
                    $scope.create = false;

                    // Enable / Disable save and cancel buttons while doing operations.
                    $scope.disableButtons = false;

                    // Unique modal id which is used for the collapsible panels
                    $scope.modalId = ModalService.getNextModalId();

                    // Valitun modalin nimi ja järjestysnumero
                    $scope.modalNameId = selectedModalNameId;

                    // Get the kunta that was selected (if any; will be
                    // empty if creating a new one)
                    if (kunta) {
                        $scope.kunta = kunta;
                    } else {
                        $scope.kunta = {
                            'geometry' : {
                                'coordinates' : []
                            },
                            'properties' : {}
                        }
                    }

                    // Store the original kunta for possible cancel
                    // operation
                    $scope.original = angular.copy($scope.kunta);

                    // existing = true when viewing an existing property
                    // false when creating a new one
                    if (!existing) {
                        $scope.edit = true;
                        $scope.create = true;
                    }

                    // Files for the kunta
                    $scope.files = [];

                    // Store permissions to kunta entities to scope
                    $scope.permissions = permissions;

                    /*
                     * --------------------------- RELATED DATA FUNCTIONALITY ------------------------
                     */
                    // Fetch permissions to view other entities (kyla, rakennus, alue, kiinteisto) separately
                    // and set them as they become available to prevent this modal from taking forever to open...
                    $scope.showKylat = false;
                    $scope.showRakennukset = false;
                    $scope.showAlueet = false;
                    $scope.showKiinteistot = false;
                    $scope.showArvoalueet = false;

                    /*
                     * Totals for each entity type
                     */
                    $scope.kiinteistoTotal = 0;
                    $scope.rakennusTotal = 0;
                    $scope.alueTotal = 0;
                    $scope.arvoalueTotal = 0;
                    $scope.kylaTotal = 0;
                    /*
                     * Change the table visibility
                     */
                    $scope.showTable = function(name) {
                        $scope.visibleRakennus = false;
                        $scope.visibleAlue = false;
                        $scope.visibleArvoalue = false;
                        $scope.visibleKiinteisto = false;
                        $scope.visibleKyla = false;

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
                            case 'kyla':
                                $scope.visibleKyla = true;
                                break;
                            default:
                                $scope.visibleKiinteisto = true;
                                $scope.visibleRakennus = true;
                                $scope.visibleAlue = true;
                                $scope.visibleArvoalue = true;
                                $scope.visibleKyla = true;
                                break;
                        }
                    };
                    $scope.showTable();

                    /*
                     * ------------------- KIINTEISTO -------------------------------------
                     */
                    var kiinteistoFilterParameters = null;
                    $scope.kiinteistoTable = new NgTableParams({
                        page : 1,
                        count : 10,
                        total : 25
                    }, {
                        getData : function($defer, params) {
                            Auth.checkPermissions("rakennusinventointi", "kiinteisto").then(function(permissions) {
                                if (permissions.katselu) {
                                    $scope.showKiinteistot = true;

                                    kiinteistoFilterParameters = ListService.parseParameters(params);

                                    if (!$scope.create) {
                                        KuntaService.getKiinteistotOfKunta($scope.kunta.properties.id, kiinteistoFilterParameters).then(function(data) {
                                            var orderedData = params.sorting() ? $filter('orderBy')(data.features, params.orderBy()) : data.features;
                                            params.total(data.total_count);
                                            if (data.total_count) {
                                                $scope.kiinteistoTotal = data.total_count;
                                            }
                                            $defer.resolve(orderedData);
                                        }, function(data) {
                                            locale.ready('error').then(function() {
                                                AlertService.showError(locale.getString('error.Error'), AlertService.message(data));
                                            });
                                            orderedData = [];
                                            $defer.resolve(orderedData);
                                        });
                                    } else {
                                        orderedData = [];
                                        $defer.resolve(orderedData);
                                    }
                                }
                            });
                        }
                    });

                    $scope.selectKiinteisto = function(kiinteisto) {
                        KiinteistoService.fetchKiinteisto(kiinteisto.properties.id).then(function(kiinteisto) {
                            EntityBrowserService.setQuery('kiinteisto', kiinteisto.properties.id, {'kunta_id': $scope.kunta.properties.id, 'rivi': kiinteistoFilterParameters['rivi'], 'rivit': kiinteistoFilterParameters['rivit']}, $scope.kiinteistoTable.total());
                            ModalService.kiinteistoModal(kiinteisto, null);
                        });
                    };

                    /*
                     * ------------------- RAKENNUS -------------------------------------
                     */
                    var rakennusFilterParameters = null;
                    $scope.rakennusTable = new NgTableParams({
                        page : 1,
                        count : 10,
                        total : 25
                    }, {
                        getData : function($defer, params) {
                            Auth.checkPermissions("rakennusinventointi", "rakennus").then(function(permissions) {
                                if (permissions.katselu) {
                                    $scope.showRakennukset = true;

                                    rakennusFilterParameters = ListService.parseParameters(params);
                                    if (!$scope.create) {
                                        KuntaService.getRakennuksetOfKunta($scope.kunta.properties.id, rakennusFilterParameters).then(function(data) {
                                            var orderedData = params.sorting() ? $filter('orderBy')(data.features, params.orderBy()) : data.features;
                                            params.total(data.total_count);
                                            if (data.total_count) {
                                                $scope.rakennusTotal = data.total_count;
                                            }
                                            $defer.resolve(orderedData);
                                        }, function(data) {
                                            locale.ready('error').then(function() {
                                                AlertService.showError(locale.getString('error.Error'), AlertService.message(data));
                                            });
                                            orderedData = [];
                                            $defer.resolve(orderedData);
                                        });
                                    } else {
                                        orderedData = [];
                                        $defer.resolve(orderedData);
                                    }
                                }
                            });
                        }
                    });

                    $scope.selectRakennus = function(rakennus) {
                        RakennusService.fetchRakennus(rakennus.properties.id).then(function(rakennus) {
                            EntityBrowserService.setQuery('rakennus', rakennus.properties.id, {'kunta_id': $scope.kunta.properties.id, 'rivi': rakennusFilterParameters['rivi'], 'rivit': rakennusFilterParameters['rivit']}, $scope.rakennusTable.total());
                            ModalService.rakennusModal(true, rakennus, null, null);
                        });
                    };

                    /*
                     * ------------------- ALUE -------------------------------------
                     */
                    var alueFilterParameters = null;
                    $scope.alueTable = new NgTableParams({
                        page : 1,
                        count : 10,
                        total : 25
                    }, {
                        getData : function($defer, params) {
                            Auth.checkPermissions("rakennusinventointi", "alue").then(function(permissions) {
                                if (permissions.katselu) {
                                    $scope.showAlueet = true;

                                    alueFilterParameters = ListService.parseParameters(params);
                                    if (!$scope.create) {
                                        KuntaService.getAlueetOfKunta($scope.kunta.properties.id, alueFilterParameters).then(function(data) {
                                            var orderedData = params.sorting() ? $filter('orderBy')(data.features, params.orderBy()) : data.features;
                                            params.total(data.total_count);
                                            if (data.total_count) {
                                                $scope.alueTotal = data.total_count;
                                            }
                                            $defer.resolve(orderedData);
                                        }, function(data) {
                                            locale.ready('error').then(function() {
                                                AlertService.showError(locale.getString('error.Error'), AlertService.message(data));
                                            });
                                            orderedData = [];
                                            $defer.resolve(orderedData);
                                        });
                                    } else {
                                        orderedData = [];
                                        $defer.resolve(orderedData);
                                    }
                                }
                            });
                        }
                    });

                    $scope.selectAlue = function(alue) {
                        AlueService.fetchAlue(alue.properties.id).then(function(alue) {
                            EntityBrowserService.setQuery('alue', alue.properties.id, {'kunta_id': $scope.kunta.properties.id, 'rivi': alueFilterParameters['rivi'], 'rivit': alueFilterParameters['rivit']}, $scope.alueTable.total());
                            ModalService.alueModal(true, alue);
                        });
                    };

                    /*
                     * ------------------- ARVOALUE -------------------------------------
                     */
                    var arvoalueFilterParameters = null;
                    $scope.arvoalueTable = new NgTableParams({
                        page : 1,
                        count : 10,
                        total : 25
                    }, {
                        getData : function($defer, params) {
                            Auth.checkPermissions("rakennusinventointi", "alue").then(function(permissions) {
                                if (permissions.katselu) {
                                    $scope.showArvoalueet = true;

                                    arvoalueFilterParameters = ListService.parseParameters(params);
                                    if (!$scope.create) {
                                        KuntaService.getArvoalueetOfKunta($scope.kunta.properties.id, arvoalueFilterParameters).then(function(data) {
                                            var orderedData = params.sorting() ? $filter('orderBy')(data.features, params.orderBy()) : data.features;
                                            params.total(data.total_count);
                                            if (data.total_count) {
                                                $scope.arvoalueTotal = data.total_count;
                                            }
                                            $defer.resolve(orderedData);
                                        }, function(data) {
                                            locale.ready('error').then(function() {
                                                AlertService.showError(locale.getString('error.Error'), AlertService.message(data));
                                            });
                                            orderedData = [];
                                            $defer.resolve(orderedData);
                                        });
                                    } else {
                                        orderedData = [];
                                        $defer.resolve(orderedData);
                                    }
                                }
                            });
                        }
                    });

                    $scope.selectArvoalue = function(arvoalue) {
                        ArvoalueService.fetchArvoalue(arvoalue.properties.id).then(function(arvoalue) {
                            EntityBrowserService.setQuery('arvoalue', arvoalue.properties.id, {'kunta_id': $scope.kunta.properties.id, 'rivi': arvoalueFilterParameters['rivi'], 'rivit': arvoalueFilterParameters['rivit']}, $scope.arvoalueTable.total());
                            ModalService.arvoalueModal(true, arvoalue);
                        });
                    };

                    /*
                     * ------------------- KYLA -------------------------------------
                     */
                    var kylaFilterParameters = null;
                    $scope.kylaTable = new NgTableParams({
                        page : 1,
                        count : 10,
                        total : 25
                    }, {
                        getData : function($defer, params) {
                            Auth.checkPermissions("rakennusinventointi", "kyla").then(function(permissions) {
                                if (permissions.katselu) {
                                    $scope.showKylat = true;

                                    kylaFilterParameters = ListService.parseParameters(params);
                                    if (!$scope.create) {
                                        KuntaService.getKylatOfKunta($scope.kunta.properties.id, kylaFilterParameters).then(function(data) {
                                            var orderedData = params.sorting() ? $filter('orderBy')(data.features, params.orderBy()) : data.features;
                                            params.total(data.total_count);
                                            if (data.total_count) {
                                                $scope.kylaTotal = data.total_count;
                                            }
                                            $defer.resolve(orderedData);
                                        }, function(data) {
                                            locale.ready('error').then(function() {
                                                AlertService.showWarning("", locale.getString('error.No_villages_found_for_county'));
                                            })
                                            orderedData = [];
                                            $defer.resolve(orderedData);
                                        });
                                    } else {
                                        orderedData = [];
                                        $defer.resolve(orderedData);
                                    }
                                }
                            });
                        }
                    });

                    $scope.selectKyla = function(kyla) {
                        KylaService.fetchKyla(kyla.properties.id).then(function(kyla) {
                            EntityBrowserService.setQuery('kyla', kyla.properties.id, {'kunta_id': $scope.kunta.properties.id, 'rivi': kylaFilterParameters['rivi'], 'rivit': kylaFilterParameters['rivit']}, $scope.kylaTable.total());
                            ModalService.kylaModal(true, kyla, kunta);
                        });
                    };

                    /*
                     * OPERATIONS
                     */

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
                        // Asetetaan kunnan tiedot alkuperäisiin arvoihin
                        for ( var property in $scope.original) {
                            if ($scope.kunta.hasOwnProperty(property)) {
                                $scope.kunta[property] = angular.copy($scope.original[property]);
                            }
                        }

                        $scope.edit = false;
                    };

                    $scope.resizeIcon = "▢";

                    /*
                     * Maximize or restore the modal
                     */
                    $scope.resize = function() {
                        $scope.resizeIcon = ModalService.toggleFullScreen($scope.resizeIcon);
                    };

                    /*
                     * Readonly / edit mode.
                     */
                    $scope.editMode = function() {
                        $scope.edit = true;
                    };

                    /*
                     * Save changes
                     */
                    $scope.save = function() {
                        $scope.disableButtonsFunc();

                        KuntaService.saveKunta($scope.kunta).then(function(id) {
                            AlertService.showInfo(locale.getString('common.Save_ok'), locale.getString('county.County_saved', {
                                name : $scope.kunta.properties.nimi
                            }));
                            $scope.edit = false

                            if ($scope.create) {
                                $scope.kunta.properties["id"] = id;
                                $scope.create = false;
                            }

                            // "update" the original after successful save
                            $scope.original = angular.copy($scope.kunta);

                            $scope.disableButtonsFunc();
                        }, function error(data) {
                            AlertService.showError(locale.getString('common.Error'), AlertService.message(data));
                            $scope.disableButtonsFunc();
                        });
                    };

                    /*
                     * Delete
                     */
                    $scope.deleteKunta = function(modalNameId) {
                        var conf = confirm(locale.getString('common.Confirm_delete2', {'item': $scope.kunta.properties.nimi}));
                        if (conf) {
                            KuntaService.deleteKunta($scope.kunta).then(function() {
                                $scope.close();
                                AlertService.showInfo(locale.getString('county.County_deleted'));
                            }, function error(data) {
                                AlertService.showError(locale.getString('common.Error'), AlertService.message(data));
                            });
                        }
                    };

                    /*
                     * ------------------------- FILE RELATED FUNCTIONS --------------------------------------
                     */

                    /*
                     * Open the selected file for viewing
                     */
                    $scope.openFile = function(file) {
                        ModalService.fileModal(file, 'kunta', $scope.kunta);
                    };

                    /*
                     * Add file to the kunta
                     */
                    $scope.addFile = function() {
                        ModalService.fileUploadModal('kunta', $scope.kunta);
                    };

                    /*
                     * Files were modified, fetch them again
                     */
                    $scope.$on('Tiedosto_modified', function(event, data) {
                        if ($scope.kunta.properties.id == data.id) {
                            $scope.getFiles();
                        }
                    });

                    /*
                     * Files
                     */
                    $scope.getFiles = function() {
                        if ($scope.kunta.properties.id) {
                            FileService.getFiles({
                                'rivit' : 1000,
                                'kunta_id' : $scope.kunta.properties.id
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
                     * --------------------------------- HELPER FUNCTIONS ----------------------------
                     */

                    $scope.disableButtonsFunc = function() {
                        if ($scope.disableButtons) {
                            $scope.disableButtons = false;
                        } else {
                            $scope.disableButtons = true;
                        }
                    };

                    /*
                     * Generate and show direct link to the item
                     */
                    $scope.popover = {
                        title : locale.getString('common.Address'),
                        content : $location.absUrl() + "?modalType=KUNTA&modalId=" + $scope.kunta.properties.id
                    };

                    $scope.getColumnName = function(column) {
                        return ListService.getColumnName(column);
                    };

                    $scope.showMuutoshistoria = function() {
                        MuutoshistoriaService.getKuntaMuutosHistoria($scope.kunta.properties.id).then(function(historia) {
                            ModalService.kuntaMuutoshistoriaModal(historia, $scope.kunta.properties.nimi);
                        });
                    };

                }
        ]);
