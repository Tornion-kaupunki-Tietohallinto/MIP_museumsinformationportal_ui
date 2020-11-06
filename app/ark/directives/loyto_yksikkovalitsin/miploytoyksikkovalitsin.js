angular.module('mip.directives').directive('mipLoytoYksikkoValitsin', [
        'locale', 'LoytoService', 'YksikkoService', 'AlertService', function(locale, LoytoService, YksikkoService, AlertService) {
            /**
             * Direktiivi jolla voi valita yksiköitä ja löytöjä
             */
            function link(scope, elem, attrs) {
            	if(scope.valitutLoydot === undefined || scope.valitutLoydot === null) {
            		scope.valitutLoydot = [];
            	}

            	if(scope.valitutYksikot === undefined || scope.valitutYksikot === null) {
            		scope.valitutYksikot = [];
            	}

                scope.loytoHaku = function(lhaku){
                     LoytoService.haeLoydot({'luettelointinumero': lhaku, 'ark_tutkimus_id': scope.tutkimusId}).then(function (result) {
                    	 scope.lhakutulos = [];
                    	 for (var i = 0; i<result.features.length; i++) {
                    		 scope.lhakutulos.push(result.features[i].properties);
                    	 }
                     });
                 };

                 //Käytetään yksikkoServicessä määritettyä dYksikkoCachea
                 scope.yksikkoHaku = function(yhaku){
                     YksikkoService.haeYksikot({'yksikkotunnus': yhaku,'ark_tutkimus_id': scope.tutkimusId}, 'dYksikkoCache').then(function (result) {
                     	scope.yhakutulos = [];
                    	 	for (var i = 0; i<result.features.length; i++) {
                    	 		scope.yhakutulos.push(result.features[i].properties);
                    	 	}
                     });
                 };


                 scope.addLoyto = function(loyto) {
                	 scope.valitutLoydot.push(loyto);
                 };

                 scope.addYksikko = function(yksikko) {
                	scope.valitutYksikot.push(yksikko);
                 };

                 //Huom: ui-selectin bugin takia listalta poistetaan elementti ennen kuin poiston tekevä
             	 //metodi suoritetaan https://github.com/angular-ui/ui-select/issues/463
                 //ui-selectin model on valitutLoydot, mutta silti se palauttaa erillisen modellin jota on muokattu.
                 //jos ollaan poistamassa viimeistä linkatttua elementtiä, palautetaan viimeisin poistettu elementti
                 //ja näytetään ilmoitus että vimoista linkkausta ei voida poistaa.
                 //Samalla ylläpidetään scopen modelia jossa elementit on (valitutLoydot)
                 scope.deleteLoyto = function(itemToDelete, list) {
                	 if(list.length === 0 && scope.valitutYksikot.length === 0) {
                		 list.push(itemToDelete);
                		 AlertService.showWarning(locale.getString('common.Cannot_remove_last_linked_item'));
                	 } else {
                		 scope.valitutLoydot = list;
                	 }
                 };

                 //Huom: ui-selectin bugin takia listalta poistetaan elementti ennen kuin poiston tekevä
             	 //metodi suoritetaan https://github.com/angular-ui/ui-select/issues/463
                 //ui-selectin model on valitutLoydot, mutta silti se palauttaa erillisen modellin jota on muokattu.
                 //jos ollaan poistamassa viimeistä linkatttua elementtiä, palautetaan viimeisin poistettu elementti
                 //ja näytetään ilmoitus että vimoista linkkausta ei voida poistaa.
                 //Samalla ylläpidetään scopen modelia jossa elementit on (valitutYksikot)
                 scope.deleteYksikko = function(itemToDelete, list) {
                	 if(list.length === 0 && scope.valitutLoydot.length === 0) {
                		 list.push(itemToDelete);
                		 AlertService.showWarning(locale.getString('common.Cannot_remove_last_linked_item'));
                	 } else {
                		 scope.valitutYksikot = list;
                	 }
                };
            }
            return {
                restrict : 'E',
                link : link,
                scope : {
                    valitutLoydot: '=',
                    valitutYksikot: '=',
                    tutkimusId: '=',
                    dis : '='
                },
                transclude: true,
                templateUrl : 'ark/directives/loyto_yksikkovalitsin/miploytoyksikkovalitsin.html'
            };
        }
]);