//This is used now.
angular.module('mip.file').controller(
        'FileUploadController',
        [
                '$scope', 
                '$rootScope', 
                'CONFIG', 
                '$http', 
                'ModalService', 
                'AlertService', 
                '$timeout', 
                'FileService', 
                'Upload', 
                'objectType', 
                'relatedObject', 
                'UserService', 
                'locale', 
                '$window',
                'selectedModalNameId',
                function($scope, $rootScope, CONFIG, $http, ModalService, AlertService, $timeout, FileService, Upload, objectType, relatedObject, UserService, locale, $window, selectedModalNameId) {

                    // Unique modal id which is used for the collapsible panels
                    $scope.modalId = ModalService.getNextModalId();
                    
                    // Valitun modalin nimi ja järjestysnumero
                    $scope.modalNameId = selectedModalNameId;
                	
                    // objectType: What type of object we're handling: 'Rakennus', 'Kiinteisto', etc.
                    // relatedObject: What is the object we're modifying ? (kiinteisto, rakennus etc)
                    $scope.objectType = objectType;
                    $scope.relatedObject = relatedObject;

                    // The images that will be uploaded
                    $scope.files = [];

                    // Counter for showing status of uploaded images
                    $scope.uploadedFiles = -1;
                    // Are we uploading or not?
                    $scope.uploading = false;

                    // Are the form controls disabled or not?
                    $scope.disableButtons = false;

                    // Max image size
                    $scope.MAX_FILE_SIZE = CONFIG.MAX_FILE_SIZE;

                    /*
                     * ------------------- OPERATIONS ------------------------
                     */

                    /*
                     * Will be done automatically after the OS explorer has been closed.
                     */
                    $scope.selectFiles = function(files, errFiles) {
                        

                        $scope.disableButtonsFunc(true);
                        // Update the file properties if the values are empty
                        for (var i = 0; i < files.length; i++) {
                            files[i].properties = {};

                            files[i].status = "loading";
                            
                            if ($scope.objectType == 'kiinteisto') {
                                files[i].properties.otsikko = $scope.relatedObject.properties.nimi;
                            } else if ($scope.objectType == 'rakennus') {
                                if ($scope.relatedObject.properties.inventointinumero) {
                                    files[i].properties.otsikko = $scope.relatedObject.properties.inventointinumero;
                                }
                                if ($scope.relatedObject.properties.rakennustyypit.length > 0) {
                                    files[i].properties.otsikko += " " + $scope.relatedObject.properties.rakennustyypit[0].nimi_fi;
                                }
                            } else if ($scope.objectType == 'arvoalue') {
                                if ($scope.relatedObject.properties.nimi) {
                                    files[i].properties.otsikko = $scope.relatedObject.properties.nimi;
                                } else if ($scope.relatedObject.properties.aluetyyppi.length > 0) {
                                    files[i].properties.otsikko = $scope.relatedObject.properties.aluetyypit[0].nimi_fi;
                                }
                            } else if ($scope.objectType == 'alue') {
                                if ($scope.relatedObject.properties.nimi) {
                                    files[i].properties.otsikko = $scope.relatedObject.properties.nimi;
                                }
                            } else if ($scope.objectType == 'porrashuone') {
                                if ($scope.relatedObject.properties.porrashuoneen_tunnus) {
                                    files[i].properties.otsikko = $scope.relatedObject.properties.porrashuoneen_tunnus;
                                }
                                if($scope.relatedObject.properties.porrashuonetyyppi) {
                                    files[i].properties.otsikko += " " + $scope.relatedObject.properties.porrashuonetyyppi.nimi_fi;
                                }
                            } else if ($scope.objectType == 'kunta') {
                                if ($scope.relatedObject.properties.nimi) {
                                    files[i].properties.otsikko = $scope.relatedObject.properties.nimi;
                                }
                            }  else if ($scope.objectType == 'suunnittelija') {
                                if ($scope.relatedObject.properties.sukunimi) {
                                	var otsikko = $scope.relatedObject.properties.sukunimi;
                                	if ($scope.relatedObject.properties.etunimi){
                                		otsikko = otsikko.concat(' ').concat($scope.relatedObject.properties.etunimi);
                                	}
                                    files[i].properties.otsikko = otsikko;
                                    
                                }
                            }
                        }

                        var fileLength = $scope.files.length;
                        for (var i = 0; i < files.length; i++) {
                            $scope.files.push(files[i]);
                        }
                        // $scope.files += files;
                        for (var i = 0; i < errFiles.length; i++) {
                            $scope.errFiles.push(errFiles[i]);
                        }
                        // $scope.errFiles += errFiles;

                        if ($scope.files.length > 0) {

                            $scope.disableButtonsFunc(true);

                            // Start uploading immediately
                            $scope.recUpload(fileLength);
                        } else {
                            $scope.disableButtonsFunc(false);
                        }
                    };

                    /*
                     * Close
                     */
                    $scope.close = function() {
                        /*
                         * Broadcast information about changed images to the parent
                         */
                        if ($scope.uploadedFiles > 0) {
                            $rootScope.$broadcast('Tiedosto_modified', {
                                'id' : $scope.relatedObject.properties.id
                            });
                        }

                     // Sulkee modaalin ja poistaa listalta
                    	ModalService.closeModal($scope.modalNameId);
                        $scope.$destroy();
                    };

                    /*
                     * Save & close
                     */
                    $scope.save = function(modalNameId) {
                    	// Asetetaan valitun modaalin id tallennuksen jälkeistä modaalin poistoa varten
                    	$scope.modalNameId = modalNameId;
                    	
                        // Update each of the images and save the modal when finished.
                        $scope.recSave(0);
                    };

                    /*
                     * Remove image from the upload / errorFiles list
                     */
                    $scope.remove = function(index, errFiles) {
                        if (errFiles == true) {
                            $scope.errFiles.splice(index, 1);
                        } else {
                            if ($scope.files[index].properties.id) {
                                // Image is stored, remove it from the backend also
                                FileService.deleteFile($scope.files[index].properties.id, CONFIG.ENTITY_TYPE_IDS[$scope.objectType], $scope.relatedObject.properties.id).then(function success(data) {
                                    $scope.files.splice(index, 1);
                                    $scope.uploadedFiles--;
                                }, function error(data) {
                                    locale.ready('common').then(function() {
                                        AlertService.showError(locale.getString('common.Error'), AlertService.message(data));
                                    });
                                });

                            } else {
                                // If there was a failure uploading the images, upload if the failed one was removed.
                                var uploadRest = false;
                                if ($scope.files[index].status == 'failure') {
                                    uploadRest = true;
                                }
                                $scope.files.splice(index, 1);
                                if (uploadRest) {
                                    $scope.recUpload(index);
                                }
                            }
                        }
                    };

                    /*
                     * --------------------- HELPER FUNCTIONS ----------------------
                     */
                    /*
                     * Method for updating the image data
                     */
                    $scope.recSave = function(i) {
                        $scope.disableButtonsFunc(true);
                        if (i < $scope.files.length) {
                            if ($scope.files[i].properties.id == null) {
                                // Do not try to save images that failed.
                                $scope.recSave(i + 1);
                            }

                            FileService.saveFile($scope.files[i], null, null, null).then(function success(response) {
                                $scope.recSave(i + 1);
                            }, function error(data) {
                                locale.ready('common').then(function() {
                                    AlertService.showError(locale.getString('common.Error'), AlertService.message(data));
                                });
                                $scope.files[i].errorMessage = AlertService.message(data);
                                $scope.disableButtonsFunc(false);
                                $scope.uploading = false;
                            });
                        } else {
                            $scope.disableButtonsFunc(false);
                            $scope.uploading = false;

                            /*
                             * Broadcast information about changed images to the parent
                             */
                            if ($scope.uploadedFiles > 0) {
                                $rootScope.$broadcast('Tiedosto_modified', {
                                    'id' : $scope.relatedObject.properties.id
                                });
                            }
                            // Close
                            $scope.close($scope.modalNameId);
                            $scope.$destroy();

                            return;
                        }
                    };

                    $scope.showPopover = function(file) {
                        var content = locale.getString('common.Status') + ":";
                        var errorMessage = "";
                        if (file.status == 'loading') {
                            content += locale.getString('common.Processing');
                        } else if (file.status == 'ready') {
                            content += locale.getString('common.Ready');
                        } else if (file.status == 'failure') {
                            content += locale.getString('common.Error');
                            content += '<br>';
                            content += locale.getString('common.Remove_image_to_continue');
                        }
                        if (file.errorMessage && file.errorMessage.length > 0) {
                            errorMessage = file.errorMessage;
                        }

                        popover = {
                            title : file.name,
                            content : content + "<br>" + errorMessage,
                        }
                        return popover;
                    };

                    /*
                     * Method for uploading the images and their related data
                     */
                    $scope.recUpload = function(i) {
                        $scope.uploading = true;

                        if (i < $scope.files.length) {
                            if ($scope.files[i].properties.id != null) {
                                // Do not try to save images that are already uploaded
                                $scope.recUpload(i + 1);
                            }
                            FileService.saveFile($scope.files[i], $scope.files[i].properties, CONFIG.ENTITY_TYPE_IDS[$scope.objectType], $scope.relatedObject.properties.id).then(function success(response) {
                                // Update the image id.
                                $scope.files[i].properties.id = response.data.properties.id;

                                $scope.uploadedFiles = i + 1;

                                $scope.files[i].status = "ready";
                                $scope.recUpload(i + 1);

                            }, function error(data) {
                                locale.ready('common').then(function() {
                                    AlertService.showError(locale.getString('common.Error'), AlertService.message(data));
                                });
                                $scope.files[i].errorMessage = AlertService.message(data);
                                $scope.disableButtonsFunc(false);
                                $scope.uploading = false;
                                $scope.files[i].status = 'failure';
                            });
                        } else {
                            $scope.disableButtonsFunc(false);
                            $scope.uploading = false;

                            return;
                        }
                    };

                    /*
                     * Error message parsing and translating
                     */
                    $scope.errorMessage = function(error, param) {
                        var retMsg = locale.getString('common.Image_is_not_uploaded') + ": ";

                        switch (error) {
                            case 'maxSize':
                                retMsg += locale.getString('common.Image_too_big') + ". ";
                                param ? retMsg += locale.getString('common.Max_allowed_image_size') + param : ".";
                                break;
                            // TODO: The rest if needed
                            /*
                             * Available validators (at least): minSize, maxTotalSize, maxHeight, minHeight, maxWidth, minWidth, maxRatio, minRatio, maxDuration, minDuration, maxFiles
                             */

                        }

                        return retMsg;
                    };

                    // Enable / Disable save and cancel buttons while doing operations.
                    $scope.disableButtonsFunc = function(value) {
                        if (value != null) {

                            $scope.disableButtons = value;
                        } else {
                            if ($scope.disableButtons) {
                                $scope.disableButtons = false;
                            } else {
                                $scope.disableButtons = true;
                            }
                        }
                    };

                }
        ]);