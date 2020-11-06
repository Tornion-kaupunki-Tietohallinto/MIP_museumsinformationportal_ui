angular.module('mip.directives').directive('mipTekijanoikeuslausekevalitsin', ['locale', 'TekijanoikeuslausekeService', 'UserService', 'locale', 
		function(locale, TekijanoikeuslausekeService, UserService, locale) {
    /*
     * Tekijänoikeuslausekkeen valitsin.
     * Haetaan aina ensin käyttäjän tiedoista mahdollista lausekettä ja näytetään se oletuksena.
     */
     function link(scope, elem, attrs) { 
    	 if(scope.valittulauseketeksti === undefined || scope.valittulauseketeksti === null) {
    		 scope.valittulauseketeksti = "";
    	 }
    	 
    	 scope.lausekkeet = [];

         TekijanoikeuslausekeService.getLausekkeet({osio:scope.osio}).then(function(data) {

    	     var props = UserService.getProperties();
    	     if(props.user.tekijanoikeuslauseke){

    	    	var otsikko = locale.getString('common.User_copyright_clause');  
    	    	 
    	    	var kayttajanLauseke = {'properties' : {'id': -1, 'otsikko': otsikko, 'lauseke': props.user.tekijanoikeuslauseke}};
    	    	scope.lausekkeet.push(kayttajanLauseke);
    	    	
    	    	scope.valittulauseke = kayttajanLauseke;
    	    	scope.valittulauseketeksti = props.user.tekijanoikeuslauseke;
    	     };
        	 
        	 if(data.features){
                 for(i=0; i < data.features.length; i++){
                 	scope.lausekkeet.push(data.features[i]);
                 }
             }
         });
         
         scope.lausekeChanged = function() {
        	 //Lauseke on valittu
        	 if(scope.valittulauseke && scope.valittulauseke.properties) {
        		 scope.valittulauseketeksti = scope.valittulauseke.properties.lauseke;
        	 } else { //Valitaan tyhjä 
        		 scope.valittulauseke = null;
        		 scope.valittulauseketeksti = "";
        	 }
         };
     }
     return {
        restrict: 'E',
        link : link,
        scope: {
            valittulauseketeksti : '=',
            dis : '=',
            osio : '='
        },
        transclude: true,
        templateUrl: 'directives/tekijanoikeuslausekevalitsin/miptekijanoikeuslausekevalitsin.html'        
    };
}]);