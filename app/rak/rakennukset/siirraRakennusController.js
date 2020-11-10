/*
 * Controller for the fetched details of the kiinteisto. 
 */
angular.module('mip.rakennus').controller('SiirraRakennusController', [
        '$scope', 
        'RakennusService', 
        'AlertService', 
        'locale', 
        'rakennus',
		'ModalService',
		'selectedModalNameId',
        function($scope, RakennusService, AlertService, locale, rakennus, ModalService, selectedModalNameId) {

            $scope.rakennus = rakennus;
                        
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

            /*
             * Cancel view mode
             */
            $scope.close = function() {
            	// Sulkee modaalin ja poistaa listalta
            	ModalService.closeModal($scope.modalNameId);
                $scope.$destroy();
            };
            
            /*
             * Save changes
             */
            $scope.save = function() {
                $scope.disableButtonsFunc();

                RakennusService.moveRakennus($scope.rakennus.properties.id, $scope.kiinteistotunnus, $scope.palstanumero).then(function(data) {

                    $scope.disableButtonsFunc();
                    // Sulkee modaalin ja poistaa listalta
                    ModalService.closeModal($scope.modalNameId);
                    $scope.$destroy();

                }, function error(data) {
                    
                    locale.ready('common').then(function() {
                        AlertService.showError(locale.getString('common.Error'), AlertService.message(data));
                    });

                    $scope.disableButtonsFunc();
                });
            };
        }
]);
