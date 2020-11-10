//angular.module('mip.navbar', []);
/*
 * Controller for the navigation bar Makes sure that the user has been logged
 * in, but the token can still be invalid.
 */
angular.module('mip.general').controller('NavbarController', [
		'$scope', 
		'SessionService', 
		'UserService', 
		'$location', 
		'CONFIG', 
		'ModalService', 
		'EntityBrowserService',
		function($scope, SessionService, UserService, $location, CONFIG, ModalService, EntityBrowserService) {
			 
		    // The navigation bar is not visible, if the user has not been
			// logged in.
			// The token can still be invalid
			$scope.authenticated = SessionService.isAuthenticated(); 
            
            $scope.getKayttoohje = function() {                
                // Generate the url and add the auth token to the url
                var url = CONFIG.API_URL + "kayttoohje" + '?token=' + SessionService.get('token'); 
                // Open the url
                window.open(url, '_blank');
            };
            
            $scope.getReleasenotes = function() {
             // Generate the url and add the auth token to the url
                var url = CONFIG.API_URL + "releasenotes" + '?token=' + SessionService.get('token') 
                // Open the url
                window.open(url, '_blank');
            };            
			
			// Get the logged in user. Used for showing the email on the
			// navigation bar and making the user settings page link work
			$scope.userProperties = UserService.getProperties();
			
			/*
			 * Initialize the modal
			 */
			$scope.showModal = function() {				

                EntityBrowserService.setQuery('kayttaja', $scope.userProperties.user.id, {'userSettings': true}, 1);
				ModalService.userModal($scope.userProperties.user);
			};
			
			/**
			 * Sulkee valikosta valitun modaalin
			 */
			$scope.close = function(modalNameId) {

            	// Sulkee modaalin ja poistaa listalta
            	ModalService.closeModal(modalNameId);
            };
			
			/**
			 * Sulkee kaikki modaalit
			 */
			$scope.closeModals = function(){
				ModalService.closeModals();
			};
			
			/**
			 * Avaa ikkunavalikosta modaalin näkyviin
			 */
			$scope.showSelectedModal = function(modal){
				modal.$element.css('display','block');

				// Poistaa aktiivisuuden muilta ja asettaa valitun aktiiviseksi
				$(".modal-dialog").removeClass("active-modal");
				modal.$element.addClass("active-modal");

	           // Asettaa päällimmäiseksi
				modal.$element.css('z-index', ModalService.getNextModalZIndex());
				
			};
			
			/**
			 * Avaa kaikki piilotetut modaalit
			 */
			$scope.showAllModals = function(){
				ModalService.showAllModals();
			};
			
			/**
			 * Piilottaa kaikki modaalit
			 */
			$scope.hideAllModals = function(){
				ModalService.hideAllModals();
			};			
		}
]);
