angular.module('mip.file').controller(
        'ImageController',
        [
                '$scope',
                '$rootScope',
                'CONFIG',
                '$http',
                'ModalService',
                'AlertService',
                '$timeout',
                'FileService',
                'image',
                'locale',
                'entiteetti_tyyppi',
                'entiteetti',
                'permissions',
                'UserService',
                'kuvalista',
                'selectedModalNameId',
                function($scope, $rootScope, CONFIG, $http, ModalService, AlertService, $timeout, FileService, image, locale, entiteetti_tyyppi, entiteetti, permissions, UserService, kuvalista, selectedModalNameId) {

                    // Unique modal id which is used for the collapsible panels
                    $scope.modalId = ModalService.getNextModalId();

                    // Valitun modalin nimi ja järjestysnumero
                    $scope.modalNameId = selectedModalNameId;
                    $scope.tags = {};

                    $scope.image = image;
                    $scope.original = angular.copy($scope.image);
                    $scope.entiteetti_tyyppi = entiteetti_tyyppi;
                    $scope.relatedObject = entiteetti;
                    $scope.permissions = permissions;
                    $scope.resizeIcon = "▢";
                    $scope.tags = null;
                    $scope.userRole = UserService.getProperties().user.rooli;

                    $scope.list = kuvalista;

                    $scope.changeImage = function(image) {
                        $scope.image = image;
                        $scope.original = angular.copy($scope.image);
                        $scope.showExifData();
                    };

                    $scope.showEditAndDeleteButtons = function() {
                        if (UserService.getProperties().user.id == $scope.image.properties.kayttaja_id && ($scope.userRole == 'inventoija' || $scope.userRole == 'ulkopuolinen tutkija' || $scope.userRole == 'tutkija')) {
                            return true;
                        } else {
                            return false;
                        }
                    };
                    $scope.showEditAndDeleteButtons();

                    /*
                     * Get the exif data _after_ the image has loaded
                     */
                    $scope.showExifData = function() {
                        var imgElem = document.getElementById("image");
                        $scope.setExifData(imgElem);
                    };
                    /*
                     * Extract the exif data from the image. Currently handles only the date information. If needed, extend to function(img, tag, ...) for more general functionality.
                     */
                    $scope.setExifData = function(img) {
                        // Get the date
                        EXIF.getData(img, function() {

                            // Get all tags instead of only the DateTimeOriginal, because reading the
                            // single tag failed from time to time for unkown reasons
                            var data = EXIF.getAllTags(this);
                            var tags = null;
                            if (data) {
                                tags = {};
                            }

                            for ( var a in data) {
                                if (data.hasOwnProperty(a)) {

                                    tags[a] = "";
                                    if (typeof data[a] == "object") {
                                        if (data[a] instanceof Number) {
                                            tags[a] = data[a] + " [" + data[a].numerator + "/" + data[a].denominator + "]";
                                        } else if (angular.isArray(data[a])) {
                                            if (data[a].length < 5) {
                                                for (var i = 0; i < data[a].length; i++) {
                                                    tags[a] += data[a][i] + ", ";
                                                }
                                            } else {
                                                tags[a] = "[...]";
                                            }
                                        }
                                    } else {
                                        tags[a] = data[a];
                                    }
                                }
                            }

                            if (tags['undefined']) {
                                delete tags['undefined'];
                            }
                            $scope.tags = tags;
                       });
                    }
                    ;

                    /*
                     * OPERATIONS
                     */

                    /*
                     * Cancel view mode
                     */
                    $scope.close = function() {
                        if ($scope.edit) {
                            $scope.cancelEdit();
                        }
                    	// Sulkee modaalin ja poistaa listalta
                    	ModalService.closeModal($scope.modalNameId);
                        $scope.$destroy();
                    };
                    /*
                     * Cancel edit mode
                     */
                    $scope.cancelEdit = function() {
                        // Asetetaan kuvan tiedot alkuperäisiin arvoihin
                        for ( var property in $scope.original) {
                            if ($scope.image.hasOwnProperty(property)) {
                                $scope.image[property] = angular.copy($scope.original[property]);
                            }
                        }
                        $scope.edit = false;
                    };

                    /*
                     * Readonly / edit mode.
                     */
                    $scope.editMode = function() {
                        $scope.edit = true;
                    };

                    /*
                     * Save changes
                     */
                    $scope.save = function() {
                        // Modify the date format
                          if ($scope.image.properties.pvm_kuvaus && angular.isDate($scope.image.properties.pvm_kuvaus)) {
                            var datetime = $scope.image.properties.pvm_kuvaus;

                            var dateString = datetime.getFullYear() + "-" + (datetime.getMonth() + 1) + "-" + datetime.getDate() + " " + datetime.getHours() + ":" + datetime.getMinutes() + ":" + datetime.getSeconds();
                            $scope.image.properties.pvm_kuvaus = dateString;
                        } else if ($scope.image.properties.pvm_kuvaus) {
                            var kuvaus = $scope.image.properties.pvm_kuvaus.split(' ');

                            //Try to generate date object from the date

                            var datePart = kuvaus[0].split('-');

                            var yyyy = datePart[0];
                            var mm = datePart[1];

                            if(mm.length < 2) {
                                mm = '0' + mm;
                            }

                            var dd = datePart[2];

                            if(dd.length < 2) {
                                dd = '0' + dd;
                            }

                            var timePart = kuvaus[1].split(":");

                            var hh = timePart[0];

                            if(hh.length < 2) {
                                hh = '0' + hh;
                            }

                            var min = timePart[1];

                            if(min.length < 2) {
                                min = '0' + min;
                            }

                            var ss = timePart[2];

                            if(ss.length < 2) {
                                ss = '0' + ss;
                            }

                            //Decrement month by one, otherwise e.g. Dec (12) will lead to Jan (1) as js dates and months start from 0
                            var datetime = new Date(yyyy, mm-1, dd, hh, min, ss);
                            //Increment month by one, otherwise the datestring month will be one less than expected as getMonth() returns months from 0 to 11
                            var dateString = datetime.getFullYear() + "-" + (datetime.getMonth()+1) + "-" + datetime.getDate() + " " + datetime.getHours() + ":" + datetime.getMinutes() + ":" + datetime.getSeconds();
                            $scope.image.properties.pvm_kuvaus = dateString;
                        }

                        FileService.saveImage($scope.image).then(function(id) {
                            $scope.edit = false;

                            // "update" the original after successful save
                            $scope.original = angular.copy($scope.image);
                        }, function error(data) {
                            locale.ready('common').then(function() {
                                AlertService.showError(locale.getString('common.Error'), AlertService.message(data));
                            });
                        });
                    };

                    /*
                     * Maximize or restore the modal
                     */
                    $scope.resize = function() {
                        $scope.resizeIcon = ModalService.toggleFullScreen($scope.resizeIcon);
                    };

                    /*
                     * Delete
                     */
                    $scope.deleteImage = function(modalNameId) {
                        var conf = confirm(locale.getString('common.Confirm_delete2', {'item': $scope.image.properties.otsikko}) + ' ('+ locale.getString('common.Image').toUpperCase() +')');
                        if (conf) {
                            FileService.deleteImage($scope.image.properties.id, CONFIG.ENTITY_TYPE_IDS[$scope.entiteetti_tyyppi], $scope.relatedObject.properties.id).then(function success() {
                                /*
                                 * Broadcast the modified data to scopes
                                 */
                                $rootScope.$broadcast('Kuva_modified', {
                                    'id' : $scope.relatedObject.properties.id,
                                    'modalNameId' : modalNameId
                                });

                                $scope.close(modalNameId);
                                locale.ready('common').then(function() {
                                    AlertService.showInfo(locale.getString('common.Image_deleted'));
                                });
                            }, function error(data) {
                                locale.ready('common').then(function() {
                                    AlertService.showError(locale.getString('common.Error'), AlertService.message(data));
                                });
                            });
                        }
                    };

                    $scope.kt = null;
                    if ($scope.relatedObject !== null) {
                        if ($scope.entiteetti_tyyppi == 'rakennus') {
                            $scope.kt = $scope.relatedObject.properties.kiinteisto.kiinteistotunnus;
                        } else if ($scope.entiteetti_tyyppi == 'kiinteisto') {
                            $scope.kt = $scope.relatedObject.properties.kiinteistotunnus;
                        }
                    }
                    $scope.showMoveImageModal = function() {
                        $timeout(function() {
                            ModalService.siirraKuvaModal([$scope.image], $scope.entiteetti_tyyppi, $scope.relatedObject, $scope.kt);
                        }, 10);
                    };

                    $rootScope.$on('Kuva_modified', function(event, data) {
                        if (data.id == $scope.image.properties.id) {
                            $scope.close(data.modalNameId);
                        }
                    });

                }
        ]);