$(function(){
	var logoDB = {
		'NYC Department of Education' : 'Verizon',
		'Verizon' : 'Verizon',
		'Sprint' : 'Sprint',
		'AT&T' : 'AT&T',
		'Virgin Mobile' : 'Virgin Mobile',
		'T-Mobile' : 'T-Mobile',
		'T Mobile' : 'T-Mobile'
	};

	var claimRebuttalDB = {
		'worth $650' : {
			claim : 'Worth $650*',
			rebuttal : '*That\'s $650, minus activation fees, minus the new phone you have to buy, minus extra cancellation fees, plus the frustration of being on a carrier who charges data overages every month, equals: not worth it.'
		},
		'buy a new phone' : {
		 	claim : 'Buy a new phone*',
		 	rebuttal : '*What if you like your phone? T-Mobile lets you bring your own device, and we\'ll just swap out the sim card - at no charge to you. Or if you want a new smartphone, that\'s on us, too.'
		 },
		'vzw gift card' : {
			claim : 'VZW Gift Card*',
			rebuttal : '*A gift card? That\'s not real money. Wouldn\'t you rather save your cash than have to give it back to Verizon, anyway? Nice try, Verizon.'
		},
		'wait, more fine print?' : {
			claim : 'Wait, more fine print?*',
			rebuttal : '*Oh {{Carrier}}, you shouldn\'t have.'
		},
		'T-Mobile' : {
			claim : 'T-Mobile',
			rebuttal: 'No contracts, No overages, No limits, No Bullsh*t'
		}
	};

	var claimKeys = Object.keys(claimRebuttalDB);


	var $fileInput = $('#image-select');

	$fileInput.on('change', onFileChange);

	function onFileChange() {
		
		if ($fileInput.get(0).files) {
			loadFileReader($fileInput.get(0).files[0]);
		}
	}

	function loadFileReader(file) {
		const fileReader = new FileReader();
		if (file && file.type.match('image')) {
			fileReader.readAsDataURL(file);
			fileReader.onload = onFileReaderLoaded;
			fileReader.onerror = onFileReaderError;
		}
		else if (file) {
			onFileReaderError();
		}
	}

	function onFileReaderLoaded(e) {
		// console.log('file loaded', e.target.result);
		$('.selected-image').css('background-image', 'url(' + e.target.result + ')');

		var img = new Image();
		
		img.onload = function(){
			EXIF.getData(img, function(){
				var exif = EXIF.getTag(img, "Orientation")
				console.log(exif);
				switch(exif){
					case 3:
					// 180° rotate left
					// ctx.rotate(180*Math.PI/180);
					// $('.selected-image').css('transform', 'rotate(180deg)');
					break;
					case 6:
					// 90° rotate right
					// ctx.rotate(-90*Math.PI/180);
					var targetWidth = $('.selected-image-wrapper').height(),
						targetHeight = $('.selected-image-wrapper').width();

					$('.selected-image')
						.css({
							'transform' : 'rotate(90deg) translate3d(25%,25%,0)',// + targetWidth/2 + 'px,' + targetHeight/2 + 'px,0)',
							'height' : targetHeight + 'px',
							'width' : targetWidth + 'px'
							// 'transform-origin' : '0 0'
						});
					console.log("$('.selected-image').css('transform'')" + $('.selected-image').css('transform'));
					break;
					case 8:
					// 90° rotate left
					// ctx.rotate(90*Math.PI/180);
					// $('.selected-image').css('transform', 'rotate(270deg)');
					break;
				}	

				// $('#ocr-text').text('Processing...');
				$('.page').removeClass('active');
				$('.page-spinner').addClass('active');

				$.ajax({
					type: 'POST',
					url: '/scan-photo',
					data: JSON.stringify({
						imageUrl : e.target.result
					}),
					contentType: "application/json",
					dataType: "json",
					success: function success(data){
						console.log('POST /scan-photo response', data);
						
						var text = '';
						var logo = 'Verizon';

						if (data.length && data[0].textAnnotations && data[0].textAnnotations.length){
							text = data[0].textAnnotations[0].description;
						}

						if (data.length && data[0].logoAnnotations && data[0].logoAnnotations.length){
							if (logoDB[data[0].logoAnnotations[0].description]){
								logo = logoDB[data[0].logoAnnotations[0].description];	
							}
						}

						$('#ocr-text').text(text);
						$('.text-scan-results').text(text);

						appendClaimMatches(text, logo);

						$('.page').removeClass('active');
						$('.page-results').addClass('active');
					},
					error : function error(err){
						console.log('POST /scan-photo response err', err);
					}
				});
			});
		

			
		};
		img.src = e.target.result;
		
	}

	function onFileReaderError() {
		console.log('error');
	}


	function appendClaimMatches(text, logo){
		var $list = $('.result-list');
		var lowercasedStr = text.toLowerCase();

		

		// get all claim keys, see if they match text in the result
		_.each(claimKeys, function(key){
			if (lowercasedStr.indexOf(key) >= 0){
				var rebuttalItem = claimRebuttalDB[key];
				$list.append(createResultEl({
					claim : rebuttalItem.claim,
					rebuttal : rebuttalItem.rebuttal
				}));
			}
		});

		
		if (logo === 'T-Mobile'){
			$list.hide();
			$('.page-results h1').css('line-height', '1.5em').html('No&nbsp;contracts<br/>No&nbsp;overages<br/>No&nbsp;limits<br/>No&nbsp;Bullsh*t');
		} else {
			// Force the 'wait, more fine print?' item to show
			var rebuttalItem = claimRebuttalDB['wait, more fine print?'];
			var rebuttalText = rebuttalItem.rebuttal.replace('{{Carrier}}', logo);

			$list.append(createResultEl({
				claim : rebuttalItem.claim,
				rebuttal : rebuttalText
			}));
		}
	}

	function createResultEl(data){
		var str = '<li>' + 
					'<h2 class="claim"></h2>' + 
					'<p class="rebuttal"></p>' +
				'</li>';

		var $el = $(str);

		$el.find('.claim').text(data.claim);
		$el.find('.rebuttal').text(data.rebuttal);

		return $el;
	}

	
	// $('.parallax-container').parallax({
	// 	'scalarX' : 10,
	// 	'scalarY' : 10,
	// 	'frictionX' : 1,
	// 	'frictionY' : 1,
	// 	'calibrateY' : true,
	// 	'calibrateX' : true,
	// 	'limitY' : 40,
	// 	'limitX' : 40
	// });


});
