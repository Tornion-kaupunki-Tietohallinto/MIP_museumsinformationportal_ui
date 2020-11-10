angular.module('mip.file').controller(
        'FileController',
        [
                '$scope', '$rootScope', 'CONFIG', '$http', 'ModalService', 'AlertService', '$timeout', 'FileService', 'file', 'UserService',
                'locale', 'entiteetti_tyyppi', 'entiteetti', 'permissions', 'selectedModalNameId',
                function($scope, $rootScope, CONFIG, $http, ModalService, AlertService, $timeout, FileService, file, UserService,
                        locale, entiteetti_tyyppi, entiteetti, permissions, selectedModalNameId) {

                    // Unique modal id which is used for the collapsible panels
                    $scope.modalId = ModalService.getNextModalId();

                    // Valitun modalin nimi ja järjestysnumero
                    $scope.modalNameId = selectedModalNameId;

                    $scope.file = file;
                    $scope.original = angular.copy($scope.file);
                    $scope.entiteetti_tyyppi = entiteetti_tyyppi;
                    $scope.relatedObject = entiteetti;
                    $scope.permissions = permissions;
                    $scope.resizeIcon = "▢";
                    $scope.tags = null;

                    $scope.userRole = UserService.getProperties().user.rooli;

                    $scope.showEditAndDeleteButtons = function() {
                        if (UserService.getProperties().user.id == $scope.file.properties.kayttaja_id && ($scope.userRole == 'inventoija' || $scope.userRole == 'ulkopuolinen tutkija' || $scope.userRole == 'tutkija')) {
                            return true;
                        } else {
                            return false;
                        }
                    };
                    $scope.showEditAndDeleteButtons();

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
                    	// Sulkee modaalin ja poistaa listalta
                    	ModalService.closeModal($scope.modalNameId);
                        $scope.$destroy();
                    };
                    /*
                     * Cancel edit mode
                     */
                    $scope.cancelEdit = function() {
                        // Asetetaan kuvan tiedot alkuperäisiin arvoihin
                        for ( var property in $scope.original) {
                            if ($scope.file.hasOwnProperty(property)) {
                                $scope.file[property] = angular.copy($scope.original[property]);
                            }
                        }
                        $scope.edit = false;
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
                        FileService.saveFile($scope.file).then(function(id) {
                            $scope.edit = false

                            // "update" the original after successful save
                            $scope.original = angular.copy($scope.image);
                        }, function error(data) {
                            locale.ready('common').then(function() {
                                AlertService.showError(locale.getString('common.Error'), AlertService.message(data));
                            });
                        });
                    };

                    /*
                     * Maximize or restore the modal
                     */
                    $scope.resize = function() {
                        $scope.resizeIcon = ModalService.toggleFullScreen($scope.resizeIcon);
                    };

                    /*
                     * Delete
                     */
                    $scope.deleteFile = function(modalNameId) {
                        var conf = confirm(locale.getString('common.Confirm_delete2', {'item': $scope.file.properties.otsikko}));
                        if (conf) {
                            FileService.deleteFile($scope.file.properties.id, CONFIG.ENTITY_TYPE_IDS[$scope.entiteetti_tyyppi], $scope.relatedObject.properties.id).then(function success() {
                                /*
                                 * Broadcast the modified data to scopes
                                 */
                                $rootScope.$broadcast('Tiedosto_modified', {
                                    'id' : $scope.relatedObject.properties.id
                                });

                                $scope.close(modalNameId);
                                locale.ready('common').then(function() {
                                    AlertService.showInfo(locale.getString('common.File_deleted'));
                                });
                            }, function error(data) {
                                locale.ready('common').then(function() {
                                    AlertService.showError(locale.getString('common.Error'), AlertService.message(data));
                                });
                            });
                        }
                    }
                }
        ]);