angular.module('mip.file').controller(
        'ArkKarttaController',
        [
                '$scope', '$rootScope', 'CONFIG', '$http', 'ModalService', 'AlertService',
                '$timeout', 'KarttaService', 'kartta', 'locale', 'entiteetti_tyyppi', 'entiteetti',
                'permissions', 'UserService', 'karttalista',  'selectedModalNameId', 'tutkimusId',
                'LoytoService', 'YksikkoService', 'NayteService', 'EntityBrowserService',
                function($scope, $rootScope, CONFIG, $http, ModalService, AlertService,
                		$timeout, KarttaService, kartta, locale, entiteetti_tyyppi, entiteetti,
                		permissions, UserService, karttalista, selectedModalNameId, tutkimusId,
                		LoytoService, YksikkoService, NayteService, EntityBrowserService) {

                    // Unique modal id which is used for the collapsible panels
                    $scope.modalId = ModalService.getNextModalId();

                    // Valitun modalin nimi ja järjestysnumero
                    $scope.modalNameId = selectedModalNameId;
                    $scope.kartta = kartta;
                    $scope.original = angular.copy($scope.kartta);
                    $scope.entiteetti_tyyppi = entiteetti_tyyppi;
                    $scope.relatedObject = entiteetti;
                    $scope.permissions = permissions;
                    $scope.resizeIcon = "▢";
                    $scope.tags = null;
                    $scope.tutkimusId = tutkimusId;
                    $scope.userRole = UserService.getProperties().user.ark_rooli;

                    $scope.list = karttalista;

                    $scope.changeKartta = function(kartta) {
                        $scope.kartta = kartta;
                        $scope.original = angular.copy($scope.kartta);
                    };

                    $scope.fixAsiasanat = function() {
                    	var tmpAsiasanat = [];
                    	for(var i = 0; i<$scope.kartta.properties.asiasanat.length; i++) {
                    		if($scope.kartta.properties.asiasanat[i].asiasana) {
                    			tmpAsiasanat.push($scope.kartta.properties.asiasanat[i].asiasana);
                    		} else {
                    			tmpAsiasanat.push($scope.kartta.properties.asiasanat[i]);
                    		}
                    	}
                    	$scope.kartta.properties.asiasanat = tmpAsiasanat;
                    };
                    $scope.fixAsiasanat();

                    $scope.showEditAndDeleteButtons = function() {
                    	//Oman kuvan saa poistaa tai jos permissioneissa sanotaan että edit tai delete
                        if ($scope.permissions.muokkaus || $scope.permissions.poisto) {
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
                    	if(!$scope.kartta.properties.karttatyyppi || !$scope.kartta.properties.karttatyyppi.tyyppi) {
                    		AlertService.showWarning(locale.getString('common.mandatory_value', {'field': locale.getString('common.Type')}))
                    		return ;
                    	}
                    	if(!$scope.kartta.properties.karttanumero) {
                    		AlertService.showWarning(locale.getString('common.mandatory_value', {'field': locale.getString('ark.Map_number')}))
                    		return ;
                    	}
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
                            if ($scope.kartta.hasOwnProperty(property)) {
                                $scope.kartta[property] = angular.copy($scope.original[property]);
                            }
                        }
                        $scope.fixAsiasanat();
                        $scope.edit = false;
                    };

                    /*
                     * Readonly / edit mode.
                     */
                    $scope.editMode = function() {
                        $scope.edit = true;
						$timeout(function() {
						    $rootScope.$broadcast('mip-linkitys', {
						    	mode : 'kartta',
						    	entityId : $scope.kartta.properties.id,
						    	nayteCount : $scope.kartta.properties.naytteet.length,
						    	loytoCount : $scope.kartta.properties.loydot.length,
						    	yksikkoCount : $scope.kartta.properties.yksikot.length
						    });

						}, 100);
                    };

                    /*
                     * Save changes
                     */
                    $scope.save = function() {
                        KarttaService.saveArkKartta($scope.kartta).then(function(id) {
                            $scope.edit = false;

                            // "update" the original after successful save
                            $scope.original = angular.copy($scope.kartta);
                            /*
                             * Broadcast the modified data to scopes
                             */
                            $rootScope.$broadcast('arkKartta_modified', {});
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
                    $scope.deleteKartta = function(modalNameId) {
                        var conf = confirm(locale.getString('common.Confirm_delete2', {'item': $scope.kartta.properties.karttatyyppi.tyyppi + " " + $scope.kartta.properties.karttatyyppi.numero +"."+$scope.kartta.properties.karttanumero}));
                        if (conf) {
                        	var relObjId = $scope.relatedObject.properties !== undefined ? $scope.relatedObject.properties.id : $scope.relatedObject.id;
                            KarttaService.deleteArkKartta($scope.kartta.properties.id, CONFIG.ENTITY_TYPE_IDS[$scope.entiteetti_tyyppi], relObjId).then(function success() {
                            	locale.ready('ark').then(function() {
                                    AlertService.showInfo(locale.getString('ark.Map_deleted'));
                                });

                            	/*
                                 * Broadcast the modified data to scopes
                                 */
                                $rootScope.$broadcast('arkKartta_modified', {
                                	'type': 'poisto',
                                	'karttaId': $scope.kartta.properties.id
                                	});
                            }, function error(data) {
                                locale.ready('common').then(function() {
                                    AlertService.showError(locale.getString('common.Error'), AlertService.message(data));
                                });
                            });
                        }
                    };

                    $rootScope.$on('arkKartta_modified', function(event, data) {
                    	//Jos poistetaan kartta joka on auki, suljetaan ko. dialogi
                		if(data.karttaId && data.karttaId === $scope.kartta.properties.id) {
                			if(data.type && data.type === 'poisto') {
                				$scope.close($scope.modalNameId);
                			}
                		}
                    });

                    $scope.checkUniqueKarttanumero = function(kn) {
                    	if($scope.kartta.properties.karttatyyppi && kn) {
	                    	KarttaService.isArkKarttanumeroUnique({'karttanumero': kn, 'karttaId': $scope.kartta.properties.id, 'ark_tutkimus_id': $scope.tutkimusId, 'tyyppi': $scope.kartta.properties.karttatyyppi.id}).then(function s(data) {
	                    		if(data.properties === true) {
									$scope.form.karttanumero.$setValidity('kaytossa', true);
									$scope.uniqueKarttanumero  = true;
								} else {
									$scope.form.karttanumero.$setValidity('kaytossa', false);
									$scope.uniqueKarttanumero = false;
								}
	                    	}, function e(data) {
	                    		AlertService.showError(locale.getString("common.Error"));
	                    	});
                    	}
                    };

                    $scope.avaaLoyto = function(loyto) {
                    	LoytoService.haeLoyto(loyto.id).then(function(l) {
                    		EntityBrowserService.setQuery('loyto', l.properties.id, {'ark_kartta_id': $scope.kartta.properties.id}, $scope.kartta.properties.loydot.length, $scope.kartta.properties.loydot);
    						ModalService.loytoModal(l, false);
    					});
                    };

                    $scope.avaaYksikko = function(yksikko) {
                    	YksikkoService.haeYksikko(yksikko.id).then(function(y) {
    						ModalService.yksikkoModal(y, y.properties.tutkimusalue, permissions);
    					});
                    };

                    $scope.avaaNayte = function(nayte) {
                    	NayteService.haeNayte(nayte.id).then(function(n) {
                    		EntityBrowserService.setQuery('nayte', n.properties.id, {'ark_kartta_id': $scope.kartta.properties.id}, $scope.kartta.properties.naytteet.length, $scope.kartta.properties.naytteet);
    						ModalService.nayteModal(n, false);
    					});
                    };
                }
        ]);