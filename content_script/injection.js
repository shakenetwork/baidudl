function injection(page){
	var url = window.location.href

	if(url.match(/https?:\/\/pan\.baidu\.com\/disk\/home/)){

		console.log("Code Injected");
		
		// get sign parameter
		u = new Function("return " + yunData.sign2)()
		sign = b64(u(yunData.sign5, yunData.sign1));
		sign = encodeURIComponent(sign);
		
		// retrieve download links
		list_dir(1, page, function(list){
			var dict = {};
			list.forEach(function(e){
				var len = e.path.split('/').length;
				dict[e.fs_id] = e.path.split('/')[len-1];
			}) 
			var fidlist = list.map(function(d){return d.fs_id});
			get_dlink(sign, fidlist, function(links){
				result = [];
				for(var i=0; i<links.length; i++){
					result.push({dlink: links[i].dlink, hlink: "", fs_id: links[i].fs_id, path: dict[links[i].fs_id], isdir: 0});
					var index = fidlist.indexOf(links[i].fs_id);
					fidlist.splice(index, 1);
				}
				for(var i=0; i<fidlist.length; i++){
					result.push({dlink: "NA", hlink: "", fs_id: fidlist[i], path: dict[fidlist[i]], isdir: 1});
					get_hlink(yunData, 0, undefined, i+links.length, 3, 1, [fidlist[i]], function(link, index){
						var event =  new CustomEvent("hlink2", {detail: {link: link, index: index}});
						window.dispatchEvent(event);
					});
				}
				var event =  new CustomEvent("dlink", {detail: result});
				window.dispatchEvent(event);
			});
		})
	}
	else if(url.match(/https?:\/\/pan\.baidu\.com\/(s\/|share\/link)/)){
		var dir = yunData.FILEINFO[0].isdir;
		if(dir == 0 || getURLParameter('path') == "%2F"){
			var result = [{path: yunData.FILENAME, hlink: "", fs_id: yunData.FS_ID, dlink: "NA"}];
			var event = new CustomEvent("dlink", {detail: result});
			window.dispatchEvent(event);
			get_hlink(yunData, 1, undefined, 0, 2, dir, [yunData.FS_ID], function(link, index){
				var event = new CustomEvent("hlink2", {detail: {link: link, index: index}});
				window.dispatchEvent(event);
			});
			return;
		}
		else{
			list_dir(2, 1, function(list){
				links = list.map(function(e){return {fs_id: e.fs_id, dlink: "NA", hlink: "", path: e.path}});
				var event = new CustomEvent("dlink", {detail: links});
				window.dispatchEvent(event);
				console.log(list);
				for(var i=0; i<links.length; i++){
					get_hlink(yunData, 1, undefined, i, 2, 0, [links[i].fs_id], function(link, index){
						var event = new CustomEvent("hlink2", {detail: {link: link, index: index}});
						window.dispatchEvent(event);
					})
				}
			})
		}
	}
	else{
		var err_msg = "home page or share page only";
		var event = new CustomEvent("error", {detail: err_msg});
		window.dispatchEvent(event);
	}
}
