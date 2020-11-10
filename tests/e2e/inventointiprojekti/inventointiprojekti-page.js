/**
 * Inventointiprojektin page-object
 */
var InventointiprojektiPage = function(){
	
	// Input kentät
	var nimi = element(by.model('inventointiprojekti.properties.nimi'));
	var kuvaus = element(by.model('inventointiprojekti.properties.kuvaus'));
	var alkupvm = element(by.model('ajanjakso.alkupvm'));
	var loppupvm = element(by.model('ajanjakso.loppupvm'));
	var toimeksiantaja = element(by.model('inventointiprojekti.properties.toimeksiantaja'));
	var hakunimi = element(by.model('inventointiprojektitTable.filter().properties.nimi'));
	
	this.setNimi = function(invprojNimi){
		nimi.sendKeys(invprojNimi);
	};
	
	this.setKuvaus = function(invprojKuvaus){
		kuvaus.clear().sendKeys(invprojKuvaus);
	};
	
	this.setAlkupvm = function(pvm){
		alkupvm.clear().sendKeys(pvm);
	};
	
	this.setLoppupvm = function(pvm){
		loppupvm.clear().sendKeys(pvm);
	};
	
	this.setToimeksiantaja = function(t_antaja){
		toimeksiantaja.clear().sendKeys(t_antaja);
	};
	
	this.setHakunimi = function(h_nimi){
		hakunimi.clear().sendKeys(h_nimi);
	};
	
	// Kunnan valinta. (valitsee aina 2. kunnan, tähän pitäisi keksiä parempi keino ja siirtää util-page.ja luokkaan)
	this.valitseKunta = function(){
		element(by.model('inventointiprojekti.properties.kunnat')).element(by.model('$select.search')).click();
		browser.actions().sendKeys(protractor.Key.DOWN).perform();	
		browser.actions().sendKeys(protractor.Key.UP).perform();
		browser.actions().sendKeys(protractor.Key.ENTER).perform();
	};

};

module.exports = new InventointiprojektiPage();