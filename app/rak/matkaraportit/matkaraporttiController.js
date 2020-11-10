/*
 * Controller for the matkaraportti.
 */
angular.module('mip.matkaraportti').controller(
        'MatkaraporttiController',
        [
                '$scope','$location', 'TabService', 'CONFIG', 'existing', 'ModalService',
                'AlertService', '$filter', 'UserService', '$timeout', 'matkaraportti', 'MatkaraporttiService',
                '$rootScope', 'ListService', 'locale', 'MuutoshistoriaService', 'permissions',
                'KiinteistoService', 'EntityBrowserService', 'kiinteisto', 'selectedModalNameId',
                'RaporttiService',
                function($scope, $location, TabService, CONFIG, existing, ModalService,
                        AlertService, $filter, UserService, $timeout, matkaraportti, MatkaraporttiService,
                        $rootScope, ListService, locale, MuutoshistoriaService, permissions,
                        KiinteistoService, EntityBrowserService, kiinteisto, selectedModalNameId,
                        RaporttiService) {

                    // Unique modal id which is used for the collapsible panels
                    $scope.modalId = ModalService.getNextModalId();

                    // Valitun modalin nimi ja järjestysnumero
                    $scope.modalNameId = selectedModalNameId;

                    // Is the form in edit mode or not
                    $scope.edit = false;

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

                    // existing = true when viewing an existing property
                    // false when creating a new one
                    if (!existing) {
                        $scope.edit = true;
                        $scope.create = true;
                    }

                    if (matkaraportti) {
                        $scope.matkaraportti = matkaraportti;

                    } else {
                        //Fix kiinteisto - remove the properties from it
                        var k = kiinteisto.properties;

                        $scope.matkaraportti = {
                            'properties' : {
                                'kiinteisto_id' : kiinteisto.properties.id,
                                'kiinteisto': k
                            }
                        };
                    }

                    // Store the original alue for possible cancel operation
                    $scope.original = angular.copy($scope.matkaraportti);

                    // Store permissions to alue & arvoalue entities to scope
                    $scope.permissions = permissions;

                    /*
                     * Matkaraportinsyy
                     */
                    $scope.syyOptions = [];

                    $scope.getSyyOptions = function() {
                       ListService.getOptions('matkaraportinsyy').then(function success(options) {
                           $scope.syyOptions = options;
                       }, function error() {
                           locale.ready('error').then(function() {
                               AlertService.showError(locale.getString('common.Get_selection_list_failed', {
                                   cat : locale.getString('common.Reasons')
                               }));
                           });
                       });
                    };
                    $scope.getSyyOptions();

                    /*
                     * Helper function - The original selection list items are filtered so that the already selected items are not present This method puts the items back to the list if/when they are removed.
                     */
                    $scope.addItemBackToList = function(item, model) {
                        for (var i = 0; i < model.length; i++) {
                            if (model[i].id == item.id) {
                                return;
                            }
                        }
                        model.push(item);
                    };

                    $scope.showMuutoshistoria = function() {
                        MuutoshistoriaService.getMatkaraporttiMuutosHistoria($scope.matkaraportti.properties.id).then(function(historia) {
                            ModalService.matkaraporttiMuutoshistoriaModal(historia, $scope.matkaraportti.properties.nimi);
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
                        $scope.showMap = false;
                    	// Sulkee modaalin ja poistaa listalta
                    	ModalService.closeModal($scope.modalNameId);
                        $scope.$destroy();
                    };

                    /*
                     * Cancel edit mode
                     */
                    $scope.cancelEdit = function() {
                        // Asetetaan tiedot alkuperäisiin arvoihin
                        for ( var property in $scope.original) {
                            if ($scope.matkaraportti.hasOwnProperty(property)) {
                                $scope.matkaraportti[property] = angular.copy($scope.original[property]);
                            }
                        }

                        $scope.edit = false;
                    };

                    /*
                     * Readonly / edit mode.
                     */
                    $scope.editMode = function() {
                        $scope.edit = true;
                        $scope.getSyyOptions();
                    };

                    /*
                     * Show kiinteistö
                     */
                    $scope.showKiinteistoModal = function(id) {
                        KiinteistoService.fetchKiinteisto(id).then(function(kiinteisto) {
                            EntityBrowserService.setQuery('kiinteisto', kiinteisto.properties.id, {'matkaraportti_id': $scope.matkaraportti.properties.id}, 1);
                            ModalService.kiinteistoModal(kiinteisto, null);
                        }, function error(data) {
                            locale.ready('error').then(function() {
                                AlertService.showError(locale.getString('error.Opening_estate_failed'), AlertService.message(data));
                            });
                        });
                    };

                    /*
                     * Save changes
                     */
                    $scope.save = function() {
                        $scope.disableButtonsFunc();

                        MatkaraporttiService.saveMatkaraportti($scope.matkaraportti).then(function(id) {

                            if ($scope.create) {
                                $scope.matkaraportti.properties["id"] = id;
                                $scope.create = false;
                            }
                            MatkaraporttiService.fetchMatkaraportti(id).then(function success(data) {
                                $scope.matkaraportti = data;
                            }, function error(data) {
                                locale.ready('common').then(function() {
                                    AlertService.showError(locale.getString('common.Getting_updated_data_failed'), AlertService.message(data));
                                });
                            });

                            $scope.edit = false;

                            // "update" the original after successful save
                            $scope.original = angular.copy($scope.matkaraportti);

                            $scope.disableButtonsFunc();

                            locale.ready('common').then(function() {
                                AlertService.showInfo(locale.getString('common.Save_ok'));
                            });

                        }, function error(data) {
                            locale.ready('common').then(function() {
                                AlertService.showError(locale.getString("common.Save_failed"), AlertService.message(data));
                            });
                            $scope.disableButtonsFunc();
                        });
                    };

                    /*
                     * Delete
                     */
                    $scope.deleteMatkaraportti = function(modalNameId) {
                        var conf = confirm(locale.getString('common.Confirm_delete_travel_report'));
                        if (conf) {
                            MatkaraporttiService.deleteMatkaraportti($scope.matkaraportti).then(function() {
                                locale.ready('common').then(function() {
                                    AlertService.showInfo(locale.getString('common.Deleted'));
                                });
                                $scope.close();
                            }, function error(data) {
                                locale.ready('common').then(function() {
                                    AlertService.showError(locale.getString('common.Delete_fail'), AlertService.message(data));
                                });
                            });
                        }
                    };


                    /*
                     * Create a report
                     */
                    $scope.createReport = function(type, withMap) {
                        var report = {'matkaraporttiId': $scope.matkaraportti.properties.id, 'withMap': withMap, 'requestedOutputType': type, 'reportDisplayName': locale.getString('common.Travel_report') + " " + $scope.matkaraportti.properties.kiinteisto.kiinteistotunnus};
                        RaporttiService.createRaportti('Matkaraportti', report).then(function success(data) {
                            locale.ready('common').then(function() {
                                AlertService.showInfo(locale.getString('common.Report_request_created'));
                            });
                        }, function error(data) {
                            locale.ready('common').then(function() {
                                AlertService.showError(locale.getString('common.Error'), AlertService.message(data));
                            });
                        });
                    };

}]);
