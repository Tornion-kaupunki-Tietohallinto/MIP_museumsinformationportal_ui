angular.module('mip.directives').directive('mipVuosiraportti', ['locale', function(locale) {
    function link(scope) {
        
        /*
         * RAPORTILLE VALITTAVISSA OLEVAT KENTÄT
         */
        scope.valittavissaolevatKentat = null;
        
        /*
         * RAPORTILLE PAKOLLISET KENTÄT JA ESIVALITUT KENTÄT
         * Pakolliset: Käyttäjä ei voi poistaa valinnoista
         * Esivalitut: "Kalannin raportissa" olevat kentät
         */
        scope.raportti.valitutKentat = null;
        
        /*
         * RAPORTIN LAJI (KIINTEISTOT, RAKENNUKSET, ALUEET, ARVOALUEET). 
         * Raportin tyyppi (suoritettava .jasper raportti) määräytyy lajin perusteella.  
         */
        scope.raportti.laji = "";
        
        /*
         * RAPORTIN MAHDOLLISET LAJIT
         */
        scope.lajit = [
            {id:'kiinteistot', name: locale.getString('common.Estates')},
            {id:'rakennukset', name: locale.getString('common.Buildings')},
            {id:'alueet', name: locale.getString('common.Areas')},
            {id:'arvoalueet', name: locale.getString('common.Valueareas')},
        ];        
                
        /*
         * RAPORTIN HAKUEHTOIHIN VALITTU PAIKKAKUNTA
         */
        scope.raportti.paikkakunta = "";        
        
        /*
         * RAPORTIN KÄYTTÄJÄLLE NÄYTETTÄVÄ NIMI
         */
        scope.raportti.reportDisplayName = "";
        
        /*
         * KIINTEISTÖLLE VALITTAVISSA OLEVAT KENTÄT
         */
        scope.kiinteistoValittavissaolevatKentat = [
            {
                'editable': true,
                'name': 'historialliset_tilatyypit',
                'label': locale.getString('common.Historical_property_types')
            }, {
                'editable': true,
                'name': 'lisatiedot',
                'label': locale.getString('common.Additional_information')
            }, {
                'editable': true,
                'name': 'perustelut_yhteenveto',
                'label': locale.getString('common.Summary')
            }, {
                'editable': true,
                'name': 'asutushistoria',
                'label': locale.getString('common.Settlement_history')
            }, {
                'editable': true,
                'name': 'lahiymparisto',
                'label': locale.getString('common.Surroundings')
            }, {
                'editable': true,
                'name': 'pihapiiri',
                'label': locale.getString('common.Courtyard')
            }, {
                'editable': true,
                'name': 'arkeologinen_intressi',
                'label': locale.getString('common.Archeological_interests')
            }, {
                'editable': true,
                'name': 'muu_historia',
                'label': locale.getString('common.Other_history')
            }, {
                'editable': true,
                'name': 'tarkistettu',
                'label': locale.getString('common.Inspected')
            }, {
                'editable': true,
                'name': 'palstanumero',
                'label': locale.getString('common.Column_number')
            }, {
                'editable': true,
                'name': 'paikkakunta',
                'label': locale.getString('common.Municipality')
            }, {
                'editable': true,
                'name': 'kulttuurihistorialliset_arvot',
                'label': locale.getString('common.Culturohistorical_values')
            }, {
                'editable': true,
                'name': 'arvoluokka',
                'label': locale.getString('common.Valuation')
            }, {
                'editable': true,
                'name': 'perustelut',
                'label': locale.getString('common.Reasonings')
            }, {
                'editable': true,
                'name': 'kiinteiston_sijainti',
                'label': locale.getString('common.Location')
            }, 
        ];
        
        /*
         * RAKENNUKSELLE VALITTAVISSA OLEVAT KENTÄT
         */
        scope.rakennusValittavissaolevatKentat = [
            {
                'editable': true,
                'name': 'osoitteet',
                'label': locale.getString('common.Addresses')
            },{
                'editable': true,
                'name': 'postinumero',
                'label': locale.getString('common.Postal_code')
            }, {
                'editable': true,
                'name': 'rakennustunnus',
                'label': locale.getString('common.Building_identifier')
            }, {
                'editable': true,
                'name': 'rakennustyypit',
                'label': locale.getString('common.Building_type')
            }, {
                'editable': true,
                'name': 'rakennustyyppi_kuvaus',
                'label': locale.getString('common.Building_type_description')
            }, {
                'editable': true,
                'name': 'rakennusvuosi',
                'label': locale.getString('common.Construction_year')
            }, {
                'editable': true,
                'name': 'rakennusvuosi_selite',
                'label': locale.getString('common.Construction_year_description')
            }, {
                'editable': true,
                'name': 'muutosvuodet',
                'label': locale.getString('common.Alteration_years')
            }, {
                'editable': true,
                'name': 'alkuperainen_kaytto',
                'label': locale.getString('common.Original_usage')
            }, {
                'editable': true,
                'name': 'nykykaytto',
                'label': locale.getString('common.Common_usage')
            }, {
                'editable': true,
                'name': 'kerroslukumaara',
                'label': locale.getString('common.Number_of_floors')
            }, {
                'editable': true,
                'name': 'asuin_ja_liikehuoneistoja',
                'label': locale.getString('common.Residences_and_offices')
            }, {
                'editable': true,
                'name': 'perustus',
                'label': locale.getString('common.Foundation')
            }, {
                'editable': true,
                'name': 'runko',
                'label': locale.getString('common.Frame')
            }, {
                'editable': true,
                'name': 'vuoraus',
                'label': locale.getString('common.Lining')
            }, {
                'editable': true,
                'name': 'ulkovari',
                'label': locale.getString('common.Outside_color')
            }, {
                'editable': true,
                'name': 'kattotyypit',
                'label': locale.getString('common.Ceiling')
            }, {
                'editable': true,
                'name': 'katetyypit',
                'label': locale.getString('common.Cover')
            }, {
                'editable': true,
                'name': 'kunto',
                'label': locale.getString('common.Condition')
            }, {
                'editable': true,
                'name': 'nykytyyli',
                'label': locale.getString('common.Contemporary_style')
            }, {
                'editable': true,
                'name': 'purettu',
                'label': locale.getString('common.Demolished')
            }, {
                'editable': true,
                'name': 'erityispiirteet',
                'label': locale.getString('common.Special_characteristics')
            }, {
                'editable': true,
                'name': 'kulttuurihistorialliset_arvot',
                'label': locale.getString('common.Culturohistorical_values')
            }, {
                'editable': true,
                'name': 'kulttuurihistoriallisetarvot_perustelut',
                'label': locale.getString('common.Reasonings')
            }, {
                'editable': true,
                'name': 'arvoluokka',
                'label': locale.getString('common.Valuation')
            }, {
                'editable': true,
                'name': 'suunnittelija',
                'label': locale.getString('common.Architects')
            }, {
                'editable': true,
                'name': 'rakennuksen_sijainti',
                'label': locale.getString('common.Location')
            }
        ];
        
        /*
         * ALUEELLE VALITTAVISSA OLEVAT KENTÄT
         */
        scope.alueValittavissaolevatKentat = [
            {
                'editable': true,
                'name': 'paikkakunta',
                'label': locale.getString('common.Municipality')
            }, {
                'editable': true,
                'name': 'historia',
                'label': locale.getString('common.History')
            }, {
                'editable': true,
                'name': 'maisema',
                'label': locale.getString('common.Scenery')
            }, {
                'editable': true,
                'name': 'nykytila',
                'label': locale.getString('common.Current_condition')
            }, {
                'editable': true,
                'name': 'alueen_sijainti',
                'label': locale.getString('common.Location')
            }             
        ];
        
        /*
         * ARVOALUEELLE VALITTAVISSA OLEVAT KENTÄT
         */
        scope.arvoalueValittavissaolevatKentat = [
            {
                'editable': true,
                'name': 'paikkakunta',
                'label': locale.getString('common.Municipality')
            }, {
                'editable': true,
                'name': 'aluetyyppi',
                'label': locale.getString('common.Area_type')
            }, {
                'editable': true,
                'name': 'arvoluokka',
                'label': locale.getString('common.Valuation')
            }, {
                'editable': true,
                'name': 'kulttuurihistorialliset_arvot',
                'label': locale.getString('common.Culturohistorical_values')
            }, {
                'editable': true,
                'name': 'perustelut',
                'label': locale.getString('common.Reasonings')
            }, {
                'editable': true,
                'name': 'yhteenveto',
                'label': locale.getString('common.Summary')
            }, {
                'editable': true,
                'name': 'arvoalueen_sijainti',
                'label': locale.getString('common.Location')
            }
        ];
                
        scope.selectValittavissaolevatKentat = function(laji) {
            if(laji == 'kiinteistot') {
                scope.valittavissaolevatKentat = scope.kiinteistoValittavissaolevatKentat;
            } else if(laji == 'rakennukset') {
                scope.valittavissaolevatKentat = scope.rakennusValittavissaolevatKentat;                
            } else if(laji == 'alueet') {
                scope.valittavissaolevatKentat = scope.alueValittavissaolevatKentat;
            } else if(laji == 'arvoalueet') {
                scope.valittavissaolevatKentat = scope.arvoalueValittavissaolevatKentat;
            }
        };
        
        
        scope.kiinteistoValitutKentat = [
            {
                'editable': false,
                'name': 'kunta_nimi',
                'label': locale.getString('common.County')
            }, {
                'editable': false,
                'name': 'kyla_nimi',
                'label': locale.getString('common.Village')
            }, {               
                'editable': false,
                'name': 'kiinteisto_nimi',
                'label': locale.getString('common.Estate')
            }, {
                'editable': false,
                'name': 'kiinteistotunnus',
                'label': locale.getString('common.Property_identifier')
            }, {
                'editable': true,
                'name': 'inventointiprojekti_nimi',
                'label': locale.getString('common.Inventory_project')
            }, {
                'editable': true,
                'name': 'luontipvm',
                'label': locale.getString('common.Date_added')
            }, {
                'editable': true,
                'name': 'muokkauspvm',
                'label': locale.getString('common.Date_modified')
            }
        ];
        
        scope.rakennusValitutKentat = [
            {
                'editable': false,
                'name': 'kunta',
                'label': locale.getString('common.County')
            }, {
                'editable': false,
                'name': 'kyla',
                'label': locale.getString('common.Village')
            }, {               
                'editable': false,
                'name': 'kiinteisto',
                'label': locale.getString('common.Estate')
            }, {
                'editable': false,
                'name': 'kiinteistotunnus',
                'label': locale.getString('common.Property_identifier')
            }, {
                'editable': true,
                'name': 'inventointinumero',
                'label': locale.getString('common.Inventory_number')
            }, {
                'editable': true,
                'name': 'inventointiprojekti_nimi',
                'label': locale.getString('common.Inventory_project')
            }, {
                'editable': true,
                'name': 'luontipvm',
                'label': locale.getString('common.Date_added')
            }, {
                'editable': true,
                'name': 'muokkauspvm',
                'label': locale.getString('common.Date_modified')
            }
        ];
        
        scope.alueValitutKentat = [
            {
                'editable': false,
                'name': 'kunta',
                'label': locale.getString('common.County')
            }, {
                'editable': false,
                'name': 'kyla',
                'label': locale.getString('common.Village')
            }, {
                'editable': false,
                'name': 'nimi',
                'label': locale.getString('common.Area')
            }, {
                'editable': true,
                'name': 'inventointiprojekti_nimi',
                'label': locale.getString('common.Inventory_project')
            },{
                'editable': true,
                'name': 'luontipvm',
                'label': locale.getString('common.Date_added')
            }, {
                'editable': true,
                'name': 'muokkauspvm',
                'label': locale.getString('common.Date_modified')
            }            
        ];
        
        scope.arvoalueValitutKentat = [
            {
                'editable': false,
                'name': 'kunta',
                'label': locale.getString('common.County')
            }, {
                'editable': false,
                'name': 'kyla',
                'label': locale.getString('common.Village')
            }, {
                'editable': false,
                'name': 'Arvoalue',
                'label': locale.getString('common.Valuearea')
            }, {
                'editable': true,
                'name': 'alue',
                'label': locale.getString('common.Area')
            }, {
                'editable': true,
                'name': 'inventointinumero',
                'label': locale.getString('common.Inventory_number')
            }, {
                'editable': true,
                'name': 'inventointiprojekti_nimi',
                'label': locale.getString('common.Inventory_project')
            }, {
                'editable': true,
                'name': 'luontipvm',
                'label': locale.getString('common.Date_added')
            }, {
                'editable': true,
                'name': 'muokkauspvm',
                'label': locale.getString('common.Date_modified')
            }          
        ];
        
        scope.selectValitutKentat = function(laji) {
            if(laji == 'kiinteistot') {
                scope.raportti.valitutKentat = scope.kiinteistoValitutKentat;
            } else if(laji == 'rakennukset') {
                scope.raportti.valitutKentat = scope.rakennusValitutKentat;
            } else if(laji == 'alueet') {
                scope.raportti.valitutKentat = scope.alueValitutKentat;
            } else if(laji == 'arvoalueet') {
                scope.raportti.valitutKentat = scope.arvoalueValitutKentat;
            }
        };
        
        scope.selectReportDisplayName = function(laji) {
            scope.raportti.reportDisplayName = locale.getString('common.Annual_report') + " - " + laji;
        };         
        
        scope.selectLaji = function(laji) {
            scope.raportti.laji = laji;
            scope.selectReportDisplayName(laji);
            scope.selectValittavissaolevatKentat(laji);
            scope.selectValitutKentat(laji);
        };      
        
    }
    return {
        scope : {
            raportti: '='
        },
        restrict : 'E',
        link: link,        
        templateUrl: 'directives/raportit/vuosiraportti.html'        
    };   
}]);