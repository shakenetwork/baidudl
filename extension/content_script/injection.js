function injection(page){
	var url = window.location.href;
	console.log('Code exeucuted');

	// logic for homepage
	if(url.match(/https?:\/\/pan\.baidu\.com\/disk\/home#list/)){
		console.log("Home page");
		
		// get sign parameter
		u = new Function("return " + yunData.sign2)()
		sign = b64(u(yunData.sign5, yunData.sign1));
		sign = encodeURIComponent(sign);
		
		// list directory
		list_dir(1, page, function(list){
			get_home_links(list);
		})
	}
	// logic for share pages
	else if(url.match(/https?:\/\/pan\.baidu\.com\/(s\/|share\/link)/)){
		console.log('Share page');
		var length = yunData.FILEINFO.length;

		// logic for non-directory share files
		if(!getURLParameter('path') || (length == 1 && !yunData.FILEINFO[0].isdir)){

			// dispatch general information
			var result = [{path: yunData.FILENAME, hlink: "", fs_id: yunData.FS_ID, dlink: "NA", isdir: 0}];
			var event = new CustomEvent("dlink", {detail: result});
			window.dispatchEvent(event);

			// get hlink and dispatch it
			get_hlink(yunData, 1, undefined, [0], 2, 0, [yunData.FS_ID], function(links, indices){
				var event = new CustomEvent("hlink2", {detail: {links: links, indices: indices}});
				window.dispatchEvent(event);
			});
			return;
		}
		// logic for directory share files
		else if(getURLParameter('path') == '%2F'){
			var list = yunData.FILEINFO;
			get_share_links(list);
		}
		else{
			// list directory
			list_dir(2, 1, function(list){
				get_share_links(list);
			})
		}
	}
	// logic for search result
	else if (url.match(/https?:\/\/pan.baidu.com\/disk\/home#search/)){
		console.log('Search page');

		list_search(function(list){
			get_home_links(list);
		});
	}
	// deal with strange pages in pan.baidu.com
	else if (url.match(/https?:\/\/pan.baidu.com\/disk\/home/)){
		$(location).attr('href','https://pan.baidu.com/disk/home');
	}
	// other pages
	else{
		var err_msg = "home page or share page only";
		var event = new CustomEvent("error", {detail: err_msg});
		window.dispatchEvent(event);
	}
}
