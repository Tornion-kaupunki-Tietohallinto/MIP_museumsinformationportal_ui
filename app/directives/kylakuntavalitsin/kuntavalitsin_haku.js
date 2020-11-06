angular.module('mip.directives').directive('mipKuntavalitsin', ['locale', 'KuntaService', '$rootScope', function(locale, KuntaService, $rootScope) {
    /*
     * Kuntavalitsin, reagoi myös kylävalitsimelta tuleviin broadcastattuihin eventteihin.
     */
     function link(scope, elem, attrs) {

    	 //Kuntalista
    	 scope.kunnat = [];
    	 //Metodi joka hakee kunnat, hakusana search voi olla kunnan nimi tai kuntanumero
         scope.getKunnat = function(search) {
         	scope.kunnat.length = 0;
         	var s = {
                 'rivit' : 100,
                 'jarjestys' : 'nimi',
             };
             if (search) {
             	if(isNaN(search)) {
             		s['nimi'] = search;
             	} else {
             		s['kuntanumero'] = search;
             	}
             }

             KuntaService.getKunnat(s).then(function success(kunnat) {
                 for (var i = 0; i < kunnat.features.length; i++) {
                     scope.kunnat.push(kunnat.features[i].properties);
                 }
             }, function error(data) {
                 locale.ready('error').then(function() {
                     AlertService.showError(locale.getString("error.Getting_counties_failed"), AlertService.message(data));
                 })
             });
         };

         //Asetetaan kunta modelliin. Nos nollaaKyla on true, niin valittuna oleva kylä nollataa
         //Aseta nollaaKylä trueksi, jos kuntaa vaihdetaan käyttöliittymästä ja valittu kylä halutaan nollata.
         //Älä aseta trueksi, jos kylävalitsimesta valitaan kylä, ja kuntavalinta tehdään tämän kylän perusteella (kunnaksi valitaan ko. kylän kunta.)
         scope.setKunta = function(kunta, model, nollaaKyla) {
         	if(kunta) {
         		scope.props.kuntaId = kunta.id;
         	}
         	if(nollaaKyla === true) {
         		scope.props.kylaId = null;
         	}

         	//Broadcastataan kylävalitsimelle komento hakea kylät
         	$rootScope.$broadcast('getKylat');
         };

         //Kylävalitsimelta tulee pyytö asettaa kunta kylän mukaisesti.
         $rootScope.$on('setKunta', function(evt, data) {
        	 if(data.kunta) {
        		 scope.setKunta(data.kunta);
        	 }
         });
     }
     return {
        restrict: 'E',
        link : link,
        scope: {
            props : '='
        },
        transclude: true,
        templateUrl: 'directives/kylakuntavalitsin/kuntavalitsin_haku.html'
    };
}]);
