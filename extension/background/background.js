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
var database = {};
database.status = 'loading';
database.message = 'loading...';
database.page = 1;
database.links = [];
database.vcodes = [];
var cache = {}

// main logic
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
	var url = new URL(tab.url);
	if(url.host == 'pan.baidu.com' && url.pathname == '/disk/home' && changeInfo.status == 'loading'){
		chrome.pageAction.show(tabId);
		if(url.hash.substr(0, 5) == '#list' && url.hash.indexOf('vmode') > 0){
			home_page_auto(url);
		}
		else if(url.hash.substr(0, 7) == '#search' && url.hash.indexOf('vmode') > 0){
		}
		else chrome.pageAction.hide(tabId);
	}
	else if(tab.url.match(/https?:\/\/pan\.baidu\.com\/(s\/|share\/link)/) && changeInfo.status == 'loading'){
		chrome.pageAction.show(tabId);
		share_page_auto(url, 0, function(){});
	}
})


// home page auto
function home_page_auto(url){
	console.log('home_page_auto');
	get_user_yunData(function(yunData){
		list_dir(yunData, url, 1, 1, function(list){
			var fidlist = list.map(function(e){return e.fs_id});
			share(yunData, fidlist, function(res){
				url = new URL(res.shorturl);
				share_page_auto(url, 1, function(){
					unshare(yunData, res.shareid, function(){})
				});
			})
		})
	})
}

// share page auto
function share_page_auto(url, flag, cb){
	console.log('share_page_auto');
	get_share_yunData(url, function(yunData){
		var file_list = yunData.file_list.list;
		if(!flag && (file_list.length > 1 || file_list[0].isdir) && url.hash.substr(0, 5) != '#list')return;
		if(url.hash.indexOf('list') < 0 || getURLParameter(url, 'path') == '%2F'){
			share_page_get_glink(yunData, file_list, cb);
		}
		else{
			list_dir(yunData, url, 2, 1, function(list){
				share_page_get_glink(yunData, list, cb);
			})
		}
	})
}

function share_page_get_glink(yunData, list, cb){
	var fidlist_ndir = [];
	var fidlist_dir = [];
	list.forEach(function(e){
		if(!e.isdir)fidlist_ndir.push(e.fs_id);
		fidlist_dir.push(e.fs_id);
	})
	get_glink(yunData, false, null, fidlist_ndir, function(links){
		var d = {}
		links.forEach(function(e){
			d[e.fs_id] = e.glink;
		});
		console.log(d);
		database.links = list.map(function(e){
			var path = e.path.split('/')
			if(e.isdir){
				return {glink: '', fs_id: e.fs_id, isdir: e.isdir, hlink: 'NA', path: path[path.length-1]}
			}
			else{
				return {glink: d[e.fs_id], fs_id: e.fs_id, isdir: e.isdir, hlink: '', path: path[path.length-1]}
			}
		});
		database.status = 'complete';
		database.message = 'Done';
		cb(links);
	});
}

// search page exec
function search_page_exec(url){
	console.log('search_page_exec');
	get_user_yunData(function(yunData){
		list_search(yunData, url, function(list){
			var fidlist = list.map(function(e){return e.fs_id});
			console.log(fidlist);
		})
	})
}
