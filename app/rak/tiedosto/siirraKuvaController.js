/*
 * Controller for the fetched details of the kiinteisto. 
 */
angular.module('mip.file').controller(
        'SiirraKuvaController',
        [
                '$scope', '$rootScope', 'RakennusService', 'KiinteistoService', 'FileService', 'AlertService', 'ModalService', 'locale', 
                'images', 'entiteetti', 'entiteetti_tyyppi', 'kiinteistotunnus', 'selectedModalNameId',
                function($scope, $rootScope, RakennusService, KiinteistoService, FileService, AlertService, ModalService, locale, 
                        images, entiteetti, entiteetti_tyyppi, kiinteistotunnus, selectedModalNameId) {

                    // Unique modal id which is used for the collapsible panels
                    $scope.modalId = ModalService.getNextModalId();
                    
                    // Valitun modalin nimi ja järjestysnumero
                    $scope.modalNameId = selectedModalNameId;
                	  
                    $scope.images = images;// Kuva(t) joka siirretään

                    
                    $scope.entiteetti = entiteetti; // Vanha entiteetti (rakennus / kiinteistö)
                    $scope.entiteetti_tyyppi = entiteetti_tyyppi; // Vanhan entiteetin tyyppi ('rakennus' / 'kiinteisto')
                    $scope.kiinteistotunnus = kiinteistotunnus; // Kiinteistötunnus joka saadaan rakennuksesta / kiinteistöstä. Tähän siirretään

                    // $scope.kohde = 2; //Oletusvalinta

                    $scope.availableOptions = [
                            {
                                "id" : 1,
                                name : locale.getString('common.To_estate')
                            }, {
                                "id" : 2,
                                name : locale.getString('common.To_building')
                            }
                    ];
                    
                    $scope.data = {
                            'palstanumero': null,
                            'inventointinumero': null
                    }
                    
                    $scope.kohde = $scope.availableOptions[1];

                    // Enable / Disable save and cancel buttons while doing operations.
                    $scope.disableButtons = false;
                    $scope.disableButtonsFunc = function() {
                        if ($scope.disableButtons) {
                            $scope.disableButtons = false;
                        } else {
                            $scope.disableButtons = true;
                        }
                    };

                    // Aseta entiteetti_tyyppi_id
                    if (entiteetti_tyyppi == 'rakennus') {
                        $scope.entiteetti_tyyppi_id = 2;
                    } else if (entiteetti_tyyppi == 'kiinteisto') {
                        $scope.entiteetti_tyyppi_id = 1;
                    }

                    /*
                     * Cancel view mode
                     */
                    $scope.close = function() {
                    	// Sulkee modaalin ja poistaa listalta
                    	ModalService.closeModal($scope.modalNameId);
                        $scope.$destroy();
                    };
                    
                    
                    $scope.getImageIds = function() {
                        var imageIds = [];
                        if($scope.images && $scope.images.length > 0) {
                            for(var i = 0; i<$scope.images.length; i++) {
                                var img = $scope.images[i];
                                imageIds.push(img.properties.id);
                            }
                            return imageIds;
                        } else if($scope.images !== null) {
                            imageIds.push($scope.images[0].properties.id);
                            return imageIds;
                        }
                    };

                    /*
                     * Save changes
                     */
                    $scope.save = function(modalNameId) {
                        $scope.disableButtonsFunc();
                                                
                        var imageIds = $scope.getImageIds(); 
                        
                        if(imageIds.length > 1) {
                            FileService.moveKuvat(imageIds, $scope.entiteetti.properties.id, $scope.entiteetti_tyyppi_id, $scope.data.palstanumero, $scope.data.inventointinumero, $scope.kiinteistotunnus).then(function(data) {
                                
                                $scope.disableButtonsFunc();
                                $scope.close(modalNameId);
                               
                                AlertService.showInfo(locale.getString("common.Image_moved_successfully")); 
                            }, function error(data) {
                                locale.ready('common').then(function() {
                                    AlertService.showError(locale.getString('common.Error'), AlertService.message(data));
                                });

                                $scope.disableButtonsFunc();
                            });
                        } else {
                            FileService.moveKuva(imageIds[0], $scope.entiteetti.properties.id, $scope.entiteetti_tyyppi_id, $scope.data.palstanumero, $scope.data.inventointinumero, $scope.kiinteistotunnus).then(function(data) {
                                    
                                $scope.disableButtonsFunc();
                                $scope.close(modalNameId);
 
                                AlertService.showInfo(locale.getString("common.Image_moved_successfully"));           
                            }, function error(data) {
    
                                locale.ready('common').then(function() {
                                    AlertService.showError(locale.getString('common.Error'), AlertService.message(data));
                                });
    
                                $scope.disableButtonsFunc();
                            });
                        }
                    };
                    
                    $scope.clearSelection = function(){
                        if($scope.kohde.id == 1) {
                            //Tyhjää inventointinumero
                            $scope.data.inventointinumero = null;
                        }
                    }
                }
        ]);
