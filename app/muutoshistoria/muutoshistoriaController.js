/*
 * Controller for the kiinteistöt. 
 */
angular.module('mip.muutoshistoria').controller(
    'MuutoshistoriaController',
    [
        '$scope',
        '$q',
        '$location',
        'CONFIG',
        '$http',
        'ModalService',
        'AlertService',
        'MuutoshistoriaService',
        '$timeout',
        '$rootScope',
        'olData',
        '$popover',
        'hotkeys',
        'locale',
        '$filter',
        '$route',
        'historia',
        'title',
        'selectedModalNameId',
        function($scope, $q, $location, CONFIG, $http, ModalService, AlertService, MuutoshistoriaService, $timeout, 
        		$rootScope, olData, $popover, hotkeys, locale, $filter, $route, historia, title, selectedModalNameId) {
           
        	$scope.title = title;
        	$scope.historia = historia;

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
    ]
).directive('mipHistoryHeader', function() {
	return {
		scope: {
			headerInfo: '=item'
		},
		templateUrl: "pages/templates/historyheader.html"
	};	
}).directive('mipHistoryUpdatedFields', function() {
	return {
		scope: {
			historyitem: '=item'
		},
		templateUrl: 'pages/templates/historyupdatedfields.html'
	};	
});
