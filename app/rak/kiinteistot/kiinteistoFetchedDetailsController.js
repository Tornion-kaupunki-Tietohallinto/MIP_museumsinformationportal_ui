/*
 * Controller for the fetched details of the kiinteisto. 
 */
angular.module('mip.kiinteisto').controller('KiinteistoFetchedDetailsController', [
		'$scope', 
		'$rootScope', 
		'data', 
		'kiinteisto', 
		'modalId',
		'ModalService',
		'selectedModalNameId',
		function ($scope, $rootScope, data, kiinteisto, modalId, ModalService, selectedModalNameId) {
			// modalId is the id of the modal "window" that asked the data
			if (data.features) {
				$scope.results = data.features;
				$scope.modal_id = modalId;
			}
			
            // Unique modal id which is used for the collapsible panels
            $scope.modalId = ModalService.getNextModalId();
			
            // Valitun modalin nimi ja järjestysnumero
            $scope.modalNameId = selectedModalNameId;
			
			// Close
			$scope.close = function () {
            	// Sulkee modaalin ja poistaa listalta
            	ModalService.closeModal($scope.modalNameId);
				$scope.$destroy();
			};

			// SAVE
			$scope.save = function (result, modalNameId) {
				
				var omistajat = "";
				if (result.properties.omistajat && result.properties.omistajat.length>0) {
					for (var i=0; i<result.properties.omistajat.length; i++) {
						if (i>0) {
							omistajat += "\n";
						}
						omistajat += result.properties.omistajat[i].etunimet;
						omistajat += " ";
						omistajat += result.properties.omistajat[i].sukunimi;
					}
				}
				/*
				 * Broadcast the modified data to scopes
				 */
				$rootScope.$broadcast('Kiinteistotiedot_modified', {
					'modalId' : $scope.modal_id, // the modal that asked the data
					'kiinteistotunnus' : result.properties.kiinteistotunnus,
					'omistajatiedot' : omistajat,
					'kunta' : result.properties.kunta,
					'kuntatunnus' : result.properties.kuntatunnus,
					'nimi': result.properties.nimi
				});
				
            	// Sulkee modaalin ja poistaa listalta
            	$scope.close(); 
				$scope.$destroy();
			}
		}
]);
