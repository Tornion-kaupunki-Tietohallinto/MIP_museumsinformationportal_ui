angular.module('mip.directives').directive('mipYksikkoValitsin', [
        'locale', 'YksikkoService', 'AlertService', '$rootScope', function(locale, YksikkoService, AlertService, $rootScope) {
            /**
             * Direktiivi jolla voi valita yksiköitä ja löytöjä
             */
            function link(scope, elem, attrs) {
            	if(scope.valitutYksikot === undefined || scope.valitutYksikot === null) {
            		scope.valitutYksikot = [];
            	}

            	//Onko vähintään 1 linkkaus pakollinen
            	if(scope.req === undefined) {
            		scope.req = true;
            	}

            	//Mihin muihin entiteetteihin ko. itemi on linkattu (yksiköt, löydöt)
            	scope.linkedNayteCount = 0;
            	scope.linkedLoytoCount = 0;

            	$rootScope.$on('mip-linkitys', function (event, data) {
            		//Tämä entiteetti kyseessä
            		if(data.entityId && data.entityId === scope.entityId && data.mode === scope.mode) {
            			scope.linkedLoytoCount = data.loytoCount;
            			scope.linkedNayteCount = data.nayteCount;
            		}
            	});


                 //Käytetään yksikkoServicessä määritettyä dYksikkoCachea
                 scope.yksikkoHaku = function(yhaku){
                     YksikkoService.haeYksikot({'yksikkotunnus': yhaku,'tutkimus_id': scope.tutkimusId}, 'dYksikkoCache').then(function (result) {
                    	 scope.yhakutulos = [];
                     	 var tmp = [];
	                   	 tmp = result.features.filter(function(i) {
	                   		 return scope.valitutYksikot.map(function(e) {
	                   			 return e.id;
	                   		 }).indexOf(i.properties.id) < 0;
	                   	 });

	                   	 for (var i = 0; i<tmp.length; i++) {
	                   		 scope.yhakutulos.push(tmp[i].properties);
	                   	 }
                     });
                 };

                 scope.addItemBackToList = function(item, model) {
                     for (var i = 0; i < model.length; i++) {
                         if (model[i].id == item.id) {
                             return;
                         }
                     }
                     model.push(item);
                 };

                 scope.addYksikko = function(yksikko) {
                	scope.valitutYksikot.push(yksikko);
                	$rootScope.$broadcast('mip-linkitys', {
                		 mode : scope.mode,
	           			 entityId : scope.entityId,
	           			 nayteCount : scope.linkedNayteCount,
	           			 yksikkoCount : scope.valitutYksikot.length,
	           			 loytoCount : scope.linkedLoytoCount
	           		 });
                 };

                 //Huom: ui-selectin bugin takia listalta poistetaan elementti ennen kuin poiston tekevä
             	 //metodi suoritetaan https://github.com/angular-ui/ui-select/issues/463
                 //ui-selectin model on valitutLoydot, mutta silti se palauttaa erillisen modellin jota on muokattu.
                 //jos ollaan poistamassa viimeistä linkatttua elementtiä, palautetaan viimeisin poistettu elementti
                 //ja näytetään ilmoitus että vimoista linkkausta ei voida poistaa.
                 //Samalla ylläpidetään scopen modelia jossa elementit on (valitutYksikot)
                 scope.deleteYksikko = function(itemToDelete, list) {
                	 if(list.length === 0 && scope.linkedLoytoCount === 0 && scope.linkedNayteCount === 0 && scope.req === true) {
                		 list.push(itemToDelete);
                		 AlertService.showWarning(locale.getString('common.Cannot_remove_last_linked_item'));
                	 } else {
                		 scope.valitutYksikot = list;
                		 $rootScope.$broadcast('mip-linkitys', {
                			 mode : scope.mode,
    	           			 entityId : scope.entityId,
    	           			 nayteCount : scope.linkedNayteCount,
    	           			 yksikkoCount : scope.valitutYksikot.length,
    	           			 loytoCount : scope.linkedLoytoCount
    	           		 });
                	 }
                };
            }
            return {
                restrict : 'E',
                link : link,
                scope : {
                    valitutYksikot: '=',
                    entityId : '=',
                    tutkimusId: '=',
                	mode : '=',
                    dis : '=',
                    req: '=?'
                },
                transclude: true,
                templateUrl : 'ark/directives/yksikkovalitsin/mipyksikkovalitsin.html'
            };
        }
]);