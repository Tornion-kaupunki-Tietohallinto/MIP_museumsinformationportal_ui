/*
 * ARK puolen korien listaus controller. Korit välilehden avaus.
 */
angular.module('mip.kori').controller('ArkKoriListController', [
		'$scope', '$controller',
		function($scope, $controller) {
			
			var vm = this;
			
            /**
             * Setup-metodi
             */
            vm.setUp = function() {

            	// Logiikka löytyy pääluokasta KoriListController
            	angular.extend(this, $controller('KoriListController', {$scope: $scope}));
            	
            	vm.asetaMip('ARK');
            	
	             // Tabin asetus
	             vm.updateTabs('common.Archeology', 'common.Carts');

            };  
            vm.setUp();

		}
]);
