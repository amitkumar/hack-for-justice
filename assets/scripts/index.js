$(function(){
	// Keys (aka ids) are the headlines. 
	var explainerDB = {
		'Notified to appear' : {
			headline : '"Notified to appear"',
			explainer : 'Be sure to appear in court on the date specified. To create an automatic reminder for yourself, <a href="#">click here</a>.',
			triggers : ['notified to appear', 'notice to appear']
		},

		'Arrested' : {
			headline : '"Arrested"',
			explainer : 'The Police took you to jail. This means that police have arrested you.',
			triggers : ['Arrested']
		},

		'Promise to appear' : {
			headline : '"Promise to appear"',
			explainer : 'You signed a paper that says he promises to return to court at a specific date and time.',
			triggers : ['Promise to appear']
		},

		'Trial' : {
			headline : '"Trial"',
			explainer : 'You goes to court for his trial with a lawyer to explain his side of the story.',
			triggers : ['Trial']
		},

		'Arraignment' : {
			headline : '"Arraignment"',
			explainer : 'First time you appears in court. The judge will tell you what he is accused of, what his rights are. If you can’t pay for a lawyer , the court will  give one.',
			triggers : ['Arraignment']
		},

		'Offered a deal' : {
			headline : '"Offered a deal"',
			explainer : 'At the arraignment, you can reply to the judge after learning what he is accused of. He can do that by a so called plea bargain. It’s a deal offered by the judge to avoid a full trial. you can chose to say plea guilty not guilty or no contest.',
			triggers : ['Offered a deal']
		},

		'Admit to be guilty' : {
			headline : '"Admit to be guilty"',
			explainer : 'In a plea bargain, you can admit that he did the crime he ‘s accused of, it is called plead guilty. The judge will then decide that you is guilty and convict him. In reality you may be innocent.',
			triggers : ['Admit to be guilty']
		},

		'Defense attorney' : {
			headline : '"Defense attorney"',
			explainer : 'You need to a lawyer to help explain his side of the story to the court. If you doesn’t have enough $ , he can ask for a free attorney. This is a public defender.',
			triggers : ['Defense attorney']
		},

		'Law enforcement Officer' : {
			headline : 'Leo ( Law enforcement Officer)',
			explainer : 'Law enforcement officers try to stop people from breaking the law. If a Leo thinks you has broken the law, the Leo might Stop you and ask him questions or even take you to jail.',
			triggers : ['leo', 'Law enforcement Officer']
		},

		'Judge' : {
			headline : '"Judge"',
			explainer : 'The person who is in charge of a trial in court. The judge decides how the person is guilty of a crime should be punished.',
			triggers : ['Judge']
		}

		// Press charges: When the prosecutor accuses you of a crime, it also files charges
		// Probation: It is an alternative to prison time, you may receive probation instead. If you behave well, you could avoid prison
		// Probation officer: The PO is supervising you he is sentenced to probation
		// Parole: Parole is an early release from prison if on parole, you is supervised by a parole officer
		// Parole officer:  The parole officer is supervising you when he is released
		// Prosecutor:  Lawyer who works closely with law enforcement officers (Leo). If the prosecutor thinks you broke the law, the prosecutor will file papers with the court that explains what laws you might have been broken.
		// Jury: A jury is a small group of people from the community that watch you’s trial and decide if you broke the law. If you doesn’t want a jury, you can ask to have the judge to decide if you broke the law
		// Sentence: The trial the judge or jury decides that you broke the law, they will tell if you broke the law= guilty. The judge will then have to decide how you is to be punished.
		// Judge: 
		// Bail: The money that you puts as a promise to return to a court for the trial

	};

	var triggerToExplainerMap = {};
	_.each(explainerDB, function(explainer, explainerKey){
		_.each(explainer.triggers, function(trigger){
			triggerToExplainerMap[trigger] = explainerKey;
		});
	});
	console.log('triggerToExplainerMap', triggerToExplainerMap);



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
						
						if (data.length && data[0].textAnnotations && data[0].textAnnotations.length){
							text = data[0].textAnnotations[0].description;
						}

						$('#ocr-text').text(text);
						$('.text-scan-results').text(text);

						appendClaimMatches(text);

						$('.page').removeClass('active');
						$('.page-results').addClass('active');
					},
					error : function error(err){
						console.log('POST /scan-photo response err', err);
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


	function appendClaimMatches(text){
		var $list = $('.result-list');
	
		var lowercasedStr = text.toLowerCase().replace(/(\n)+/g, ' ');

		console.log('appendClaimMatches, matching on string ', lowercasedStr)
		
		
		// get all claim keys, see if they match text in the result
		var triggers = Object.keys(triggerToExplainerMap);
		console.log('triggers list', triggers);
		var pendingExplainers = [];

		_.each(triggerToExplainerMap, function(explainerKey, trigger){
			if (lowercasedStr.indexOf(trigger) >= 0){
				var explainerItem = explainerDB[explainerKey];
				pendingExplainers.push(explainerItem);
			}
		});

		pendingExplainers = _.uniq(pendingExplainers);
		
		console.log('pendingExplainers', pendingExplainers);

		_.each(pendingExplainers, function(explainerItem){
			$list.append(createResultEl({
				headline : explainerItem.headline,
				explainer : explainerItem.explainer
			}));
		});
	}

	function createResultEl(data){
		var str = '<li>' + 
		'<h2 class="claim"></h2>' + 
		'<div class="explainer"></div>' +
		'</li>';

		var $el = $(str);

		$el.find('.claim').text(data.headline);
		$el.find('.explainer').html('<p>' + data.explainer + '</p>');

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
