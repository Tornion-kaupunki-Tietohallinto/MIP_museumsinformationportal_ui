/*
 * Service for handling the user "session"
 */
angular.module('mip.auth').factory('SessionService', ['CONFIG', function(CONFIG) {
	/*
	 * Properties for the session
	 * Auth: Is the user authenticated? (TODO: Is this needed as we have / don't have the token.
	 * Email: Email of the logged in user (username). TODO: Is this needed as we have the userService.props.user.
	 */
	var authenticated = {
		Auth : false,
		Email : ''
	};
	
	var destination = "";
	
	return {
		/* 
		 * Getters and setters for the sessionStorage
		 */
		get : function(key) {
			return sessionStorage.getItem(key);
		},
		set : function(key, val) {
			return sessionStorage.setItem(key, val);
		},
		unset : function(key) {
			return sessionStorage.removeItem(key);
		},
		setAuthenticated : function(value) {
			authenticated.Auth = value;
		},
		getDestination : function() {
			if (destination != "" && destination != "/kirjaudu") {
				return destination;
			}
			
			return "/kiinteistot";
		},
		setDestination : function(d) {
			destination = d;
		},
		/*
		 * Is the user authenticated? By default, if we have a token in the sessionStorage, the user is authenticated. 
		 * If the backend has invalidated the token, redirect the user to the login page with proper error message
		 */
		isAuthenticated : function() {
			var token = this.get('token');
			if (token) {
				authenticated.Auth = true;
			} else {
				authenticated.Auth = false;
			}
			return authenticated;
		}
	}
}]);