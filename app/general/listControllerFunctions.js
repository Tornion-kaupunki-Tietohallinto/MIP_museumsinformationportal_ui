/**
 * Service joka sisältää suurimman osan listausnäkymien "vakioiden" asettamisesta ja
 * yleisten funktioiden esittelyistä.
 * EI toimi rakennusinventointipuolella ilman ko. koodien refaktorointia.
 */
angular.module('mip.general').factory('ListControllerService', [
        'AlertService', 'ListService', '$rootScope', 'locale', '$rootScope', 'CacheFactory',
        function (AlertService, ListService, $rootScope, locale, $rootScope, CacheFactory) {

            var functions = {
                    /**
                     * Näytetäänkö lisää uusi -painike
                     */
                    showCreateNewButton : false,
                    /**
                     * Oletusarvo hakutulosnäkymään
                     */
                    searchResults : 0,
                    /**
                     * Käännöksiä varten valittu kieli
                     */
                    currentLocale : locale.getLocale(),
                    /**
                     * Taulukon sarakkeiden käännöksiä varten
                     */
                    getColumnName : function(column, lang_file) {
                        return ListService.getColumnName(column, lang_file);
                    },
                    /**
                     * Tyhjennetään hakuehdot ja tehdään uusi haku ilman ehtoja
                     */
                    clearSearchFilter : function() {
                        ListService.clearProps();
                        this.getSearchValues();
                    },
                    /**
                     * Tyhjennetään cache ja ladataan listan sisältö uudelleen.
                     * TODO: Testaa!
                     * @params
                     * 1: Tyhjennettävän cachen nimi
                     * 2: Ladattavan ngTablen nimi
                     */
                    refreshTable : function(cacheName, tableToReload) {
                        CacheFactory.get(cacheName).removeAll();
                        this[tableToReload].reload();
                    },
                    /**
                     * Haetaan tallennetut hakuparametrit
                     * TODO: Toteutettava!
                     * @params
                     * 1: Tyyppi jolle haetaan (esim. kiinteisto, rakennus...)
                     * Vaihtoehtoinen toteutus:
                     * PArametrina annetaan lista kenttien (arvojen) nimistä jotka haluetaan palauttaa?
                     * [{propName: 'kunta', fieldName: 'kunta'}, {propName: 'kiinteistoNimi', fieldName: 'nimi'}] -tyylisesti?
                     */
                    getSearchValues : function(tyyppi) {

                    },
                    /**
                     * Poistetaan aluerajaus, kun ollaan siirretty sijaintiin perustuva rajaus
                     * karttanäkymästä listausnäkymään
                     * TODO: Kun getSearchValues on toteutettu parametrisoidusti, niin
                     * lisätään tämän parametreihin tyyppi
                     */
                    removeAluerajaus : function() {
                        ListService.setProp('polygonrajaus', '');
                        ListService.setProp('aluerajaus', '');
                        //this.getSearchValues(tyyppi);
                    },
                    /**
                     * Sarakkeiden näytä piilota toiminnallisuus
                     * @param
                     * 1: Tyyppi (sivu) jolle asetukset haetaan.
                     */
                    getColVisibilities : function(tyyppi) {
                        this.colVisibilities = ListService.getColumnVisibilities(tyyppi);
                    },
                    /**
                     * Tallennetaan sarakkeen näkyvyysasetus
                     * @params
                     * 1: Tyyppi (sivu) jolla ollaan, esim. 'kiinteisto'
                     * 2: Sarakkeen nimi jonka asetus tallennetaan, esim 'nimi'
                     * 3: Arvo joka tallennetaan, true / false
                     */
                    saveColVisibility : function(tyyppi, colName, value) {
                        ListService.setColumnVisibility(tyyppi, colName, value);
                    },
                    /**
                     * Päivitetään sivun tabien tyylit vastaamaan valintoja
                     * @params
                     * 1. tab = Päätab, joka merkitään aktiiviseksi (käännös, esim: 'common.Archeology')
                     * 2. subTab = Alitab, joka merkitään aktiiviseksi (käännös, esim: 'ark.Target')
                     */
                    updateTabs : function(tab, subTab) {
                        var t = tab.split(".");
                        var st = subTab.split(".");

                        locale.ready(t[0]).then(function() {
                            $rootScope.setActiveTab(locale.getString(tab));

                            locale.ready(st[0]).then(function( ){
                                $rootScope.setActiveSubTab(locale.getString(subTab));
                            });
                        });
                    },
                    cancelRequest : function(promise) {
                        promise.cancel();
                    }
            }

            return functions;
}]);