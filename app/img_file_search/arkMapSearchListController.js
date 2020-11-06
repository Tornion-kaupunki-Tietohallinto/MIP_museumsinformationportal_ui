angular.module('mip.search').controller('arkMapSearchListController', [
	'$scope', '$rootScope', '$route', '$location', 'locale', 'CONFIG', 'ModalService', 'SearchService', 'AlertService', '$q', 'NgTableParams', 'ListService', 'KarttaService',
	function ($scope, $rootScope, $route, $location, locale, CONFIG, ModalService, SearchService, AlertService, $q, NgTableParams, ListService, KarttaService) {
		/*
		 * TAB BAR
		 */
		locale.ready('common').then(function() {
			$rootScope.setActiveTab(locale.getString('common.Search'));
			$rootScope.setActiveSubTab(locale.getString('ark.Archeology_maps'));
		});

		 var vm = this;

		 vm.activeTab = 'kohde_tab';

		/*
		 * TABLE FOR LISTING KUVAT
		 */
        var filterParameters = null;
		vm.kartatTable = new NgTableParams({
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


                vm.promise = KarttaService.getArkKartat(filterParameters);
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
						AlertService.showWarning(locale.getString('common.Error'), AlertService.message(data));
					});
					orderedData = [];
					$defer.resolve(orderedData);
				});
			}
		});

		ListService.getOptions('ark_karttatyyppi').then(function success(options) {
            vm.karttatyypit = options;
        }, function error(data) {
            locale.ready('error').then(function() {
            	//TODO
            });
        });

		ListService.getOptions('ark_mittakaava').then(function success(options) {
            vm.mittakaavat = options;
        }, function error(data) {
            locale.ready('error').then(function() {
                // TODO
            });
        });

		/*
         * Open the selected image for viewing.
         * Select the related object using advanced AI and heuristics
         */
        vm.openKartta = function(kartta) {
        	if(kartta.properties.tutkimukset) {
        		ModalService.arkKarttaModal(kartta, 'tutkimus', kartta.properties.tutkimukset, kartta.properties.oikeudet, [kartta], kartta.properties.tutkimukset.id);
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
            vm.kartatTable.reload();
        };

        vm.getColumnName = function(column, file) {
			return ListService.getColumnName(column, file);
		};

	}
]);
