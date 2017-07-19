var app = angular.module('app', []);
app.controller('control', ['$scope', function($scope){
	// initialize angular model
	$scope.message = 'pan.baidu.com only';
	$scope.status = false;
	$scope.page = 1;
	$scope.vcodes = [];
	$scope.vcode_input = "";

	// function to generate high speed links
	$scope.generate = function(i){
		console.log(i);
		$scope.message = "Running...";
		var x = $scope.links[i];
		var fs_id = x.fs_id;
		var isdir = x.isdir;
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			chrome.tabs.sendMessage(tabs[0].id, {fs_id: fs_id, index: i, isdir: isdir});
		});
	}
	// generate hlinks for all files
	$scope.generateAll = function(){
		for(var i=0; i<$scope.links.length; i++){
			if(!$scope.links[i].hlink)$scope.generate(i);
		}
	}
	
	// previous page
	$scope.prev = function(){
		if($scope.page == 1){
			$scope.message = "Already the first page";
			return
		}
		$scope.page -= 1;
		$scope.run();
	}
	// next page
	$scope.next = function(){
		if($scope.links.length < 100){
			$scope.message = "Already the last page";
			return
		}
		$scope.page += 1;
		$scope.run();
	}

	// run
	$scope.run = function(){
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			var url = tabs[0].url;
			chrome.tabs.sendMessage(tabs[0].id, {page: $scope.page}, function(res){
				$scope.$apply(function(){$scope.message = "Ready."});
			})
		})
	}

	// create a hidden input for copy
	var body = angular.element(document.body);
	var textarea = angular.element('<textarea/>');
	textarea.css({
		position: 'fixed',
		opacity: '0'
	});
	body.append(textarea);
	
	// copy links to clipboard
	$scope.copy = function(i, type){
		if(type=='hlink')textarea.val($scope.links[i].hlink)
		else textarea.val($scope.links[i].dlink)
		if(!textarea.val()){
			$scope.message = "This field is empty"
			return
		}
		textarea[0].select()
		if(document.execCommand("copy"))$scope.message = "Copy success";
		else $scope.message = "Copy failure"
	}
	$scope.copyAll = function(type){
		var text = "";
		for(var i=0; i<$scope.links.length; i++){
			if(type == 'dlink'){
				if(!$scope.links[i].dlink)continue
				text += $scope.links[i].dlink+'\n';
			}
			else{
				if(!$scope.links[i].hlink)continue
				text += $scope.links[i].hlink+'\n';
			}
		}
		textarea.val(text);
		if(!textarea.val()){
			$scope.message = "No links";
			return;
		}
		textarea[0].select()
		if(document.execCommand("copy"))$scope.message = "Copy all success";
		else $scope.message = "Copy failure"
	}

	// do vcode verification
	$scope.verify = function(vcode_str, vcode_input, index){
		var x = $scope.links[index];
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			chrome.tabs.sendMessage(tabs[0].id, {vcode: {vcode_str: vcode_str, vcode_input: vcode_input}, index: index, fs_id: x.fs_id, isdir: x.isdir});
			$scope.$apply(function(){
				var vcodes = $scope.vcodes.filter(function(e){
					return e.vcode_str != vcode_str;
				})
				$scope.vcodes = vcodes;
			});
		});
	}

	$scope.clear = function(){
		chrome.storage.local.remove('data');
		$scope.message = "Cache is cleared";
	}
}])

// add listener to handle received message
chrome.runtime.onMessage.addListener(function(req, sender, sendResponse){
	var $scope = angular.element(document.getElementById('app')).scope();
	if(req.type == "dlink"){
		$scope.$apply(function(){
			$scope.links = req.result;
			$scope.status = true;
		});
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
			chrome.storage.local.set({'data': {url: tabs[0].url, timestamp: Number(new Date()), links: $scope.links, page: $scope.page}})
		})
		sendResponse('Success');
	}
	if(req.type == "hlink2"){
		var hlink = req.result.link;
		var index = req.result.index;
		$scope.$apply(function(){
			$scope.links[index].hlink = hlink;
			$scope.message = "Ready."
		})
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
			chrome.storage.local.set({'data': {url: tabs[0].url, timestamp: Number(new Date()), links: $scope.links, page: $scope.page}})
		})
	}
	if(req.type == "error"){
		$scope.$apply(function(){
			$scope.message = req.result;
		})
	}

	if(req.type == "vcode"){
		$scope.$apply(function(){
			$scope.vcodes.push({vcode_str: req.result.vcode, index: req.result.index})
			$scope.message = "vcode required...";
		})
	}
})

// execute content script
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
	var url = tabs[0].url;
	try{
		var domain = url.match(/^[\w-]+:\/{2,}\[?([\w\.:-]+)\]?(?::[0-9]*)?/)[1];
		console.log(domain);
		if(domain == 'pan.baidu.com'){
			var $scope = angular.element(document.getElementById('app')).scope();
			$scope.$apply(function(){$scope.message = "Ready."});
			chrome.tabs.sendMessage(tabs[0].id, {greeting: "yes"}, function(response) {
				if(!response){
					chrome.tabs.executeScript({file: "content_script/sandbox.js"}, function(){
						check_storage(tabs, url, 1);
					})
				}else{
					check_storage(tabs, url, $scope.page);
				}
			})
		}
	}catch(err){
		console.log(err);
	}
});

function check_storage(tabs, url, page){
	chrome.storage.local.get('data', function(result){
		var flag = 0;
		var data;
		if('data' in result){
			data = result.data;
		}
		else{
			flag = 1;
			data = {}
		}
		if(!data)flag=1;
		if('url' in data && url != data.url)flag = 1;
		if('timestamp' in data && Number(new Date()) - data.timestamp > 5*60*1000)flag = 1;
		if('page' in data && page != data.page)flag = 1;
		if(flag == 1)chrome.tabs.sendMessage(tabs[0].id, {page: page});
		else{
			var $scope = angular.element(document.getElementById('app')).scope();
			setTimeout(function(){
				$scope.$apply(function(){
					$scope.status = true;
					$scope.links = data.links;
				})
			}, 300)
		}
	});
}
