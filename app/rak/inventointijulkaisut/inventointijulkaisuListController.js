/* 
 * Controller for listing the publications
 */
angular.module('mip.inventointijulkaisu').controller('InventointijulkaisuListController', [
		'$scope', 'TabService', '$filter', 'NgTableParams', 'CONFIG', 'ModalService', 'AlertService', 'InventointijulkaisuService', 'ListService', 'locale', 'Auth', '$rootScope', 'CacheFactory', 'UserService', '$location', 'SessionService', 'EntityBrowserService',
		function($scope, TabService, $filter, NgTableParams, CONFIG, ModalService, AlertService, InventointijulkaisuService, ListService, locale, Auth, $rootScope, CacheFactory, UserService, $location, SessionService, EntityBrowserService) {
		    /*
             * TAB BAR
             */
            locale.ready('common').then(function() {
                $rootScope.setActiveTab(locale.getString('common.Administration'));
                $rootScope.setActiveSubTab(locale.getString('common.Inventory_publications'));
            });

            // will be set to true later if appropriate
            $scope.showCreateNewButton = false;
            $scope.isPaakayttaja = false;

            // Used to force the inventoija users to set the inventointiprojekti before the saving is allowed
            $scope.userRole = UserService.getProperties().user.rooli;
            
            // Redirect unauthorized user
            if($scope.userRole != 'pääkäyttäjä') {                        
                $location.path(SessionService.getDestination()); 
            }                    
            
            /* 
             * Is the user paakayttaja or not (allow listing users and show the create new button)? We can't use the permission check for the users, as everyone has permission to get the users, but only paakayttaja has permission to see them in this view and open the user's properties
             */
            $scope.isPaakayttajaFunc = function() {
                // Get only the inventor's inventory projects
                var role = $filter('uppercase')($scope.userRole);

                angular.forEach(CONFIG.ROLES.PROJECT, function(value, key) {
                    // Below is the U+1F44D way to check. Here is a hack U+1F644
                    if (value == 5 && role == key || value == 5 && role == 'PÄÄKÄYTTÄJÄ') {
                        $scope.isPaakayttaja = true;
                        $scope.showCreateNewButton = true;
                    }
                });
            };
            $scope.isPaakayttajaFunc();

            /*
             * Data for showing the amounts on the screen
             */
            $scope.searchResults = 0;
            
            /*
             * Cancel the request. Triggered automatically when the search params are modified.
             */
            $scope.cancelRequest = function() {
                $scope.promise.cancel()
            };

            /*
             * PUBLICATION LISTING TABLE
             */
            var filterParameters = null;
            $scope.inventointijulkaisutTable = new NgTableParams({
                page : 1,
                count : 25,
                total : 25
            }, {
                defaultSort : "asc",
                getData : function($defer, params) {
//TODO: FIX KAYTTAJA -> JULKAISU
                    Auth.checkPermissions('rakennusinventointi', 'inventointijulkaisu').then(function success(permissions) {
                        /*
                         * If the user is paakayttaja
                         */
                        if (permissions.katselu) {
                            filterParameters = ListService.parseParameters(params);
                            
                            if($scope.promise !== undefined) {
                                $scope.cancelRequest();
                            }
                            
                            //Save the search parameters to the service.
                            ListService.saveInventointijulkaisuSearchParameters(filterParameters);

                            $scope.promise = InventointijulkaisuService.getInventointijulkaisut(filterParameters);
                            $scope.promise.then(function(data) {

                                if (data.count) {
                                    $scope.searchResults = data.count;
                                } else {
                                    $scope.searchResults = 0;
                                }

                                params.total(data.total_count);
                                $defer.resolve(data.features);
                            }, function(data) {
                                locale.ready('common').then(function() {
                                    AlertService.showWarning(locale.getString('common.Error'), AlertService.message(data));
                                });
                                var orderedData = [];
                                $defer.resolve(orderedData);
                            });
                        } else {
                            var orderedData = [];

                            locale.ready('common').then(function() {
                                AlertService.showError(locale.getString('common.Error'), AlertService.message(data));
                            });

                            $defer.resolve(orderedData);
                        }
                    });
                }
            });

            /*
             * When user is selected from the list or a new one is being created
             */
            $scope.selectInventointijulkaisu = function(inventointijulkaisu) {
                if (!inventointijulkaisu) {
                    EntityBrowserService.setQuery('inventointijulkaisu', null, filterParameters, 1);                    
                    ModalService.inventointijulkaisuModal(null);
                } else {
                    if ($scope.isPaakayttaja) { 
                        InventointijulkaisuService.fetchInventointijulkaisu(inventointijulkaisu.properties.id).then(function success(inventointijulkaisu) {
                            EntityBrowserService.setQuery('inventointijulkaisu', inventointijulkaisu.properties.id, filterParameters, $scope.inventointijulkaisutTable.total());
                            ModalService.inventointijulkaisuModal(inventointijulkaisu, true);
                        });
                    }
                }
            }

            $scope.getColumnName = function(column) {
                if(column.indexOf('.') > 0) {
                    var langFile = column.split('.')[0];
                    var col = column.split('.')[1];
                    return ListService.getColumnName(col, langFile);
                }
                return ListService.getColumnName(column);                
            }
            
            /*
             * FETCH SEARCH PARAMS Get the search parameters from the service and assign them automatically
             */
            $scope.getSearchValues = function() {
                var searchProps = ListService.getProps();
                var value = "";
                var filter = {
                    'properties' : {}
                };

              
                if (searchProps['inventointijulkaisunimi']) {
                    filter['properties']['nimi'] = searchProps['inventointijulkaisunimi'];
                }

                angular.extend($scope.inventointijulkaisutTable.filter(), filter);
            }
            $scope.getSearchValues();
            
            /*
             * Clear the save search properties from the service and reapply the cleared filters.
             */
            $scope.clearSearchFilter = function() {
                ListService.clearProps();
                $scope.getSearchValues();               
            };
            
            /*
             * Refresh the table data
             */            
            $scope.refreshTable = function() {
              //Clear the cache
                CacheFactory.get('inventointijulkaisuCache').removeAll();
                $scope.inventointijulkaisutTable.reload();                  
            };
            
            $scope.$on('Update_data', function(event, data) {                        
                if (data.type == 'inventointijulkaisu') {
                    $scope.inventointijulkaisutTable.reload();                    
                }
            });
        }
]);
