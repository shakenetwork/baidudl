// retrieve high speed link
window.addEventListener('receiveFs', function(req){
	var fs_id = req.detail.fs_id;
	$.ajax({
		type: "POST",
		url: "/share/set?web=1&channel=chunlei&web=1&bdstoken="+yunData.MYBDSTOKEN+"&clienttype=0",
		data: "fid_list=%5B"+fs_id+"%5D&schannel=0&channel_list=%5B%5D&period=0",
		dataType: "json",
		success: function(d){
			if(d.errno != 0){
				console.log(d);
				var err_msg = "Error: cant't share this file";
				if(d.errno == 110)err_msg = "Error: this file has been shared too frequently"
				var event = new CustomEvent("error", {detail: err_msg});
				window.dispatchEvent(event);
				return
			}
			console.log("Share success");
			var shareid = d.shareid;
			$.ajax({
				url: d.shorturl,
				success: function(d){
					var code = d.match(/yunData\.setData\(.*\)/);
					var data = code[0].substring(16, code[0].length-1);
					var new_yunData = JSON.parse(data);
					get_hlink(new_yunData, undefined, undefined, req.detail.index, 1, function(link){
						console.log("Link received");
						var event = new CustomEvent("passNewLink", {detail: {link: link, index: req.detail.index}});
						window.dispatchEvent(event);
					})
					unshare(new_yunData.shareid);
				}
			})
		}
	});
})

window.addEventListener('run', function(req){
	injection(req.detail.page);
})

window.addEventListener('verify', function(req){
	get_hlink(yunData, 1, req.detail.vcode, 0, 2, function(link){
		var event = new CustomEvent("passNewLink", {detail: {link: link, index: req.detail.index}});
		window.dispatchEvent(event);
	});
})
