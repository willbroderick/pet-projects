//Declaration of list manager
function listEngine(listListingSelector, listCanvasSelector) {
	this.listTemplateHTML = $('#list-template').html();
	this.detailTemplateHTML = $('#list-detail-template').html();
	this.listItemTemplateHTML = $('#list-item-template').html();
	
	this.listListingEl = $(listListingSelector);
	this.listCanvasEl = $(listCanvasSelector);
	this.currentListFilename = '';
	this.currentListData = {"lists":[]};
	
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
	}

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
	}

	this.initEvents();

	this.loadListData = function(listFilename){
		//Fetch data file using Ajax
		var thisRef = this;
		var jqxhr = $.getJSON('io.php?a=read&file=' + listFilename, function(data) {
			thisRef.currentListFilename = listFilename;
			thisRef.currentListData = data;
			thisRef.reloadDisplay();
		}).error(function() {
			alert(listFilename + ' not found - current list file remains open');
			thisRef.currentListData = {};
		});
	}

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
	}

	this.elFromTemplate = function(templateHTML, id, item) {
		var listHTML = templateHTML;
		//If the name is just an image URL, just display an image tag
		if(item.name.match(/^http.*\.(jpg|png|gif)/ig)) {
			listHTML = listHTML.replace('[name]', '<img class="ext-img" src="' + item.name + '"/>');
		} else {
			listHTML = listHTML.replace('[name]', item.name);
		}
		listHTML = listHTML.replace('[id]', id);
		return $(listHTML);
	}

	this.saveListData = function() {
		//Save data file using Ajax. Do not trigger 2 saves within 10s. Think of the CC web connection.

		var now = new Date();
		var ticks = now.getTime();
		this.currentListData.lastModified = ticks;

		var dataStringified = JSON.stringify(this.currentListData);

		$.post('io.php', {'a':'save', 'file':this.currentListFilename, 'data':dataStringified}, function(data){
			console.log('Saved');
		}).error(function(){
			console.log('Save failed under mysterious circumstances');
		});
	}
}



//DOM ready
$(function(){
	window.listManager = new listEngine('#list-listing content', '#list-canvas content');
	window.listManager.loadListData('listfile1');

});


