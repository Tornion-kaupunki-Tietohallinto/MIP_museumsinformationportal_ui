//This is used now.
angular.module('mip.file').controller(
        'ArkKarttaUploadController',
        [
                '$scope', '$rootScope', 'CONFIG', '$http', 'ModalService', 'AlertService',
                '$timeout', 'KarttaService', 'Upload', 'objectType', 'relatedObject', 'UserService',
                'locale', '$window', 'selectedModalNameId', 'tutkimusId', '$filter',
                function($scope, $rootScope, CONFIG, $http, ModalService, AlertService,
                		$timeout, KarttaService, Upload, objectType, relatedObject, UserService,
                		locale, $window, selectedModalNameId, tutkimusId, $filter) {

                    // Unique modal id which is used for the collapsible panels
                    $scope.modalId = ModalService.getNextModalId();

                	// Valitun modalin nimi ja järjestysnumero
                    $scope.modalNameId = selectedModalNameId;

                    // objectType: What type of object we're handling: 'Löytö', 'Yksikkö', etc.
                    // relatedObject: What is the object we're modifying ? (löytö, yksikkö, etc)
                    $scope.objectType = objectType;
                    $scope.relatedObject = relatedObject;

                    // The images that will be uploaded
                    $scope.files = [];

                    // Counter for showing status of uploaded images
                    $scope.uploadedKartat = -1;
                    // Are we uploading or not?
                    $scope.uploading = false;

                    // Are the form controls disabled or not?
                    $scope.disableButtons = false;

                    //Max image size
                    $scope.MAX_FILE_SIZE = CONFIG.MAX_FILE_SIZE;

                    $scope.tutkimusId = tutkimusId;

                    $scope.hasLinkedEntities = false;

                    $scope.focusInput = false;

                    //Jos tämä on valittu, asetetaan kaikille fileille sama
                    //tekijänoikeuslauseke
                    $scope.tekijanoikeuslauseke = "";

                    $scope.$watch('tekijanoikeuslauseke', function() {
                    	if($scope.files) {
	                    	for(var i = 0; i<$scope.files.length; i++) {
	                    		if($scope.files[i].properties) {
	                    			$scope.files[i].properties.tekijanoikeuslauseke = $scope.tekijanoikeuslauseke;
	                    		}
	                    	}
                    	}
                    });
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

                            files[i].properties.piirtaja = UserService.getProperties().user.sukunimi + " " + UserService.getProperties().user.etunimi;
                            files[i].properties.mittaukset_kentalla = files[i].properties.piirtaja;
                            files[i].properties.organisaatio = UserService.getProperties().user.organisaatio;
                            files[i].properties.karttatyyppi = {};
                            files[i].properties.koko = {id: 1}; //A4
                            files[i].status = "loading";

                            // The date is set separately in $scope.setDate() function due to the image needing to be loaded before
                            // the exif data can be read.
                        }

                        var fileLength = $scope.files.length;
                        for(var i = 0; i<files.length; i++)
                        {
                            $scope.files.push(files[i]);
                        }
                        //$scope.files += files;
                        for(var i = 0; i<errFiles.length; i++)
                        {
                            $scope.errFiles.push(errFiles[i]);
                        }
                        //$scope.errFiles += errFiles;

                        if ($scope.files.length > 0) {

                            $scope.disableButtonsFunc(true);

                            //Start uploading immediately
                            $scope.recUpload(fileLength);
                        } else {
                            $scope.disableButtonsFunc(false);
                        }
                    };

                    /*
                     * Close
                     */
                    $scope.close = function() {
                    	if(!$scope.validateLinkedEntities()) {
                    		AlertService.showWarning(locale.getString('ark.Map_must_be_linked'));
                    		return;
                    	}
                    	 /*
                         * Broadcast information about changed images to the parent
                         */
                        if ($scope.uploadedKartat > 0) {
                        	//Ei lähetetä erikseen id-listaa tai muutakaan, vaan tässä tilanteessa kaikki scopet jotka kuuntelevat
                        	//arkKuva_modified eventtiä, päivitetään. Yksinkertaisempi verrattuna toteutukseen
                        	//jossa ylläpidetään id-listaa kaikista linkatuista itemeistä ja niiden mukaiset scopet päivitetään
                            $rootScope.$broadcast('arkKartta_modified', {});
                        }
                    	//Sulkee modaalin ja poistaa listalta
                    	ModalService.closeModal($scope.modalNameId);
                        $scope.$destroy();
                    };

                    /*
                     * Save & close
                     */
                    $scope.save = function(modalNameId) {
                    	if(!$scope.validateLinkedEntities()) {
                    		AlertService.showWarning(locale.getString('ark.Image_must_be_linked'));
                    		return;
                    	}

                    	// Asetetaan valitun modaalin id tallennuksen jälkeistä modaalin poistoa varten
                    	$scope.modalNameId = modalNameId;

                        //Update each of the images and save the modal when finished.
                        $scope.recSave(0);
                    };

                    //Tarkastetaan, että joikasella tiedostolla on linkattuna ainakin jokin yksikkö tai löytö
                    $scope.validateLinkedEntities = function() {
                    	/*
                    	for(var i = 0; i<$scope.files.length; i++) {
                    		if($scope.files[i].properties.loydot.length === 0 && $scope.files[i].properties.yksikot.length === 0 && $scope.files[i].properties.naytteet.length === 0) {
                    			return false;
                    		}
                    	}
                    	*/
                    	return true;
                    };


                    /*
                     * Remove kartta from the upload / errorFiles list
                     */
                    $scope.remove = function(index, errFiles) {
                        if (errFiles == true) {
                            $scope.errFiles.splice(index, 1);
                        } else {
                            if($scope.files[index].properties.id) {
                                //kartta is stored, remove it from the backend also
                                KarttaService.deleteArkKartta($scope.files[index].properties.id, CONFIG.ENTITY_TYPE_IDS[$scope.objectType], $scope.relatedObject.properties.id).then(function success(data) {
                                    $scope.files.splice(index, 1);
                                    $scope.uploadedKartat--;
                                }, function error(data) {
                                    locale.ready('common').then(function() {
                                        AlertService.showError( locale.getString('common.Error'), AlertService.message(data));
                                    });
                                });

                            } else {
                                //If there was a failure uploading the images, upload if the failed one was removed.
                                var uploadRest = false;
                                if($scope.files[index].status == 'failure') {
                                    uploadRest = true;
                                }
                                $scope.files.splice(index, 1);
                                if(uploadRest) {
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
                            if($scope.files[i].properties.id == null) {
                                //Do not try to save images that failed.
                                $scope.recSave(i + 1);
                            }

                            KarttaService.saveArkKartta($scope.files[i], null, null, null, $scope.tutkimusId).then(function success(response) {
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
                            //Close
                            $scope.close($scope.modalNameId);
                            $scope.$destroy();

                            return;
                        }
                    };

                    $scope.showPopover = function(file) {
                        var content = locale.getString('common.Status') + ":";
                        var errorMessage = "";
                        if(file.status == 'loading') {
                            content += locale.getString('common.Processing');
                        } else if(file.status == 'ready') {
                            content += locale.getString('common.Ready');
                        } else if(file.status == 'failure') {
                            content += locale.getString('common.Error');
                            content +='<br>';
                            content += locale.getString('common.Remove_image_to_continue');
                        }
                        if(file.errorMessage && file.errorMessage.length > 0) {
                            errorMessage = file.errorMessage;
                        }

                        popover = {
                                title: file.name + ', ' + $filter('Filesize')(file.size),
                                content: content + "<br>" + errorMessage,
                        }
                        return popover;
                    };

                    /*
                     * Method for uploading the images and their related data
                     */
                    $scope.recUpload = function(i) {
                        $scope.uploading = true;

                        if (i < $scope.files.length) {
                            if($scope.files[i].properties.id != null) {
                                 //Do not try to save images that are already uploaded
                                $scope.recUpload(i + 1);
                            }
                            KarttaService.saveArkKartta($scope.files[i], $scope.files[i].properties, CONFIG.ENTITY_TYPE_IDS[$scope.objectType], $scope.relatedObject.properties.id, $scope.tutkimusId).then(function success(response) {
                                // Update the image id.
                                $scope.files[i].properties.id = response.data.properties.id;

                                KarttaService.getArkKartta($scope.files[i].properties.id).then(function(data) {
                                    if($scope.tekijanoikeuslauseke.length > 0) {
                                    	$scope.files[i].properties.tekijanoikeuslauseke = $scope.tekijanoikeuslauseke;
                                    }

                                    if($scope.objectType == 'loyto') {
                                    	$scope.files[i].properties.loydot = [$scope.relatedObject.properties];
                                    }
                                    if($scope.objectType == 'yksikko') {
                                    	$scope.files[i].properties.yksikot = [$scope.relatedObject.properties];
                                    }
                                    if($scope.objectType == 'nayte') {
                                    	$scope.files[i].properties.naytteet = [$scope.relatedObject.properties];
                                    }

                                    $rootScope.$broadcast('mip-linkitys', {
                                    	mode : 'kartta',
                                    	entityId : $scope.files[i].properties.id,
                                    	nayteCount : $scope.files[i].properties.naytteet.length,
                                    	loytoCount : $scope.files[i].properties.loydot.length,
                                    	yksikkoCount : $scope.files[i].properties.yksikot.length
                                    });

                                    $scope.uploadedKartat = i + 1;

                                    $scope.files[i].status = "ready";
                                    $scope.recUpload(i + 1);

                                	//Focus on the map type control after the first map is available for modification
                                    if(i === 0) {
                                    	$scope.focusInput = true;
                                    }

                                });

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

                    $scope.checkUniqueKarttanumero = function(kn, karttaId, field, karttatyyppi) {
                    	$scope.tmpField = field;
	                    if(karttatyyppi && kn) {
	                    	KarttaService.isArkKarttanumeroUnique({'karttanumero': kn, 'karttaId': karttaId, 'ark_tutkimus_id': tutkimusId, 'tyyppi': karttatyyppi.id}).then(function s(data) {
	                    		if(data.properties === true) {
									$scope.form[$scope.tmpField].$setValidity('kaytossa', true);
								} else {
									$scope.form[$scope.tmpField].$setValidity('kaytossa', false);
								}
	                    	}, function e(data) {
	                    		AlertService.showError(locale.getString("common.Error"));
	                    	});
	                    }
                    };

                    /*
                     * Backend returns the next free karttanumero. If we're uploading 10 files, we get the same
                     * next free karttanumero for each after the type has been selected.
                     * Do a little bit of fiddling to get the next karttanumero using also the files to be uploaded
                     * to get the increment right.
                     */
                    $scope.getNextKarttanumeroLocal = function(f) {
                    	var sametypebeforefileCount = 0; //how many files w/ the same type before our file

                    	for(var i = 0; i<$scope.files.length; i++) {
                    		//Is the type same
                			if($scope.files[i].properties.karttatyyppi && $scope.files[i].properties.karttatyyppi.numero === f.properties.karttatyyppi.numero) {
                				//Is the i pointing to the file we are fiddling?
                				if($scope.files[i].properties.id !== f.properties.id) {
                					//If not, we can increment the counter
                					sametypebeforefileCount++;
                				} else {
                					//Go no further, we have found all the files with the same type
                					//in the list before our file (f). -> All done
                                	f.properties.karttanumero += sametypebeforefileCount;
                					break;
                				}
                    		}
                    	}

                    	//TODO: loop $scope.files backwards and count the files w/ the same type already set
                    	// after the file we're modifying. Otherwise, if the user first sets the type of e.g. file nr5,
                    	// and then sets the same type for the file nr3, the both will get the same karttanumero

                    	//TODO: and then verify that the set number is not already assigned for some of the files
                    	//e.g. if the user has assigned manually a larger karttanumero to one of the files in the list
                    	//or if the user fiddles around changing the karttanumero multiple times
                    };

                    $rootScope.$on('mip-karttatyyppi-karttanumeroChanged', function(event, data) {
                    	for(var i = 0; i<$scope.files.length; i++) {
                    		if($scope.files[i].properties && $scope.files[i].properties.id && $scope.files[i].properties.id === data.fileId) {
                    			$scope.getNextKarttanumeroLocal($scope.files[i]);
                    			break;
                    		}
                    	}
                    });

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