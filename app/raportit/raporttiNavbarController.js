/*
 * Controller for the report status indicator on the navbar
 */
angular.module('mip.raportti').controller(
        'RaporttiNavbarController',
        [
                '$scope', 'RaporttiService', 'locale', 'UserService',
                function($scope,  RaporttiService, locale, UserService) {
                    
                    $scope.showMenu = false; 
                    
                    UserService.getUser().then(function(user) {
                        if(user.rooli !== 'katselija') {
                            $scope.showMenu  = true;
                        }
                    });
                    
                    $scope.reportRequests = RaporttiService.getRunningReports();
                    
                    /*
                     * Select a report for download.
                     */
                    $scope.downloadReport = function(rr) {
                        RaporttiService.downloadReport(rr.id).then(function(url) {
                            window.open(url, '_self');
                        }, function error(data) {
                            console.log("Error: " + data);
                        });
                    };
                    
                }
]);
