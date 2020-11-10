angular.module('mip.login').controller('LoginInfoController', [
        '$scope', 'locale', 'ModalService', 'selectedModalNameId', function($scope, locale, ModalService, selectedModalNameId) {

            // Unique modal id which is used for the collapsible panels
            $scope.modalId = ModalService.getNextModalId();
            
            // Valitun modalin nimi ja järjestysnumero
            $scope.modalNameId = selectedModalNameId;
            
            $scope.close = function() {
                // Sulkee modaalin ja poistaa listalta
                ModalService.closeModal($scope.modalNameId);
                $scope.$destroy();
            };

        }
]);
