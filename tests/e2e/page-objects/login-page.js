/**
 * Kirjautumisen page object.
 */
var LoginPage = function(){
	
	var userEmailInput = element(by.model('loginData.kayttajatunnus'));
	var passwordInput = element(by.model('loginData.salasana'));
	
	// Avaa url mukaisen sivun
	this.get = function(url){
		browser.get(url);
	};
	
	this.setUserEmail = function(email){
		userEmailInput.sendKeys(email);
	};
	
	this.setPassword = function(password){
		passwordInput.sendKeys(password);
	};
};

module.exports = new LoginPage();