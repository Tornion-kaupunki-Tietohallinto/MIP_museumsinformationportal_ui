angular.module('mip.search').controller('arkSearchListController', [
	'$scope', '$rootScope', '$route', '$location', 'locale', 'CONFIG', 'ModalService', 'SearchService', 'AlertService', '$q', 'NgTableParams', 'ListService', 'FileService',
	function ($scope, $rootScope, $route, $location, locale, CONFIG, ModalService, SearchService, AlertService, $q, NgTableParams, ListService, FileService) {
		/*
		 * TAB BAR
		 */
		locale.ready('common').then(function() {
			$rootScope.setActiveTab(locale.getString('common.Search'));
			$rootScope.setActiveSubTab(locale.getString('common.Archeology_images'));
		});

		 var vm = this;

		 vm.activeTab = 'kohde_tab';
		 vm.showMode = 'list';

		 vm.toggleShowMode = function() {
			 if(vm.showMode === 'list') {
				 vm.showMode = 'thumbs';
			 } else {
				 vm.showMode = 'list';
			 }
		 };

		/*
		 * TABLE FOR LISTING KUVAT
		 */
        var filterParameters = null;
		vm.kuvatTable = new NgTableParams({
			page : 1,
			count : 50,
			total : 25,
			// must have the filter and its properties defined, otherwise the directives
            // cannot bind into it
            filter : {
            	properties : {
            		kohde_id: null,
            		tutkimus_id: null
            	}
            }
		}, {
			defaultSort : "asc",
			getData : function($defer, params) {
				// Create object with the currently selected filters. Used for generating the url.
				filterParameters = ListService.parseParameters(params);
				filterParameters['searchPage'] = true;

				if($scope.promise !== undefined) {
                    $scope.cancelRequest();
                }

				 //Save the search parameters to the service.
                //ListService.saveKuntaSearchParameters(filterParameters);


                vm.promise = FileService.getArkImages(filterParameters);
                vm.promise.then(function(data) {

				    if (data.count) {
                        vm.searchResults = data.count;
                    } else {
                        vm.searchResults = 0;
                    }
				    // no sorting, it is done in backend
					params.total(data.total_count);
					$defer.resolve(data.features);
				}, function(data) {
					locale.ready('common').then(function() {
						AlertService.showWarning(locale.getString('common.Error'),AlertService.message(data));
					});
					orderedData = [];
					$defer.resolve(orderedData);
				});
			}
		});

		/*
         * Open the selected image for viewing.
         * Select the related object using advanced AI and heuristics
         */
        vm.openImage = function(image) {
        	if(image.properties.kuvakohteet.length > 0) {
        		var kohde = { 'properties': image.properties.kuvakohteet[0].kohde };
        		ModalService.arkImageModal(image, 'kohde', kohde, image.properties.oikeudet, [image], null);
        	} else if(image.properties.tutkimukset) {
        		ModalService.arkImageModal(image, 'tutkimus', image.properties.tutkimukset, image.properties.oikeudet, [image], image.properties.tutkimukset.id);
        	} else if(image.properties.loydot.length > 0) {
        		ModalService.arkImageModal(image, 'loyto', image.properties.loydot[0], image.properties.oikeudet, [image], image.properties.loydot[0].ark_tutkimus_id);
        	} else if(image.properties.naytteet.length > 0) {
        		ModalService.arkImageModal(image, 'nayte', image.properties.naytteet[0], image.properties.oikeudet, [image], image.properties.naytteet[0].ark_tutkimus_id);
        	}
        };

        /*
         * Clear the save search properties from the service and
         * reapply the cleared filters.
         */
        vm.clearSearchFilter = function() {
            ListService.clearProps();
            var filter = { 'properties' : {} };
            angular.extend(vm.kuvatTable.filter(), filter);
        };

        /*
         * Refresh the table data
         */
        vm.refreshTable = function() {
            vm.kuvatTable.reload();
        };

        vm.getColumnName = function(column, file) {
			return ListService.getColumnName(column, file);
		};

	}
]);
