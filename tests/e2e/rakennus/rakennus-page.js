/**
 * Rakennus page-object
 */
var rakennusPage = function(){
	
	// Input kentät
	var rakennustunnus = element(by.model('rakennus.properties.rakennustunnus'));
	var inventointinumero = element(by.model('rakennus.properties.inventointinumero'));
	var postinumero = element(by.model('rakennus.properties.postinumero'));
	
	this.activateKiintWindowClose = function(){
		element(by.css('a[class="dropdown-toggle"]')).click();
		element(by.css('[id^=Kiinteist]')).click();
		element(by.css('a[class="dropdown-toggle"]')).click();
	};
	
	this.activateRakWindowLuonti = function(){
		  element(by.css('[class="dropdown-toggle"]')).click();
		  element(by.css('[id*="Rakennus"]')).click();
		  element(by.css('[class="dropdown-toggle"]')).click();
	};
	
	this.setPostinumero = function(rakPostinumero){
		postinumero.clear().sendKeys(rakPostinumero);
	};
	
	this.setMuokattuPostinumero = function(rakMuokattuPostinumero){
		postinumero.clear().sendKeys(rakMuokattuPostinumero);
	};
	
	this.setInventointinumero = function(rakInventointinumero){
		inventointinumero.clear().sendKeys(rakInventointinumero);
	};
	
	this.setKarttaSijainti = function(){
		element(by.css('[ng-click="togglePointTool()"]')).click();
		element(by.css('[id*=rakennusMap]')).element(by.css('[class="ol-viewport"]')).element(by.css('[class="ol-unselectable"]')).click();
	};
};

module.exports = new rakennusPage();