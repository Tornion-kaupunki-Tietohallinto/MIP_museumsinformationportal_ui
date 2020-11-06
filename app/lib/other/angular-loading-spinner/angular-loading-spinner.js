(function(){
    angular.module('ngLoadingSpinner', ['angularSpinner'])
    .directive('usSpinner',   ['$http', '$rootScope' ,function ($http, $rootScope){
        return {
            link: function (scope, elm, attrs)
            {
                $rootScope.spinnerActive = false;
                scope.isLoading = function () {
                    /*
                     * BEGIN MIP MODIFICATION
                     *  We do not use keys for the spinner, we only have one 'global' spinner.
                     *  When the report statuses are checked on the background, we do not want to show the spinner. Therefore this change.
                     *  
                     *  Check if the url contains /raportti/xxx/tila 
                     *  If it contains 
                     *      do not increase the counter
                     *  Else 
                     *      increase the counter
                     */
                    var count = 0;
                    var pattern = /.+\/raportti\/[\d]+\/tila/;
                    for(var i = 0; i<$http.pendingRequests.length; i++) {
                        if(!pattern.test($http.pendingRequests[i].url)) {
                            count++;
                        }
                    }
                    return count > 0;
                    /*
                     * END MIP MODIFICATION
                     */
                    //Original code:
                    //return $http.pendingRequests.length > 0;
                };

                scope.$watch(scope.isLoading, function (loading)
                {
                    $rootScope.spinnerActive = loading;
                    if(loading){
                        elm.removeClass('ng-hide');
                    }else{
                        elm.addClass('ng-hide');
                    }
                });
            }
        };

    }]);
}).call(this);
