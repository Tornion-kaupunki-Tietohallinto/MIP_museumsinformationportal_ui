angular.module('mip.directives').directive('mipDialog', [ 'ModalService', '$window', function(ModalService, $window) {
   return {
       restrict : 'A',
       link : function(scope, element, attrs) {

           // Make the element resizable. Also include related elements to the resizing.
           element.resizable({
               alsoResize: [element.find(".modal-content"), element.find(".modal-body")],
               minHeight: 300,
               minWidth: 300,
               handles: "n, e, s, w, se, sw, ne, nw",
               stop: function(event, ui) {
                   if(scope.map) {
                       //Needed, otherwise the map aspect ratio gets broken.
                       scope.map.updateSize();
                   } else {
                       //Ark puolella $scope pidetään erillään ja erillisessä muuttujassa on myös kartta.
                       //Tästä johtuen kartta ei löydy scopesta, vaan sen childeistä.
                       for(var child in scope) {
                    	 //Skipataan javascription prototyyppien ja angularin sisäiset propertyt
                           if(scope.hasOwnProperty(child)) {
                               if(child.charAt(0) != '$') {
                            	   //Varmistetaan että kartta löytyy ja se ei ole funktio (javascriptin funktio map()
                                   if(scope[child] && scope[child].map && typeof scope[child].map !== 'function') {
                            		   scope[child].map.updateSize();
                            		   break;
                                   }
                               }
                           }
                       }
                   }
               },
               resize: function(event, ui) {
                   // if there are columns, change their layout
                   if (ui.size.width < 992) {
                       //Main columns
                       element.find(".column-left").removeClass("col-md-6").addClass("col-md-12");
                       element.find(".column-right").removeClass("col-md-6").addClass("col-md-12");

                   } else {
                       //Main columns
                       element.find(".column-left").removeClass("col-md-12").addClass("col-md-6");
                       element.find(".column-right").removeClass("col-md-12").addClass("col-md-6");
                   }

                   /*
                    * Image list
                    */
                   /*   kuvia       koko        luokka
                    *     1:     0    - 300    col-md-12
                    *     2:     301  - 550    col-md-6
                    *     3:     551  - 750    col-md-4
                    *     4:     751  - 991    col-md-3
                    *
                    *     3:     992  -  1299  col-md-4
                    *     4:     1300 -        col-md-3
                    */

                   //All extra classes need to be removed, because if the user changes the size too quickly they are not removed automatically.
                   if(ui.size.width > 0 && ui.size.width <= 301) {
                       element.find(".mip-image-item").removeClass("col-md-6 col-md-4 col-md-3").addClass("col-md-12");
                   } else if(ui.size.width > 301 && ui.size.width <= 551) {
                       element.find(".mip-image-item").removeClass("col-md-12 col-md-4 col-md-3").addClass("col-md-6");
                   } else if(ui.size.width > 551 && ui.size.width <= 751) {
                       element.find(".mip-image-item").removeClass("col-md-12 col-md-6 col-md-3").addClass("col-md-4");
                   } else if(ui.size.width > 751 && ui.size.width <= 992) {
                       element.find(".mip-image-item").removeClass("col-md-12 col-md-6 col-md-4").addClass("col-md-3");
                   } else if (ui.size.width > 992 && ui.size.width <= 1300) {
                       element.find(".mip-image-item").removeClass("col-md-12 col-md-6 col-md-3").addClass("col-md-4");
                   } else if(ui.size.width > 1300) {
                       element.find(".mip-image-item").removeClass("col-md-12 col-md-6 col-md-4").addClass("col-md-3");
                   }
               }
           });

           // Make the dialog draggable
           // first make sure the dialog has position absolute, otherwise it will placed "relative"
           element.css('position', 'absolute');

           // Containment rajoittaa modaalin raahaamista reunojen yli. Ylöspäin ei päästetä.
           element.draggable({
               handle: '.modal-header',
               containment: [ -500, 0, 1500, 1500]
           });

           // Asetetaan uusi avattava modaali aktiiviseksi ja päällimmäiseksi
           $(".modal-dialog").removeClass("active-modal");
           element.addClass("active-modal");
           element.css('z-index', ModalService.getNextModalZIndex());

           /*
            * Modaalin klikkauksen käsittelyt:
            * Asetetaan aktiiviseksi ja päällimmäiseksi.
            * Päivitetään ikkuna-valikon valituksi modalNameId:n mukaan
            */
           element.bind('click', function(event, isHide) {

               // Selainten eron vuoksi eri class vertailut.
               var chromeWayTarget = 'fa fa-window-minimize';
               var ie_firefoxWayTarget = 'btn btn-xs pull-right mip-transparent ng-scope';

               var clickEventTarget = event.target.className;


               // Poistetaan korostus kaikilta menu-linkeiltä
               angular.element(document).find('.mip-menu-row').css('fontWeight','');

               // Piilota klikattu eli pienennys-kuvake
               if(clickEventTarget === ie_firefoxWayTarget || clickEventTarget === chromeWayTarget){
                   element.removeClass('active-modal');
                   element.css('display', 'none');
                // Poistetaan korostus, jos pienennettiin
                event.target.style.fontWeight = '';
               }else{
                   // Ikkunavalikon menusta klikattu modal valituksi
                   angular.element(document.getElementById(scope.modalNameId)).css('fontWeight','bold');
               }

               // Jos klikattu muuta kuin linkkiä, asetetaan valittu modal aktiiviseksi
               if(event.target.tagName !== "A" && event.target.tagName !== "TD"){
                   $(".modal-dialog").removeClass("active-modal");
                   element.addClass("active-modal");
                   element.css('z-index', ModalService.getNextModalZIndex());
               }
           });

           /*
            * Either one of the solutions below should be used for decent usability
            */

           //Open the dialog in the current scroll position instead of top of the page
           //element.css('top', $window.scrollY);

           //Force the window to scroll to top every time a new dialog is opened
           $window.scrollTo(0,0);
       }
   };
}]);