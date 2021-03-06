// Code from Milan

function imageTransloader(info) {
	console.log(info);
	// setup clipboard shiv
	var background = chrome.extension.getBackgroundPage();
	var ta = background.document.createElement("textarea");
	ta.id = "clipboard";
	background.document.body.appendChild(ta);

	// get filename
	var filename = info.srcUrl.substring(info.srcUrl.lastIndexOf('/') + 1);

	// facebook id fix
	var pattern = /fbcdn\-sphotos/;
	if (pattern.test(info.srcUrl)) {
		filename = "fb.jpg";
	}

	// make sure it's not empty
	if (filename === "") {
		filename = "something.jpg";
	}

	// fetch the image
	var fileGet = new XMLHttpRequest();
	fileGet.open("GET", info.srcUrl, true);
	fileGet.responseType = "arraybuffer";
	fileGet.onreadystatechange = function(oEvent) {
		if (fileGet.readyState === 4) {
			if (fileGet.status === 200) {

				// get neccessary metadata
				var filesize = fileGet.getResponseHeader("Content-Length");
				var mimetype = fileGet.getResponseHeader("Content-Type");

				// build blob
				var dataview = new DataView(fileGet.response);
				var blob = new Blob([ dataview ]);

				// check if gif && > 2MB
				if (filesize > (1024 * 1024 * 2) && mimetype === "image/gif") {
					// notify user, updated for chrome.notifications api
					chrome.notifications.create('fail', {
						type : "basic",
						title : "Image transloading failed",
						message : "This gif is too big (>2MB)",
						iconUrl : "src/images/lueshi_48_i.png"
					}, function() {
					});
					setTimeout(function() {
						// removed second ; from end of next line
						chrome.notifications.clear('fail', function() {
						});
					}, 3000);
				} else {
					// construct FormData object
					var formData = new FormData();
					formData.append("file", blob, filename);

					// open connection to ETI and set callback
					var xhr = new XMLHttpRequest();
					xhr.open("POST", "http://u.endoftheinter.net/u.php", true);
					xhr.onreadystatechange = function(xEvent) {
						if (xhr.readyState === 4) {
							if (xhr.status === 200) {

								// parse response
								var html = document.createElement('html');
								html.innerHTML = xhr.responseText;
								try {
									var value = html
											.getElementsByClassName('img')[0]
											.getElementsByTagName('input')[0].value;
								} catch (e) {
									console.log("Error in response",
											html.innerHTML);
									return;
								}

								// send img code to clipboard
								var clipboard = document
										.getElementById('clipboard');
								clipboard.value = value;
								clipboard.select();
								document.execCommand("copy");

								// notify user, updated for chrome.notifications
								// api
								chrome.notifications
										.create(
												'succeed',
												{
													type : "basic",
													title : "Image transloaded",
													message : "The img code is now in your clipboard",
													iconUrl : "src/images/lueshi_48.png"
												}, function() {
												});
								setTimeout(function() {
									// removed second ; from end of next line
									chrome.notifications.clear('succeed',
											function() {
											});
								}, 3000);
							} else {
								console.log("Error ", xhr.statusText);
							}
						}
					}
					// send FormData object to ETI
					xhr.send(formData);
				}
			} else {
				console.log("Error ", xhr.statusText);
			}
		}
	};
	fileGet.send(null);
};