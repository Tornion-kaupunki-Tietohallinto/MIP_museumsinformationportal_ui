angular.module('mip.inventointiprojekti').directive('mipInventointiprojektivalitsin', ['locale', 'InventointiprojektiService', function(locale, InventointiprojektiService) {
    /*
     * Inventointiprojektin valitsinkenttä 
     */
     function link(scope, elem, attrs) {         
         //This variable holds the selected inventointiprojekti
         
         scope.inventointiprojektiselection = null;

         
         scope.inventointiprojektit = [];
         scope.getInventointiprojektit = function(search) {
             var searchObj = {'rivit': 25, 'jarjestys': 'nimi'};
             if(search) {
                 searchObj['nimi'] = search
             }
             var ipPromise = InventointiprojektiService.getInventointiprojektit(searchObj); 
             ipPromise.then(function success(results) {
                 scope.inventointiprojektit.length = 0;

                 /*
                  * Stripataan propertyt pois - ui-select ei meinaa toimia niiden kanssa.
                  */
                 for(var i = 0; i<results.features.length; i++) {
                     scope.inventointiprojektit.push(results.features[i].properties);
                 }         
             });
         };
         
         scope.getInventointiprojektit();
         
         /*
          * Set the selected inventointiprojekti when the ui-select selection is done. Doesn't seem to work without this for some reason (scope/parentscope etc...)
          */
         scope.setInventointiprojektiselection = function(item) {
             scope.inventointiprojektiselection = item;
         }
     }
     return {
        restrict: 'E',
        link : link,
        scope: {
            inventointiprojektiselection : '=',
            multiple: '=', //Not implemented
            isrequired: '='
        },
        transclude: true,
        templateUrl: 'rak/directives/mipinventointiprojektivalitsin/inventointiprojektivalitsin.html'        
    };
}]);