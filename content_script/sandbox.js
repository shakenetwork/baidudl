// inject function, inject core.js to pan.baidu.com
console.log('Injecting code');
$.getScript(chrome.extension.getURL('/content_script/injection.js'));
$.getScript(chrome.extension.getURL('/content_script/injection_listener.js'));

// receive download links from web and send them to popup
window.addEventListener('passLinks', function(req){
	chrome.runtime.sendMessage({result: req.detail, type: "passLinks"})
})

window.addEventListener('error', function(req){
	chrome.runtime.sendMessage({result: req.detail, type: "error"})
})

// proxy for retrieving high speed link
chrome.runtime.onMessage.addListener(function(req, sender, sendResponse){
	if(req.fs_id){
		var event = new CustomEvent("receiveFs", {detail: req});
		window.dispatchEvent(event);
		window.addEventListener('passNewLink', function(req){
			sendResponse(req.detail);
		})
		return true;
	}
	if(req.greeting){
		sendResponse({greeting: 'yes'});
	}
	if(req.page){
		var event = new CustomEvent('run', {detail: req});
		window.dispatchEvent(event);
		sendResponse('run');
	}
})
