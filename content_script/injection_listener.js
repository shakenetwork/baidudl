// retrieve high speed link
window.addEventListener('hlink1', function(req){
	var fs_id = req.detail.fs_id;
	share(fs_id, function(res){
		var shareid = res.shareid;
		$.ajax({
			url: res.shorturl,
			success: function(d){
				var code = d.match(/yunData\.setData\(.*\)/);
				var data = code[0].substring(16, code[0].length-1);
				var new_yunData = JSON.parse(data);
				get_hlink(new_yunData, undefined, undefined, req.detail.index, 1, function(link){
					console.log("Link received");
					var event = new CustomEvent("hlink2", {detail: {link: link, index: req.detail.index}});
					window.dispatchEvent(event);
				})
				unshare(new_yunData.shareid, function(){});
			}
		})
	})
})

window.addEventListener('run', function(req){
	injection(req.detail.page);
})

window.addEventListener('verify', function(req){
	get_hlink(yunData, 1, req.detail.vcode, 0, 2, function(link){
		var event = new CustomEvent("hlink2", {detail: {link: link, index: req.detail.index}});
		window.dispatchEvent(event);
	});
})
