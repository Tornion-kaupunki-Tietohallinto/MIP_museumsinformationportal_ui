/*
 * Controller for the dropdown admin list
 */
angular.module('mip.general').controller('ArkDropdownListController', [
		'$scope', 'TabService', '$location', 'CONFIG', 'AlertService', 'ListService', '$filter', 'NgTableParams', 'locale', '$rootScope',
		function ($scope, TabService, $location, CONFIG, AlertService, ListService, $filter, NgTableParams, locale, $rootScope) {
			/*
			 * TAB BAR
			 */
			locale.ready('common').then(function() {
				$rootScope.setActiveTab(locale.getString('common.Administration'));
				$rootScope.setActiveSubTab(locale.getString('common.Ark_selection_lists'));
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
			 * Delete an object from a list. Used only for deleting
			 * yet unsaved objects; does nothing backend-wise.
			 */
			$scope.deleteFromList = function (id, listName) {
				var list = $scope.lists[listName];

				if (list) {
					var index = null;

					for (var i = 0; i < list.values.length; i++) {
						var v = list.values[i];

						if (v.properties.id == id) {
							index = i;
							break;
						}
					}

					if (index != null) {
						list.values.splice(index, 1);
					}
				}
			}

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
				// If it's a created object, remove it completely
				if (String($scope.edit_object.properties.id).indexOf(listName + "_") > -1) {
					$scope.deleteFromList(id, listName);
					
					$scope.edit_object = {
						'properties': {}
					};
					$scope.edit_object_orig = {
						'properties' : {}
					};
				} else {
					// Reset to the original values
					for ( var property in $scope.edit_object_orig.properties) {
						if ($scope.edit_object.properties.hasOwnProperty(property)) {
							$scope.edit_object.properties[property] = angular.copy($scope.edit_object_orig.properties[property]);
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
			$scope.save = function (id, listName) {
				var object = $scope.findObject(id, listName);
				
				ListService.saveArkListOption(listName, object).then(function success(response) {
					object.properties["id"] = response.data.properties.id;
				});

				// After saving
				$scope.edit_object = {
					'properties' : {}
				};
			};
			
			/*
			 * Delete an option for real
			 */
			$scope.deleteOption = function(id, listName) {
				var object = $scope.findObject(id, listName);
				
				ListService.deleteArkListOption(listName, object).then(function success(response) {
					$scope.deleteFromList(id, listName);
				});

				// After saving
				$scope.edit_object = {
					'properties' : {}
				};
			}

			/*
			 * Dropdown lists
			 */
			$scope.lists = {
				projektityyppi : {
					values : []
				},
				yksikkotyyppi : {
					values : []
				},
				talteenottotapa : {
					values : []
				},
				yksikon_elinkaari : {
					values : []
				},
				loytokategoria : {
					values : []
				},
				keramiikkatyyppi : {
					values : []
				},
				ocmluokka : {
					values : []
				},
				laatu : {
					values : []
				},
				loytotyyppi : {
					values : []
				},
				materiaali : {
					values : []
				},
				konservoinninprioriteetti : {
					values : []
				},
				konservoinninlaatuluokka : {
					values : []
				},
				konservoinninkiireellisyys : {
					values : []
				}
			};
			
			/*
			 * A helper function to call ListService.getArkOptions for an arbitrary
			 * number of times.
			 */
			$scope.getArkOptions = function() {
			    for (var i = 0; i < arguments.length; i ++) {
			    	ListService.getArkOptions(arguments[i]).then(function success (data) {
						$scope.lists[data[0]].values = data[1].features;
					});
			    }
			}
			
			$scope.getArkOptions('projektityyppi', 'yksikkotyyppi', 'talteenottotapa', 'yksikon_elinkaari',
					'loytokategoria', 'keramiikkatyyppi', 'ocmluokka', 'laatu', 'loytotyyppi', 'materiaali',
					'konservoinninprioriteetti', 'konservoinninlaatuluokka', 'konservoinninkiireellisyys');
		}
]);