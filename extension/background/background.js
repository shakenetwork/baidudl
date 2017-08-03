// get configuration
var config = {};
chrome.storage.local.get('config', function(result){
	if('config' in result){
		config = result.config;
	}else{
		config.max_threads = 164;
		config.rpc_token = null;
	}
})

// initialization
var $http = angular.injector(["ng"]).get("$http");
var database = {status: 'loading', links: [], vcodes: []}

// main logic
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
	var url = new URL(tab.url);
	if(url.host == 'pan.baidu.com' && url.pathname == '/disk/home' && changeInfo.status == 'loading'){
		chrome.pageAction.show(tabId);
		if(url.hash.substr(0, 5) == '#list'){
			home_page_exec();
		}
		else if(url.hash.substr(0, 7) == '#search' && url.hash.indexOf('vmode') > 0){
			search_page_exec();
		}
		else chrome.pageAction.hide(tabId);
	}
	else if(tab.url.match(/https?:\/\/pan\.baidu\.com\/(s\/|share\/link)/) && changeInfo.status == 'loading'){
		chrome.pageAction.show(tabId);
		share_page_exec();
	}
})
