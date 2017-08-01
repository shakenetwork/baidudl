function injection(page){
	var url = window.location.href;
	console.log('Code exeucuted');

	// logic for homepage
	if(url.match(/https?:\/\/pan\.baidu\.com\/disk\/home#list/)){
		console.log("Code Injected");
		
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
		var length = yunData.FILEINFO.length;

		// logic for non-directory share files
		if(length == 0 || !getURLParameter('path')){

			// dispatch general information
			var result = [{path: yunData.FILENAME, hlink: "", fs_id: yunData.FS_ID, dlink: "NA", isdir: dir}];
			var event = new CustomEvent("dlink", {detail: result});
			window.dispatchEvent(event);

			// get hlink and dispatch it
			get_hlink(yunData, 1, undefined, 0, 2, dir, [yunData.FS_ID], function(link, index){
				var event = new CustomEvent("hlink2", {detail: {link: link, index: index}});
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
		console.log('search mode');
		// get keyword
		var key = getURLParameter('key');

		// get sign parameter
		u = new Function("return " + yunData.sign2)()
		sign = b64(u(yunData.sign5, yunData.sign1));
		sign = encodeURIComponent(sign);

		// list search result
		$.ajax({
			type: 'GET',
			url: 'https://pan.baidu.com/api/search?recursion=1&order=time&desc=1&showempty=0&page=1&num=100&key='+key,
			dataType: 'json',
			success: function(res){

				// in case of failure
				if(res.errno != 0){
					console.log(res);
					var err_msg = "Warning: can't get search result";
					var event = new CustomEvent("error", {detail: err_msg});
					window.dispatchEvent(event);
					return;
				}

				// now we have a list of files
				var fidlist1 = [];
				var fidlist2 = [];
				var result = [];
				var d = {};
				res.list.forEach(function(e){
					var len = e.path.split('/').length;
					d[e.fs_id] = e.path.split('/')[len-1];
					if(!e.isdir)fidlist1.push(e.fs_id);
					else{
						var index = res.list.indexOf(e);
						result.push({dlink: "NA", hlink: "", fs_id: e.fs_id, path: e.path.split('/')[len-1], isdir: 1});
						fidlist2.push(e.fs_id);
						//get_hlink(yunData, 0, undefined, index, 3, 1, [e.fs_id], function(link, index){
						//	var event =  new CustomEvent("hlink2", {detail: {link: link, index: index}});
						//	window.dispatchEvent(event);
						//});
					}
				})
				if(fidlist1.length == 0){
					var event =  new CustomEvent("dlink", {detail: result});
					window.dispatchEvent(event);
				}
				else{
					get_dlink(sign, fidlist1, function(link){
						result = result.concat(link.map(function(e){
							return {dlink: e.dlink, hlink: "", fs_id: e.fs_id, path: d[e.fs_id], isdir: 0};
						}))
						var event =  new CustomEvent("dlink", {detail: result});
						window.dispatchEvent(event);
					});
				}

				generate = function(){
				fidlist2.forEach(function(fs_id){
					var index;
					for(var i=0; i<result.length; i++){
						if(result[i].fs_id == fs_id){
							index = i;
							break;
						}
					}
					get_hlink(yunData, 0, undefined, index, 3, 1, [fs_id], function(link, index){
						var event =  new CustomEvent("hlink2", {detail: {link: link, index: index}});
						window.dispatchEvent(event);
					})
				})
				}
				setTimeout(generate, 1000);
			}
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
