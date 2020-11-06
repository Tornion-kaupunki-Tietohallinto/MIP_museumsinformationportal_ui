/*
 * Controller for the raportit list
 */
angular.module('mip.raportti').controller(
        'RaporttiListController',
        [
                '$scope', 'TabService', '$location', 'CONFIG', 'NgTableParams', 'RaporttiService', 'ModalService', 'AlertService', 'ListService', 'locale', 'Auth', 'CacheFactory', '$rootScope', 'UserService',
                '$filter',
                function($scope, TabService, $location, CONFIG, NgTableParams, RaporttiService, ModalService, AlertService, ListService, locale, Auth, CacheFactory, $rootScope, UserService, $filter) {

                    /*
                     * TAB BAR
                     */
                    locale.ready('common').then(function() {
                        $rootScope.setActiveTab(locale.getString('common.Reports'));
                        $rootScope.setActiveSubTab(locale.getString('common.Reports'));
                    });

                    /*
                     * Pelkästään tutkijat ja pääkäyttäjät voivat luoda raportteja
                     */
                    $scope.voiLuodaRaportteja = false;
                    if(UserService.getProperties().user.rooli == 'tutkija' || UserService.getProperties().user.rooli == 'pääkäyttäjä' ||
                    		UserService.getProperties().user.rooli == 'inventoija' ||
                    		UserService.getProperties().user.ark_rooli == 'pääkäyttäjä' || UserService.getProperties().user.ark_rooli == 'tutkija') {
                        $scope.voiLuodaRaportteja = true;
                    }

                    $scope.addRaportti= function() {
                        ModalService.raporttiModal();
                    };

                    /*
                     * Select a report for download.
                     */
                    $scope.downloadReport= function(reportRequest) {
                        RaporttiService.downloadReport(reportRequest);
                    };
                    /*
                     * Select a report to delete.
                     */
                    $scope.deleteReport = function(reportrequest) {
                        RaporttiService.deleteReport(reportrequest.id).then(function(data) {
                            $scope.raportitTable.reload();
                            AlertService.showInfo(locale.getString('common.Report_deleted_successfully'));
                        }, function error(data) {
                            AlertService.showError(locale.getString('error.Delete_report_failed'), AlertService.message(data));
                        });
                    };

                    /*
                     * Cancel the request. Triggered automatically when the search params are modified.
                     */
                    $scope.cancelRequest = function() {
                        $scope.promise.cancel()
                    };

                    /*
                     * TABLE FOR LISTING KUNNAT
                     */
                    var filterParameters = null;
                    $scope.raportitTable = new NgTableParams({
                        page : 1,
                        count : 1000,
                        total : 25
                    }, {
                        counts: [],
                        defaultSort : "asc",
                        getData : function($defer, params) {
                            // Create object with the currently selected filters. Used for generating the url.
                            filterParameters = ListService.parseParameters(params);

                            if($scope.promise !== undefined) {
                                $scope.cancelRequest();
                            }

                            $scope.promise = RaporttiService.getRaportit();
                            $scope.promise.then(function(data) {
                                $scope.searchResults = data.length;

                                // no sorting, it is done in backend
                                params.total(data.length);
                                $defer.resolve(data);
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
                     * Refresh the table data, no cache used
                     */
                    $scope.refreshTable = function() {
                        $scope.raportitTable.reload();
                    };

                    $scope.getColumnName = function(column) {
                        return ListService.getColumnName(column);
                    };

                    $scope.$on('Update_data', function(event, data) {
                        if (data.type == 'raportti') {
                            $scope.raportitTable.reload();
                        }
                    });

}]);
