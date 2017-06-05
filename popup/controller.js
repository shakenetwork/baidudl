// initialize angular model
var app = angular.module('app', []);
app.controller('control', ['$scope', function($scope){
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
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			chrome.tabs.sendMessage(tabs[0].id, {fs_id: fs_id, index: i});
		});
	}
	$scope.generateAll = function(){
		for(var i=0; i<$scope.links.length; i++)$scope.generate(i);
	}
	
	// pages
	$scope.prev = function(){
		if($scope.page == 1){
			$scope.message = "Already the first page";
			return
		}
		$scope.page -= 1;
		$scope.run();
	}
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
	$scope.verify = function(vcode_str, vcode_input, index){
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			chrome.tabs.sendMessage(tabs[0].id, {vcode: {vcode_str: vcode_str, vcode_input: vcode_input}, index: index});
			$scope.$apply(function(){
				var i = $scope.vcodes.indexOf({vcode_str: vcode_str, index: index});
				$scope.vcodes.splice(i, 1);
			});
		});
	}
}])

// add listener to handle received message
chrome.runtime.onMessage.addListener(function(req, sender, sendResponse){
	var $scope = angular.element(document.getElementById('app')).scope();
	if(req.type == "passLinks"){
		$scope.$apply(function(){
			if(req.result.feedback != 'Success'){
				$scope.message = 'It\'s empty!';
			}else{
				$scope.links = req.result.links;
				$scope.status = true;
			}
		});
		sendResponse('Success');
	}
	if(req.type == "passNewLink"){
		var hlink = req.result.link;
		var index = req.result.index;
		$scope.$apply(function(){
			$scope.links[index].hlink = hlink;
			$scope.message = "Ready."
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
					chrome.tabs.executeScript({file: "content_script/sandbox.js"});
				}else{
					chrome.tabs.sendMessage(tabs[0].id, {page: $scope.page}, function(res){
						console.log(res);
					})
				}
			})
		}
	}catch(err){
		console.log(err);
	}
});
