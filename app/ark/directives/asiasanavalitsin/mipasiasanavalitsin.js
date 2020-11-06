angular.module('mip.directives').directive('mipAsiasanavalitsin', ['locale', 'ListService', function(locale, ListService) {
    /*
     * Tekijänoikeuslausekkeen valitsin
     */
     function link(scope, elem, attrs) {

    	 if(scope.asiasanat == null || scope.asiasanat == undefined) {
    		 scope.asiasanat = [];
    	 }

    	 /**
          * Asiasanojen haku
          */
         scope.hakusana = "";
         scope.hakutulos = [];
         scope.hakutuloksia = 0;
         scope.fintoHaku = function(haku){
     		// Haku Finto sanastosta
             ListService.queryAsiasana(haku).then(function (result) {
                 scope.hakutulos = poistaDuplikaatit(result);

                 scope.hakutuloksia = scope.hakutulos.length;

                 scope.hakutulos = scope.asiasanat.concat(scope.hakutulos);
             });
         };

         scope.valitseAsiasana = function(asiasana) {
        	 scope.asiasanat.push(asiasana);
         };

         scope.poistaAsiasana = function(asiasana) {
        	 for(var i = 0; i<scope.asiasanat.length; i++) {
        		 if(scope.asiasanat[i] === asiasana) {
        			 scope.asiasanat.splice(i, 1);
        			 break;
        		 }
        	 }
         };

         /*
          * Tuplien poisto asiasanoista
          */
         function poistaDuplikaatit(asiasanat){
             var uniikit = Array.from(new Set(asiasanat));
             return uniikit;
         };
     }
     return {
        restrict: 'E',
        link : link,
        scope: {
            asiasanat : '=',
            dis : '='
        },
        transclude: true,
        templateUrl: 'ark/directives/asiasanavalitsin/mipasiasanavalitsin.html'
    };
}]);