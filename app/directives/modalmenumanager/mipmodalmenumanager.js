angular.module('mip.directives').directive('mipModalMenuManager', ['$injector', '$rootScope', '$timeout', 'ModalControllerService', function($injector, $rootScope, $timeout, ModalControllerService) {
     /*
      * Ikkuna-valikko
      */
     function link(scope, element, attrs) {

         /* Uuden modaalin lisäyksen kuuntelija. Päivitetään ikkunavalikosta valituksi  */
         $rootScope.$on('modal_list', function(event, data) {
           // Odotettava DOM valmistumista
           $timeout(function() {
               // Poistetaan korostus kaikilta menu-linkeiltä
               angular.element(document).find('.mip-menu-row').css('fontWeight','');
               // Uusi modal valituksi
               angular.element(document.getElementById(data.$id)).css('fontWeight','bold');
           });
         });


         /* Klikkien käsittelyt */
         element.bind('click', function(event) {

            var locale = $injector.get('locale');

            // Tunnistetaan ikkuna-valikon klikki
            var selectedLink = event.target.innerText;
            var selectedClass = event.target.className;

            // Piilotetaan kaikki
            if(selectedLink === locale.getString('common.Hide_all')){
                this.closable = false;
                // Poistetaan korostus kaikilta menu-linkeiltä
                element.find('.mip-menu-row').css('fontWeight','');
                // Poistetaan kaikilta aktiivisuus
                angular.element(document).find('.active-modal').removeClass('active-modal');
				// Poistetaan samalla pikanäppäimet
				ModalControllerService.unbindHotkeys();
                return;
            }
            // Näytä kaikki
            else if(selectedLink === locale.getString('common.Show_all')){
                this.closable = false;
                return;
            }
            // Suljetaan kaikki modaalit ja ikkuna-valikko
            else if(selectedLink === locale.getString('common.Close_all')){
                this.closable = true;
				// Poistetaan samalla pikanäppäimet
				ModalControllerService.unbindHotkeys();
                return;
            }

            // Ikkuna-valikon ikonia klikattu, suljetaan valikko tai avataan valikko
            else if(selectedClass === 'fa fa-window-restore' || selectedClass === 'dropdown-toggle'){
                this.closable = true;
                return;
            }
            // Rivikohtainen sulkemis-ikoni valittu
            else if(selectedClass === 'fa fa-window-close'){
                this.closable = false;
                // Poistetaan korostus kaikilta menu-linkeiltä
                element.find('.mip-menu-row').css('fontWeight','');
                // Poistetaan kaikilta aktiivisuus
                angular.element(document).find('.active-modal').removeClass('active-modal');
				// Poistetaan samalla pikanäppäimet
				ModalControllerService.unbindHotkeys();
                return;
            }
            // Modaali-linkki valittu
            else{
                // ns. toggle toiminto eli jos valittua ikkunan menua klikataan, piilotetaan vastaava modaali
                var selected = event.target.style.fontWeight;
                if(selected === 'bold'){
                    var hideModal = angular.element(document).find('.active-modal');
                    hideModal.removeClass('active-modal');
                    hideModal.css('display', 'none');
                    // Poistetaan korostus kaikilta menu-linkeiltä
                    element.find('.mip-menu-row').css('fontWeight','');
                    // Poistetaan samalla pikanäppäimet
                    ModalControllerService.unbindHotkeys();
                }else{
                    // Poistetaan korostus kaikilta menu-linkeiltä
                    element.find('.mip-menu-row').css('fontWeight','');
                    // Asetetaan valittu menu korostetuksi
                    event.target.style.fontWeight = 'bold';
                }
                this.closable = false;
            }
         });
     }
     return {
        restrict: 'A',
        link : link,
        transclude: true,
        templateUrl: 'directives/modalmenumanager/modal_menu.html'
    };
}]);