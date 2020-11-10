/*
 * Direktiivin avulla voidaan valita kuvia siirtoa varten edit-moodissa.
 * 
 * TOIMINNALLISUUDET:
 *  1. Valitse / poista valinta kuvasta
 *  2. Avaa kuvien siirtomodal ja anna modalille valitut kuvat ja tiedot lähettävästä tahosta (entiteetin tyyppi ja id)
 * 
 * KÄYTTÖ: 
 *  1. Lisää direktiivi kuvalistan elementtiin, esim:
 *      <mip-kuvasiirrin img="image" _selectedImages="_selectedImages"></mip-kuvasiirrin>
 *      
 *  2. Lisää kontrolleriin lista esim:
 *      $scope._selectedImages = [];  
 *  
 *  3. Lisää Toiminnot-painikkeeseen direktiivi esim: 
        <li><a href="" ng-click="showTransferImagesModal(modalId, kiinteisto.properties.id, 'kiinteisto')" mip-kuvasiirrin
             i18n="common.Move_image" 
             ng-show="!create && edit" data-ng-if="permissions.muokkaus"></a>
        </li>
 *      
 *     Parametrit:
 *       modalId = modalin id josta valintoja tehdään
 *       entiteettiId = entiteetin (esimerkiksi kiinteistö) id josta kuvat tullaan siirtämään pois
 *       entitettiTyyppi = entiteetin tyyppi (esimerkiksi kiinteistö) josta kuvat tullaan siirtämään pois
 *       
 */
angular.module('mip.directives').directive('mipKuvasiirrin', [
        'ModalService', '$timeout', '$rootScope', function(ModalService, $timeout, $rootScope) {
            function link(scope, element, attrs) {

                /*
                 * Valitse / poista valinta
                 */
                scope.toggleSelectImage = function(val) {
                    var isSelected = scope.isImageSelected(scope.image.properties.id);
                    if (isSelected > -1) {
                        scope._selectedImages.splice(isSelected, 1);
                    } else {
                        scope._selectedImages.push(scope.image);
                    }
                };

                /*
                 * Return the index of the given imageId. If the imageId is not found in the array, return -1
                 */
                scope.isImageSelected = function(imageId) {
                    for (var i = 0; i < scope._selectedImages.length; i++) {
                        var q = scope._selectedImages[i];
                        if (q.properties.id == imageId) {
                            return i;
                        }
                    }
                    return -1;
                };

                /*
                 * Avaa kuvien siirtonäkymä
                 */
                scope.showMoveImageModal = function(entiteetti, entiteettiTyyppi) {
                    $timeout(function() {
                        ModalService.siirraKuvaModal(scope._selectedImages, entiteettiTyyppi, entiteetti);
                    }, 10);
                };

                scope.$on('Kuva_modified', function(event, data) {
                    if (data.id == scope.entiteetti_id) {
                        // Tämän scopen kuvia siirrettiin, tyhjennä valinnat
                        scope._selectedImages.length = 0;
                    }
                });

                scope.unselectImages = function(data) {
                    for (var i = scope._selectedImages.length - 1; i >= 0; i--) {
                        var si = scope._selectedImages[i].properties.id;

                        for (var j = 0; j < data.kuvaIdt.length; j++) {
                            var ki = data.kuvaIdt[j];
                            if (si == ki) {
                                scope._selectedImages.splice(i, 1);
                            }
                        }
                    }
                }
                /*
                 * Remove moved images
                 */
                scope.$on('Kuvia_siirretty', function(event, data) {
                    scope.unselectImages(data);
                });
            }
            return {
                link : link,
                restrict : "EA",
                template : '<div class="checkbox mip-right-bottom"><label><input type="checkbox" value="" ng-model="val" ng-change="toggleSelectImage(val)"><span i18n="common.Select_for_transfer"</label></div>'

            };
        }
]);