angular.module('mip.directives').directive('mipKenttavalitsin', ['locale', function(locale) {
    /*
     * Kenttävalitsin: 
     * Vasemman puolen listassa on kentät joita voi valita.
     * Oikean puolen listassa on kentät jotka on valittu.
     * Valittavan kentän rakenne:
     * { 
     *     'editable': true / false.  // Jos false, kenttää ei voi valita
     *     'name': [uniikki nimi],    // Tietokantataulussa oleva kentän nimi
     *     'label': [UIssa näytettävä nimi]
     * }
     */
     function link(scope, elem, attrs) {
         //Lisää saatavilla oleva kenttä raporttiin valittuihin kenttiin.
         scope.addSelectedField = function() {
             if(scope.valittavakentta === undefined) {
                 return;
             }
             for(var i = 0; i<scope.valittavakentta.length; i++) {                 
                 if(scope.valittavissaolevatkentat.length === 0) {
                     return;
                 }
                 if(!scope.valittavakentta[i].name) {
                     continue;
                 }
                 
                 scope.valitutkentat.push(scope.valittavakentta[i]);                   
             }
             for(var i = scope.valittavissaolevatkentat.length-1; i>=0; i--) {
                 for(var j = 0; j<scope.valittavakentta.length; j++) {
                     if(scope.valittavissaolevatkentat[i].name == scope.valittavakentta[j].name) {
                         scope.valittavissaolevatkentat.splice(i, 1);
                         break;
                     }                    
                 }
             }    
         };
         
         //Poista valittu kenttä raportilla näytettävistä kentistä
         scope.removeSelectedField = function() {
             if(scope.valittukentta === undefined) {
                 return;
             }
             for(var i = 0; i<scope.valittukentta.length; i++) {
                 if(!scope.valittukentta[i].editable) {
                     continue;
                 }
                 if(!scope.valittukentta[i].name) {
                     continue;
                 }
                 
                 scope.valittavissaolevatkentat.push(scope.valittukentta[i]);
             }
             
             for(var i = scope.valitutkentat.length-1; i>=0; i--) {
                 for(var j = 0; j<scope.valittukentta.length; j++) {
                     if(scope.valitutkentat[i].name == scope.valittukentta[j].name && scope.valittukentta[j].editable) {                         
                         scope.valitutkentat.splice(i, 1);
                         break;
                     }
                 }
             }
         };
     }
     return {
        restrict: 'E',
        link : link,
        scope: {
            valittavissaolevatkentat: '=',
            valitutkentat: '='
        },
        transclude: true,
        templateUrl: 'directives/kenttavalitsin/kenttavalitsin.html'        
    };
}])