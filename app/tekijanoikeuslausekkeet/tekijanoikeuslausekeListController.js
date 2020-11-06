/*
 * TekijanoikeuslausekeListController
 */

angular.module('mip.general').controller(
        'TekijanoikeuslausekeListController',
        [
                '$scope', '$http', 'CONFIG', 'TekijanoikeuslausekeService', 'TabService', '$location', '$filter',
                'NgTableParams', 'ListService', 'AlertService', 'locale', '$rootScope', 'Auth', 'ListControllerService',
                function($scope, $http, CONFIG, TekijanoikeuslausekeService, TabService, $location, $filter,
                		NgTableParams, ListService, AlertService, locale, $rootScope, Auth, ListControllerService) {

                    var vm = this;

                    /**
                     * Setup-metodi - ajetaan vain kertaalleen
                     */
                    vm.setUp = function() {

                        angular.extend(vm, ListControllerService);
                        vm.updateTabs('common.Administration', 'common.Copyright_clauses');

                    }
                    locale.ready('common').then(function() {
                        vm.setUp();
                    });

                    vm.editObj = null;
                    vm.originalObj = null;

                    vm.osiot = [{
                    	'label': locale.getString('common.Common'),
                    	'value': ""
                    }, {
                    	'label': locale.getString('common.Archeology'),
                    	'value': 'arkeologia'
                    }, {
                    	'label': locale.getString('common.Building_inventory'),
                    	'value': 'rakennusinventointi'
                    }]

                    /**
                     * Cancel the request. Triggered automatically when the search params are modified.
                     */
                    vm.cancelRequest = function() {
                        vm.promise.cancel()
                    };

                    /**
                     * Lausekkeet table
                     */
                    vm.lausekkeetTable = new NgTableParams({
                        page : 1,
                        count : 50,
                        total : 25,
                    }, {
                        defaultSort : "asc",
                        getData : function($defer, params) {
                            filterParameters = ListService.parseParameters(params);

                            if(vm.promise !== undefined) {
                                vm.cancelRequest();
                            }

                            vm.lausekkeetPromise = TekijanoikeuslausekeService.getLausekkeet(filterParameters);
                            vm.lausekkeetPromise.then(function(data) {

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

                    vm.addLauseke = function() {
                    	var lauseke = {properties: {'id': null, 'lauseke': '', 'osio': ''}};
                    	vm.lausekkeetTable.data.push(lauseke);
                    	vm.editLauseke(lauseke)
                    };

                    vm.editLauseke = function (lauseke) {
                    	vm.originalObj = angular.copy(lauseke);
                    	vm.editObj = lauseke;
                    };

                    vm.saveLauseke = function() {
                    	if(vm.editObj !== null) {
                    		TekijanoikeuslausekeService.saveLauseke(vm.editObj.properties).then(function s(data) {
                    			vm.lausekkeetTable.reload();
                    			vm.editObj = null;
                    		}, function e(data) {
                    			AlertService.showInfo(locale.getString('common.Error'));
                    		});
                    	}
                    };

                    vm.cancelEdit = function(lauseke) {
                    	//Lauseke joka äsken lisättiin
                    	if(lauseke.properties.id === null) {
                    		vm.lausekkeetTable.data.pop();
                    	}
                    	lauseke = angular.copy(vm.originalObj);
                    	vm.editObj = null;
                    }

                    vm.deleteLauseke = function(lauseke) {
                    	var conf = confirm(locale.getString('common.Confirm_delete2', {'item': lauseke.properties.otsikko}));
                        if (conf) {
                            TekijanoikeuslausekeService.deleteLauseke(lauseke).then(function() {
                                AlertService.showInfo(locale.getString('common.Deleted'));
                                vm.lausekkeetTable.reload();
                            });
                        }
                    };

                    $scope.$on('Update_data', function(event, data) {
                        if (data.type == 'tekijanoikeuslauseke') {
                            vm.lausekkeetTable.reload();
                        }
                    });



}]);