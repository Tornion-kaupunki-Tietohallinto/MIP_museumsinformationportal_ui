angular.module('mip.file').controller(
        'arkFileController',
        [
                '$scope', '$rootScope', 'CONFIG', '$http', 'ModalService', 'AlertService', '$timeout', 'FileService', 'file', 'UserService',
                'locale', 'entiteetti_tyyppi', 'entiteetti', 'permissions', 'selectedModalNameId', 'tutkimusId', 'LoytoService', 'NayteService',
                'EntityBrowserService', 'YksikkoService',
                function($scope, $rootScope, CONFIG, $http, ModalService, AlertService, $timeout, FileService, file, UserService,
                        locale, entiteetti_tyyppi, entiteetti, permissions, selectedModalNameId, tutkimusId, LoytoService, NayteService,
                        EntityBrowserService, YksikkoService) {

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
                    $scope.tutkimusId = tutkimusId;

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
                        $timeout(function() {
	                        $rootScope.$broadcast('mip-linkitys', {
	                        	mode : 'tiedosto',
	                        	entityId : $scope.file.properties.id,
	                        	nayteCount : $scope.file.properties.naytteet.length,
	                        	loytoCount : $scope.file.properties.loydot.length,
	                        	yksikkoCount : $scope.file.properties.yksikot.length
	                        });
						},100);
                    };

                    /*
                     * Save changes
                     */
                    $scope.save = function() {
                        FileService.saveArkFile($scope.file).then(function(id) {
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
                        var conf = confirm(locale.getString('common.Confirm_delete2', {'item': file.properties.otsikko}));
                        if (conf) {
                            FileService.deleteArkFile($scope.file.properties.id, CONFIG.ENTITY_TYPE_IDS[$scope.entiteetti_tyyppi], $scope.relatedObject.properties.id).then(function success() {
                            	/*
                                 * Broadcast the modified data to scopes
                                 */
                                $rootScope.$broadcast('arkFile_modified', {
                                	'type': 'poisto',
                                	'fileId': $scope.file.properties.id
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

                    $rootScope.$on('arkFile_modified', function(event, data) {
                    	//Jos poistetaan tiedosto joka on auki, suljetaan ko. dialogi
                		if(data.fileId && data.fileId === $scope.file.properties.id) {
                			if(data.type && data.type === 'poisto') {
                				$scope.close($scope.modalNameId);
                			}
                		}
                    });

                    $scope.avaaLoyto = function(loyto) {
                    	LoytoService.haeLoyto(loyto.id).then(function(l) {
                    		EntityBrowserService.setQuery('loyto', l.properties.id, {'ark_tiedosto_id': $scope.file.properties.id}, $scope.file.properties.loydot.length, $scope.file.properties.loydot);
    						ModalService.loytoModal(l, false);
    					});
                    };

                    $scope.avaaNayte = function(nayte) {
                    	NayteService.haeNayte(nayte.id).then(function(n) {
                    		EntityBrowserService.setQuery('nayte', n.properties.id, {'ark_tiedosto_id': $scope.file.properties.id}, $scope.file.properties.naytteet.length, $scope.file.properties.naytteet);
    						ModalService.nayteModal(n, false);
    					});
                    };

                    $scope.avaaYksikko = function(yksikko) {
                    	YksikkoService.haeYksikko(yksikko.id).then(function(y) {
                    		EntityBrowserService.setQuery('yksikko', y.properties.id, {'ark_tiedosto_id': $scope.file.properties.id}, $scope.file.properties.yksikot.length, $scope.file.properties.yksikot);
    						ModalService.yksikkoModal(y, y.properties.tutkimusalue, $scope.permissions);
    					});
                    };
                }
        ]);