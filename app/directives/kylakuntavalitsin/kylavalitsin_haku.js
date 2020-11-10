angular.module('mip.directives').directive('mipKylavalitsin', ['locale', 'KuntaService', 'KylaService', '$rootScope', function(locale, KuntaService, KylaService, $rootScope) {
    /*
     * Kylavalitsin, reagoi myös kylävalitsimelta tuleviin broadcastattuihin eventteihin.
     */
     function link(scope, elem, attrs) {

    	//Kylalista
    	 scope.kylat = [];
    	//Metodi joka hakee kylät, hakusana search voi olla kylän nimi tai kylänumero
         scope.getKylat = function(search) {
         	scope.kylat.length = 0;
         	var s = {
                 'rivit' : 200,
                 'jarjestys' : 'nimi',
             };
             if (search) {
             	if(isNaN(search)) {
             		s['nimi'] = search;
             	} else {
             		s['kylanumero'] = search;
             	}
             }

             //Jos hakuehdoissa on kunta asetettuna, haetaan kyseisen kunnan kylät, muutoin haetaan yleisesti kyliä
             if(scope.props.kuntaId) {
             	KuntaService.getKylatOfKunta(scope.props.kuntaId, s).then(function success(kylat) {
                     for (var i = 0; i < kylat.features.length; i++) {
                         scope.kylat.push(kylat.features[i].properties);
                     }
                 }, function error(data) {
                     locale.ready('error').then(function() {
                         AlertService.showError(locale.getString("error.Getting_villages_failed"), AlertService.message(data));
                     })
                 });
             } else {
                 KylaService.getKylat(s).then(function success(kylat) {
                     for (var i = 0; i < kylat.features.length; i++) {
                         scope.kylat.push(kylat.features[i].properties);
                     }
                 }, function error(data) {
                     locale.ready('error').then(function() {
                         AlertService.showError(locale.getString("error.Getting_villages_failed"), AlertService.message(data));
                     })
                 });
             }
         };

         scope.getKylat();

         //Kylä asetettu, broadcastataan pyyntö asettaa kunta kyseisen kylän kunnaksi
         scope.setKyla = function(kyla) {
        	if(kyla) {
        		$rootScope.$broadcast('setKunta', {kunta: kyla.kunta});
        	}
         };

         //Kunta valittu kuntavalitsimessa, haetaan asetetun kunnan kylät
         $rootScope.$on('getKylat', function() {
        	 scope.getKylat();
         });
     }
     return {
        restrict: 'E',
        link : link,
        scope: {
            props : '='
        },
        transclude: true,
        templateUrl: 'directives/kylakuntavalitsin/kylavalitsin_haku.html'
    };
}]);
