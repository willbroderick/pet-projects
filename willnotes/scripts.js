//Declaration of list manager
function listEngine(listListingSelector, listCanvasSelector) {
	this.listTemplateHTML = $('#list-template').html();
	this.detailTemplateHTML = $('#list-detail-template').html();
	this.listItemTemplateHTML = $('#list-item-template').html();
	
	this.listListingEl = $(listListingSelector);
	this.listCanvasEl = $(listCanvasSelector);
	this.currentListFilename = '';
	this.currentListData = {"lists":[]};
	this.logon_credentials = {};
	
	this.initEvents = function(){
		if(typeof($('body').data('listEngineEventsAdded')) == 'undefined') {
			$('body').data('listEngineEventsAdded', true);

			var localRef = this;

			//Add new list
			$(document).on('click', '#new-list', function(){
				var newListName = prompt('Give your list a name', 'New list');
				if(newListName) {
					localRef.currentListData.lists.push({ "name" : newListName });
					localRef.reloadDisplay();
					localRef.saveListData();
				}
			});

			//Delete a list
			$(document).on('click', '#list-listing .list .delete', function(){
				if(confirm('Are you SURE you want to cap this foo\'?')) {
					var id = $(this).closest('.list').data('id');
					localRef.currentListData.lists.splice(id, 1);
					localRef.reloadDisplay();
					localRef.saveListData();
				}
			});

			//Expand list to canvas
			$(document).on('click', '#list-listing .list .expand', function(){
				var id = $(this).closest('.list').data('id');
				localRef.currentListData.lists[id].showDetail = true;
				localRef.reloadDisplay(false, true);
				localRef.saveListData();
			});

			//Remove list from canvas
			$(document).on('click', '#list-canvas .list-detail .close', function(){
				var id = $(this).closest('.list-detail').data('id');
				localRef.currentListData.lists[id].showDetail = false;
				localRef.reloadDisplay(false, true);
				localRef.saveListData();
			});

			//Tick an item
			$(document).on('click', '#list-canvas .list-detail .list-item .tick', function(){
				var itemId = $(this).closest('.list-item').data('id');
				var listId = $(this).closest('.list-detail').data('id');
				if(typeof(localRef.currentListData.lists[listId].items[itemId].ticked) == 'undefined') {
					localRef.currentListData.lists[listId].items[itemId].ticked = true;
				} else {
					localRef.currentListData.lists[listId].items[itemId].ticked = !localRef.currentListData.lists[listId].items[itemId].ticked;
				}
				localRef.reloadDisplay(false, true);
				localRef.saveListData();
			});

			//Expand comments on an item
			$(document).on('click', '#list-canvas .list-detail .list-item .comments', function(){
				alert('Not yet!');
			});

			$('#destroybox').droppable({
				hoverClass: 'hover',
				drop: function( event, ui ) {
					if(ui.draggable.hasClass('list-item-draggable')) {
						var itemId = ui.draggable.closest('.list-item').data('id');
						var listId = ui.draggable.closest('.list-detail').data('id');
						localRef.currentListData.lists[listId].items.splice(itemId, 1);
						localRef.reloadDisplay(false, true);
						localRef.saveListData();
					}
				}
			});

			this.bindImpermanentDragDropEvents();
		}
	};

	//Drag/drop events using jQuery UI. Must be bound every time the element is added.
	this.bindImpermanentDragDropEvents = function(){
		//If anything start behaving funnily, try running this on it first: .droppable('destroy')
		var localRef = this;

		//Add list item
		$('#item-new .dragme').draggable({
			revert: true
		});
		$('#list-canvas .list-detail header, #list-canvas .list-detail .list-item').droppable({
			tolerance: 'pointer',
			accept: '.new-list-item-draggable',
			over: function(event, ui){
				$(this).append('<div class="addingtemp">'+$('#newitemtext').val()+'</div>');
			},
			out: function(){
				$(this).find('.addingtemp').remove();
			},
			drop: function( event, ui ) {
				$(this).find('.addingtemp').remove();
				//Add this item to the list
				var listIndex = $(this).closest('.list-detail').data('id');

				var newIndex = 0;
				if($(this).hasClass('list-item')) {
					newIndex = $(this).data('id') + 1;
				}

				//Does list exist? If not, make
				if(typeof(localRef.currentListData.lists[listIndex].items) == 'undefined') {
					localRef.currentListData.lists[listIndex].items = new Array();
				}

				//Add to list
				localRef.currentListData.lists[listIndex].items.splice(newIndex, 0, { 'name':$('#newitemtext').val() });
				//Redraw canvas (can we just redraw a specific list within canvas?)
				localRef.reloadDisplay(false, true);
				localRef.saveListData();
			}
		});

		//Delete/move list item
		$('#list-canvas .list-detail .list-item .dragme').draggable({revert: true});
	};

	this.initEvents();

	this.loadListData = function(listFilename){
		this.currentListFilename = listFilename;

		//Fetch data file using Ajax
		var thisRef = this;
		$.post('io.php', { 
				'a':'read', 
				'file': listFilename, 
				'logon_username': this.logon_credentials.username,
				'logon_expiry': this.logon_credentials.expiry,
				'logon_token': this.logon_credentials.token
			}, function(data) {
			if(typeof(data.status) != 'undefined' && data.status == 'ERROR') {
				alert(data.message);
			} else {
				if(typeof(data.lists) == 'undefined') {
					console.log('Lists not found on returned file. Attempt JSON parse.');
					thisRef.currentListData = JSON.parse(data);
					console.log(typeof(thisRef.currentListData.lists)? 'Lists found' : 'Lists still not found - data broken');
				} else {
					thisRef.currentListData = data;
				}
				thisRef.reloadDisplay();
			}
		}, 'json').error(function() {
			alert(listFilename + ' not found');
			thisRef.currentListData = {};
		});
	};

	this.reloadDisplay = function(reloadListing, reloadCanvas){
		if(typeof(reloadListing) == 'undefined' || reloadListing) {
			//remove old elements
			this.listListingEl.children().remove();
			
			//Generate new list elements, hide, add to DOM
			for (var i = 0; i < this.currentListData.lists.length; i++) {
				this.listListingEl.append(this.elFromTemplate(this.listTemplateHTML, i, this.currentListData.lists[i]));
			}
		}
		if(typeof(reloadCanvas) == 'undefined' || reloadCanvas) {
			//Remove old elements
			this.listCanvasEl.children().remove();

			//List any currently expanded lists
			for (var i=0; i<this.currentListData.lists.length; i++) {
				if(this.currentListData.lists[i].showDetail) {
					var newListDetailEl = this.elFromTemplate(this.detailTemplateHTML, i, this.currentListData.lists[i]);
					if(typeof(this.currentListData.lists[i].items) != 'undefined') {
						for(var j=0; j<this.currentListData.lists[i].items.length; j++) {
							var item = this.currentListData.lists[i].items[j];
							var newListItemEl = this.elFromTemplate(this.listItemTemplateHTML, j, item);
							if(typeof(item.ticked) != 'undefined' && item.ticked) {
								newListItemEl.addClass('ticked');
							}
							newListDetailEl.find('.items').append(newListItemEl);
						}
					}
					this.listCanvasEl.append(newListDetailEl);
				}
			}
		}
		this.bindImpermanentDragDropEvents();
	};

	this.elFromTemplate = function(templateHTML, id, item) {
		var listHTML = templateHTML;
		//If the name is just an image URL, just display an image tag
		if(item.name.match(/^http.*\.(jpg|png|gif)/ig)) {
			listHTML = listHTML.replace('[name]', '<a href="#" class="lightbox"><img class="ext-img" src="' + item.name + '"/></a>');
		} else {
			listHTML = listHTML.replace('[name]', item.name);
		}
		listHTML = listHTML.replace('[id]', id);
		return $(listHTML);
	};

	/*
	TODO: CHANGE how updates happen completely. We need to have delta updates.
	When you add a row, we send {add row, row id, row content} and the response is the whole updated JSON.
	When we delete, we just send {delete, row id} and again receive the whole JSON.

	This reduces the risk of the client corrupting the JSON and everything breaking!!
	*/

	this.saveListData = function() {
		//Save data file using Ajax.
		//TODO: Do not trigger 2 saves within 10s. Think of the CC web connection.

		var dataStringified = JSON.stringify(this.currentListData);

		$.post('io.php', {
			'a':'save',
			'file':this.currentListFilename,
			'data':dataStringified,
			'logon_username': this.logon_credentials.username,
			'logon_expiry': this.logon_credentials.expiry,
			'logon_token': this.logon_credentials.token
		}, function(data){
			if(data.status == 'ERROR') {
				alert(data.message);
				window.location = window.location + ''; //Reload page to force another login!
			} else if(data.status == 'CONFLICT') {
				alert('Conflict! Somebody updated the file before the change you just made. Loading their copy.');
				window.listManager.loadListData(window.listManager.currentListFilename);
			} else {
				window.listManager.currentListData['lastModified'] = data.lastModified;
				console.log('Saved');
			}
		}, 'json').error(function(){
			console.log('Save failed under mysterious circumstances');
		});
	};

	this.checkFileForUpdates = function() {
		$.post('io.php', {
			'a':'last-modified',
			'file':this.currentListFilename,
			'logon_username': this.logon_credentials.username,
			'logon_expiry': this.logon_credentials.expiry,
			'logon_token': this.logon_credentials.token
		}, function(data){
			if(typeof(data.status) != 'undefined' && data.status == 'ERROR') {
				alert(data.message);
			} else {
				if(data.lastModified > window.listManager.currentListData.lastModified) {
					//alert('File has changed! Showing updated file.');
					//Display warning in a console log in bottom right that an updated has occurred?
					window.listManager.loadListData(window.listManager.currentListFilename);
				}
			}
		}, 'json').error(function(){
			console.log('File update check failed under mysterious circumstances.');
		});
	};

	this.setLogonCredentials = function(logon_cred){
		this.logon_credentials = logon_cred;
	};

	this.updateStatusText = function(){
		var status_text = '';
		var d = new Date();
		if(typeof(this.logon_credentials) == 'undefined' || typeof(this.logon_credentials.username) == 'undefined') {
			status_text += 'Not logged in.<br />';
		} else {
			status_text += 'Logged in as "'+this.logon_credentials.username+'"<br />';

			//You will be logged in for X more minutes
			var time_secs_since_epoch = d.getTime() / 1000;
			if(this.logon_credentials.expiry < time_secs_since_epoch) {
				status_text += 'Your session has expired.<br />';
			} else {
				status_text += 'You will be logged out in '+Math.round((this.logon_credentials.expiry - time_secs_since_epoch)/60)+' minutes<br />';
				
				//Logged in? Do regular file updated checks
				this.checkFileForUpdates();
			}
		}
		
		status_text += 'Updated: '+d.getHours() + ':'+d.getMinutes()+':'+d.getSeconds();
		$('#status-text').html(status_text);

		window.setTimeout('window.listManager.updateStatusText()', 10000);
	};
}

//DOM ready
$(function(){
	//Ask for username and password before anything. These need to be sent & validated upon every request.
	var $login_form = $($('#login-form-template').html());
	$login_form.lightbox_me();
	$(document).on('click', '#login-form a', function(){
		//Set part of key kept here
		var logon_username = $('#login-form #username').val();

		//Send of details to server
		$.post('authenticate.php', {
				username : logon_username,
				password : $('#login-form #password').val()
			}, function(data){
			//Success
			var response = false;
			var json_parsed = false;
			try {
				response = JSON.parse(data);
				json_parsed = true;
			} catch(err) {
			}
			if(json_parsed) {
				if(response.status == 'OK') {
					var logon_expiry = response.expiry;
					var logon_token = response.token;
					window.listManager.setLogonCredentials({
						username: logon_username,
						expiry: logon_expiry,
						token: logon_token
					});
					window.listManager.loadListData('listfile1');
					$login_form.trigger('close');
				} else {
					alert(response.message);
				}
			} else {
				alert('Response from server was not valid: ' + data);
			}
		}).error(function(){
			//Fail
			alert('Error communicating with secure logon service. Please try again.');
		});
		return false;
	});

	//Lightbox
	$(document).on('click', 'a.lightbox', function() {
		//Create object to lightbox
		var $lbImg = $('<img>').attr('src', $(this).children('img').attr('src')).addClass('close');
		var $lbCont = $('<div>').addClass('lbPopup');
		$lbCont.append($lbImg).lightbox_me();
		return false;
	});

	//Create big JS manager
	window.listManager = new listEngine('#list-listing content', '#list-canvas content');

	//Start showing status updates
	window.listManager.updateStatusText();

	//AJAX file uploader
    if (window.FormData && window.FileReader) {
        $(document).on('change', '#file-upload-form #file-upload', function(event){
        	$('#item-new').css('opacity', 0.3); //Notify user upload is occurring
        	var formdata = new FormData();
			var reader = new FileReader();
			var file = event.target.files[0];
			reader.readAsDataURL(file);
			formdata.append("files[]", file);
			$.ajax({
				url: 'upload.php',
				type: 'POST',
				data: formdata,
				processData: false,
				contentType: false,
				success: function (res) {
					$('#newitemtext').html(res);
				},
				complete: function() {
					$('#item-new').css('opacity', 1); //Notify user upload complete
				}
			});
        });
    } else {
    	$('#file-upload-form').html('Browser does not support AJAX file uploads');
    }
});


