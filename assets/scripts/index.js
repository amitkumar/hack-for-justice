$(function(){
	// Keys (aka ids) are the headlines. 
	var explainerDB = {
		'test' : {
			headline : 'test headline',
			explainer : 'test explainer',
			triggers : ['notified to appear']
		}
	};

	var triggerToRebuttalMap = {};
	_.each(explainerDB, function(explainer, explainerKey){
		_.each(explainer.triggers, function(trigger){
			triggerToRebuttalMap[trigger] = explainerKey;
		});
	});
	console.log('triggerToRebuttalMap', triggerToRebuttalMap);



	var $fileInput = $('#image-select');

	$fileInput.on('change', onFileChange);

	function onFileChange() {
		// $('#ocr-text').text('Processing...');
		$('.page').removeClass('active');
		$('.page-spinner').addClass('active');

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
					$('.selected-image')
					.css({
						'transform' : 'rotate(180deg)'
					});
					console.log("$('.selected-image').css('transform'')" + $('.selected-image').css('transform'));
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
				$('.selected-image').css('opacity', '1');
				

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
						var carrier = 'Verizon';

						if (data.length && data[0].textAnnotations && data[0].textAnnotations.length){
							text = data[0].textAnnotations[0].description;
						}

						$('#ocr-text').text(text);
						$('.text-scan-results').text(text);

						// appendClaimMatches(text, carrier);

						$('.page').removeClass('active');
						$('.page-results').addClass('active');
					},
					error : function error(err){
						console.log('POST /scan-photo response err', err);
						appendClaimMatches('', 'T-Mobile');
						$('.page').removeClass('active');
						$('.page-results').addClass('active');
					}
				});
			});
		};
		img.src = e.target.result;
	}

	function onFileReaderError() {
		console.log('error');
	}


	function appendClaimMatches(text, carrier){
		var $list = $('.result-list');
	
		// text = "An invitation\nworth $650.\nWe'll pay for\nwhat's standing\nin your way.\nGet up to $650 when\nyou Switch your number,\ntrade in your phone and\nbuy a new one.\nLimited Time Offer $650 -$300 trade-in VZW gift card up to $350\nVisa prepaid card for switching fees. New 4G smartphone device\npayment activation and port-in from AT&T, TMobile, Sprint or U.S.\nCellular required. Accout must remain active for at least 45 days.\nTrade-in must be in good working condition\nVerizon\nOffer valid for activations in select Verizon wireless retail or authorized a\nlocations in Chicago, Rockford\", and Northwest Indiana Only. Limited Time 0ffer. Reimburesement for early termination fees or device\ninstallment buyoutcosts associated with switch will be paid with a Visa pre-paid card. Cards will be mailed via US Postal Service within 8 weeks after receipt of claim. Cards willbe mailed to the billing address on file\nwith Verizon Wireless. Cards will be issued in US dollars only. Cards are valid through the 6-month expiration date shown on the card. Cards are issued by Citibank not applicable pursuant to a license from Visa USA Inc\nand managed by Citi Prepaid Services. Cards will not have cash access and\ncan be used everywhere Visa debit cards are accepted. Maximum of 10 portin a\nvations/valid submissions peraccount. Subject to VZW\nagmts, Calling Plan and\ncredit approval. Offers and coverage, varying by swc, not available everywhere. See vzw.com While supplies last.\n";
		var lowercasedStr = text.toLowerCase().replace(/(\n)+/g, ' ');

		console.log('appendClaimMatches, matching on string ', lowercasedStr)
		
		
		// get all claim keys, see if they match text in the result
		var triggers = Object.keys(triggerToRebuttalMap);
		console.log('triggers list', triggers);
		var pendingRebuttals = [];

		_.each(triggerToRebuttalMap, function(explainerKey, trigger){
			if (lowercasedStr.indexOf(trigger) >= 0){
				var explainerItem = explainerDB[explainerKey];
				pendingRebuttals.push(explainerItem);
			}
		});
	}

	function createResultEl(data){
		var str = '<li>' + 
		'<h2 class="claim"></h2>' + 
		'<p class="explainer"></p>' +
		'</li>';

		var $el = $(str);

		$el.find('.claim').text(data.headline);
		$el.find('.explainer').text(data.explainer);

		return $el;
	}

	
	$('.parallax-container').parallax({
		'scalarX' : 10,
		'scalarY' : 10,
		'frictionX' : 1,
		'frictionY' : 1,
		'calibrateY' : true,
		'calibrateX' : true,
		'limitY' : 40,
		'limitX' : 40
	});
});
