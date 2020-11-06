/*
 * Controller for the fetched details of the kiinteisto. 
 */
angular.module('mip.kohde').controller('MuinaisjaannosFeatureInfoController', [
        '$scope', '$rootScope', 'data', 'locale', 'kohde', 
        'modalId', 'ModalService', 'selectedModalNameId', '$timeout',
        function($scope, $rootScope, data, locale, kohde, 
                modalId, ModalService, selectedModalNameId, $timeout) {
            
            var vm = this;
            // Unique modal id which is used for the collapsible panels
            vm.modalId = ModalService.getNextModalId();
            
            // Valitun modalin nimi ja järjestysnumero
            vm.modalNameId = selectedModalNameId;
           
            vm.data = data;

            /*
             * -------------------------- OPERATIONS ------------------------------
             */
            
            
            /**
             * ModalHeader kutsuu scopesta closea
             */
            $scope.close = function() {
                ModalService.closeModal(vm.modalNameId);
                $scope.$destroy();
            };

            // SAVE
            /*    
            $scope.save = function(result, modalNameId) {
                /*
                 * Broadcast the selected building. The receiving end will select which properties to use.
                 */
                /*
                $rootScope.$broadcast('Rakennustiedot_modified', {
                    'rakennus' : result,
                    'modalId' : modalId
                });

                // Sulkee modaalin ja poistaa listalta
                ModalService.closeModal(modalNameId);
                $scope.$destroy();
            };
            */
        }
]);
