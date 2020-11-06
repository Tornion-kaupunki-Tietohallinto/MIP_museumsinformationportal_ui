angular.module('mip.directives').directive('mipKylakuntavalitsin', ['locale', 'KuntaService', 'KylaService', function(locale, KuntaService, KylaService) {
    /*
     * Kunta-kyläparien valitsin
     */
     function link(scope, elem, attrs) {
         //This array holds the actual selections and also the kyla-options for each kyla-kunta-group
         //They are added to the scope.raportti before the request is sent
         if(!scope.kylakuntaselections) {
             scope.kylakuntaselections = [];
         }

         scope.addKylaKuntaSelection = function() {
             var k = {
                 'kyla' : null,
                 'kunta' : null,
                 'kylaOptions' : []
             };
             scope.kylakuntaselections.push(k);
         };

         function kylaOptionsCallBackCreator(index) {
             return function(kylaOptions) {
                 // clear it
                 scope.kylakuntaselections[index].kylaOptions.length = 0;

                 // fill it
                 // TODO: remove all such kyla options from this list that are used in some
                 // other combo, because duplicates are not allowed
                 for (var i = 0; i < kylaOptions.features.length; i++) {
                     var k = {
                         'id' : kylaOptions.features[i].properties.id,
                         'nimi' : kylaOptions.features[i].properties.nimi,
                         'kylanumero' : kylaOptions.features[i].properties.kylanumero
                     };
                     scope.kylakuntaselections[index].kylaOptions.push(k);
                 }
             };
         }

         scope.kunnat = [];
         KuntaService.getKunnat().then(function(data) {
             for (var i = 0; i < data.features.length; i++) {
                 var k = {
                     'id' : data.features[i].properties.id,
                     'nimi' : data.features[i].properties.nimi,
                     'kuntanumero' : data.features[i].properties.kuntanumero
                 };
                 scope.kunnat.push(k);
             }
         });

         /*
          * kunta has been changed, update kunta name and kyla selections
          */
         scope.kuntaChanged = function(index) {
        	 if(index === undefined){
        		 index = scope.kylakuntaselections.length - 1;
        	 }
             scope.updateKylat(index);
         };

         scope.setFn({DirFn: scope.kuntaChanged});

         /*
          * update kyla selections of kylaselector at specified index
          */
         scope.updateKylat = function(index) {
             if (!scope.kylakuntaselections[index].kunta) {
                 scope.kylakuntaselections[index].kylaOptions.length = 0;
                 return;
             }

             var kuntaId = scope.kylakuntaselections[index].kunta.id;
             var params = {
                 'rivit' : 1000000,
                 'jarjestys' : 'nimi'
             };
             var promise = KuntaService.getKylatOfKunta(kuntaId, params);
             var callback = kylaOptionsCallBackCreator(index);

             promise.then(callback, function(data) {
                 locale.ready('common').then(function() {
                     AlertService.showError(locale.getString('kyla.Fetching_villages_failed'), AlertService.message(data));
                 });
             });

         };

         //Täytetään valintalistat kun tullaan näkymään esim edit-moodista.
         for(var i = 0; i<scope.kylakuntaselections.length; i++) {
             scope.kylakuntaselections[i].kylaOptions = [];
             scope.kuntaChanged(i);
         }



         scope.deleteKylaKuntaSelection = function(index) {
             scope.kylakuntaselections.splice(index, 1);
         };
     }
     return {
        restrict: 'E',
        link : link,
        scope: {
            kylakuntaselections : '=',
            multiple: '=',
            setFn: '&'
        },
        transclude: true,
        templateUrl: 'directives/kylakuntavalitsin/kylakuntavalitsin.html'
    };
}]);