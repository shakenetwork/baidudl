// retrieve high speed link
window.addEventListener('hlink1', function(req){
	var fs_id = req.detail.fs_id;
	var isdir = req.detail.isdir;
	share(fs_id, function(res){
		var shareid = res.shareid;
		$.ajax({
			url: res.shorturl,
			success: function(d){
				var code = d.match(/yunData\.setData\(.*\)/);
				var data = code[0].substring(16, code[0].length-1);
				var new_yunData = JSON.parse(data);
				get_hlink(new_yunData, undefined, undefined, req.detail.index, 1, isdir, [new_yunData.file_list.list[0].fs_id], function(link, index){
					console.log("Link received");
					var event = new CustomEvent("hlink2", {detail: {link: link, index: index}});
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
	var dir = yunData.FILEINFO[0].isdir;
	get_hlink(yunData, 1, req.detail.vcode, req.detail.index, 2, dir, [yunData.FS_ID], function(link, index){
		var event = new CustomEvent("hlink2", {detail: {link: link, index: index}});
		window.dispatchEvent(event);
	});
})
