/*
 * Controller for the dropdown admin list
 */
angular.module('mip.general').controller('DropdownListController', [
		'$scope', 'TabService', '$location', 'CONFIG', 'AlertService', 'ListService', '$filter', 'NgTableParams', 'locale', '$rootScope',
		function ($scope, TabService, $location, CONFIG, AlertService, ListService, $filter, NgTableParams, locale, $rootScope) {
			/*
			 * TAB BAR
			 */
			locale.ready('common').then(function() {
				$rootScope.setActiveTab(locale.getString('common.Administration'));
				$rootScope.setActiveSubTab(locale.getString('common.Selection_lists'));
			});

			$scope.edit_object = {
				'properties' : {}
			};
			$scope.edit_object_orig = {};
			/*
			 * Helper function to find out the object from the lists
			 */
			$scope.findObject = function (id, listName) {
				var list = $scope.lists[listName];

				if (list) {
					var value;

					for (var i = 0; i < list.values.length; i++) {
						var v = list.values[i];

						if (v.properties.id == id) {
							value = v;
							break;
						}
					}

					if (value) {
						return value;
					}
				}
				return null;
			};

			/*
			 * Edit a row from a list
			 */
			$scope.edit = function (id, listName) {
			    $scope.edit_object = $scope.findObject(id, listName);
				$scope.edit_object_orig = angular.copy($scope.edit_object);
			};
			/*
			 * Cancel editing
			 */
			$scope.cancel_edit = function (id, listName) {
				//TODO: PROBLEM WITH THE $SCOPE.EDIT_OBJECT.ID
				
				// If it's a created object, remove it completely
				if ($scope.edit_object.id.indexOf(listName + "_") > -1) {
					delete $scope.edit_object;
					$scope.edit_object_orig = {
						'properties' : {}
					};
				} else {
					// Reset to the original values
					for ( var property in $scope.edit_object_orig) {
						if ($scope.edit_object.hasOwnProperty(property)) {
							$scope.edit_object[property] = angular.copy($scope.edit_object_orig[property]);
						}
					}
					// Clear the edit object
					$scope.edit_object = {
						'properties' : {}
					};
					// Clear the orig object
					$scope.edit_object_orig = {};
				}
			}
			/*
			 * Helper function for showing / hiding fields and buttons
			 */
			$scope.editing = function (id) {
				if ($scope.edit_object.properties.id == id) {
					return true;
				} else {
					return false;
				}
			}

			// Generate temporary ids to facilitate immediate edit mode
			$scope.nextTempId = 0;

			/*
			 * Add a new value to a list
			 */
			$scope.add = function (listName) {
				
				// generate a temporary id
				var tempId = listName + "_" + $scope.nextTempId++;

				var newRow = {
					properties : {
						id : tempId,
						arvo_fi : '',
						arvo_se : ''
					}
				};
				$scope.lists[listName].values.push(newRow);

				// switch the new value to edit mode
				$scope.edit(tempId, listName);
			};

			/*
			 * Save the value
			 */
			$scope.save = function (values, listName) {
				// TODO: do not POST new values with fake ids, they should be PUT
				// and the id fetched from the backend after saving
				
				// After saving
				$scope.edit_object = {
					'properties' : {}
				};
			};

			/*
			 * Dropdown lists
			 */
			$scope.lists = {
				arvotus : {
					values : []
				},
				kate : {
					values : []
				}
			};

			ListService.getOptions('arvotus').then(function success (data) {
				$scope.lists['arvotus'].values = data.features;
			});

			ListService.getOptions('kate').then(function success (data) {
				$scope.lists['kate'].values = data.features;
			});
			// TODO: Edit the following as the ones above.
			$scope.kattotyyppiList = [];
			ListService.getOptions('kattotyyppi').then(function success (data) {
				$scope.kattotyyppiList = data.features;
			});
			$scope.kuntoList = [];
			ListService.getOptions('kunto').then(function success (data) {
				$scope.kuntoList = data.features;
			});
			$scope.kayttotarkoitusList = [];
			ListService.getOptions('käyttötarkoitus').then(function success (data) {
				$scope.kayttotarkoitusList = data.features;
			});
			$scope.nykyinen_tyyliList = [];
			ListService.getOptions('nykyinen_tyyli').then(function success (data) {
				$scope.nykyinen_tyyliList = data.features;
			});
			$scope.perustusList = [];
			ListService.getOptions('perustus').then(function success (data) {
				$scope.perustusList = data.features;
			});
			$scope.porrastyyppiList = [];
			ListService.getOptions('porrastyyppi').then(function success (data) {
				$scope.porrastyyppiList = data.features;
			});
			$scope.rakennustyyppiList = [];
			ListService.getOptions('rakennustyyppi').then(function success (data) {
				$scope.rakennustyyppiList = data.features;
			});
			$scope.rakentajalajiList = [];
			ListService.getOptions('rakentajalaji').then(function success (data) {
				$scope.rakentajalajiList = data.features;
			});
			$scope.rakentajatyyppiList = [];
			ListService.getOptions('rakentajatyyppi').then(function success (data) {
				$scope.rakentajatyyppiList = data.features;
			});
			$scope.runkoList = [];
			ListService.getOptions('runko').then(function success (data) {
				$scope.runkoList = data.features;
			});
			$scope.tilatyyppiList = [];
			ListService.getOptions('tilatyyppi').then(function success (data) {
				$scope.tilatyyppiList = data.features;
			});
			$scope.vuorausList = [];
			ListService.getOptions('vuoraus').then(function success (data) {
				$scope.vuorausList = data.features;
			});
		}
]);