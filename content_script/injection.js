function injection(page){
	var url = window.location.href

	if(url.match(/https?:\/\/pan\.baidu\.com\/disk\/home/)){

		console.log("Code Injected");
		
		// get sign parameter
		u = new Function("return " + yunData.sign2)()
		sign = b64(u(yunData.sign5, yunData.sign1));
		sign = encodeURIComponent(sign);
		
		// retrieve download links
		list_dir(page, function(res){
			var dict = {};
			res.list.forEach(function(e){
				var len = e.path.split('/').length;
				dict[e.fs_id] = e.path.split('/')[len-1];
			}) 
			var fidlist = res.list.map(function(d){return d.fs_id});
			$.ajax({
				type: "POST",
				url: "/api/download?sign="+sign+"&timestamp="+yunData.timestamp+"&fidlist="+JSON.stringify(fidlist)+"&bdstoken="+yunData.MYBDSTOKEN,
				success: function(d){
					if(d.errno != 0)result = {feedback: 'Failure'}
					else{
						d.dlink.forEach(function(e){
							e.path = dict[e.fs_id];
							e.hlink = "";
						})
						result = {feedback: 'Success', links: d.dlink} 
					}
					var event = new CustomEvent("dlink", {detail: result});
					window.dispatchEvent(event); 
				}
			})
		})
	}
	else if(url.match(/https?:\/\/pan\.baidu\.com\/(s\/|share\/link)/)){
		var result = {feedback: 'Success', links: [{path: yunData.FILENAME, hlink: "", fs_id: yunData.FS_ID, dlink: "NA"}]};
		var event = new CustomEvent("dlink", {detail: result});
		window.dispatchEvent(event);
		get_hlink(yunData, 1, undefined, 0, 2, function(link){
			result.links[0].hlink = link;
			var event = new CustomEvent("hlink2", {detail: {link: link, index: 0}});
			window.dispatchEvent(event);
		});
	}
	else{
		var err_msg = "home page or share page only";
		var event = new CustomEvent("error", {detail: err_msg});
		window.dispatchEvent(event);
	}
}

$(document).ready(function(){
	injection(1);
})
