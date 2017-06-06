// variant base64 encoding function, copy from pan.baidu.com
function b64(t) {
	var e, r, a, n, o, i, s = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
	for (a = t.length,
	r = 0,
	e = ""; a > r; ) {
		if (n = 255 & t.charCodeAt(r++),
		r == a) {
			e += s.charAt(n >> 2),
			e += s.charAt((3 & n) << 4),
			e += "==";
		break
		}
		if (o = t.charCodeAt(r++),
		r == a) {
			e += s.charAt(n >> 2),
			e += s.charAt((3 & n) << 4 | (240 & o) >> 4),
			e += s.charAt((15 & o) << 2),
			e += "=";
			break
		}
		i = t.charCodeAt(r++),
		e += s.charAt(n >> 2),
		e += s.charAt((3 & n) << 4 | (240 & o) >> 4),
		e += s.charAt((15 & o) << 2 | (192 & i) >> 6),
		e += s.charAt(63 & i)
	}
	return e
};

// basic function to get hlink
function get_hlink(yunData, extra, vcode, index, type, dir, fidlist, cb){
	if(type == 1){
		var url = "/api/sharedownload?sign="+yunData.sign+"&timestamp="+yunData.timestamp;
		var data = "encrypt=0&product=share&uk="+yunData.uk+"&primaryid="+yunData.shareid;
	}
	else if(type == 2){
		var url = "/api/sharedownload?sign="+yunData.SIGN+"&timestamp="+yunData.TIMESTAMP;
		var data = "encrypt=0&product=share&uk="+yunData.SHARE_UK+"&primaryid="+yunData.SHARE_ID;
	}
	else if(type == 3){
		// get sign parameter
		var u = new Function("return " + yunData.sign2)()
		var sign = b64(u(yunData.sign5, yunData.sign1));
		sign = encodeURIComponent(sign);
		var url = "/api/download?sign="+sign+"&timestamp="+yunData.timestamp+"&fidlist="+JSON.stringify(fidlist)+"&bdstoken="+yunData.MYBDSTOKEN+"&type=batch";
		var data = "encrypt=0&product=share&type=batch"
	}
	else return;
	if(vcode)data += "&vcode_str="+vcode.vcode_str+"&vcode_input="+vcode.vcode_input;
	if(extra)data += "&extra="+encodeURIComponent(get_extra());
	if(dir)data += "&type=batch";
	data += "&fid_list="+JSON.stringify(fidlist)
	$.ajax({
		type: "POST",
		url: url,
		data: data,
		dataType: "json",
		success: function(res){
			if(res.errno != 0){
				console.log(res);
				var err_msg = "Warning: can't get high speed link";
				if(res.errno == -20){
					get_vcode(function(result){
						if(result.feedback != 'Success'){
							var event = new CustomEvent("error", {detail: err_msg});
							window.dispatchEvent(event);
							return;
						}
						var event = new CustomEvent("vcode", {detail: {vcode: result.vcode, index: index}});
						window.dispatchEvent(event);
						return;
					})
				}
				var event = new CustomEvent("error", {detail: err_msg});
				window.dispatchEvent(event);
				return;
			}
			if(dir)cb(res.dlink, index);
			else cb(res.list[0].dlink, index);
		}
	});
}

function get_dlink(sign, fidlist, cb){
	$.ajax({
		type: "POST",
		url: "/api/download?sign="+sign+"&timestamp="+yunData.timestamp+"&fidlist="+JSON.stringify(fidlist)+"&bdstoken="+yunData.MYBDSTOKEN,
		success: function(d){
			var err_msg = "Error: can't get dlinks";
			if(d.errno != 0){
				var event = new CustomEvent("error", {detail: err_msg});
				window.dispatchEvent(event);
				return;
			}
			cb(d.dlink);
		}
	})
}

// get path parameter from url
function getURLParameter(name) {
	var x = location.hash.split('/');
	var y = x[x.length-1].split('&')
	for(var i=0; i<y.length; i++){
		var e = y[i];
		e = e.split('=');
		if(e[0]==name)return e[1];
	}
	return null;
}

function share(fs_id, cb){
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
			cb(d);
		}
	})
}

// unshare a file
function unshare(shareid, cb){
	$.ajax({
		type: "POST",
		url: "/share/cancel?bdstoken="+yunData.MYBDSTOKEN+"&channel=chunlei&web=1&clienttype=0",
		data: "shareid_list=%5B"+shareid+"%5D",
		dataType: "json",
		success: function(d){
			if(d.errno != 0){
				console.log(d);
				var err_msg = "Warning: can't auto unshare the file";
				var event = new CustomEvent("error", {detail: err_msg});
				window.dispatchEvent(event);
				return
			}
			console.log("Unshare success");
			cb();
		}
	})
}

// get vcode
function get_vcode(cb){
	$.ajax({
		type: "GET",
		url: "/api/getvcode?prod=pan",
		success: function(res){
			if(res.errno != 0){
				var err_msg = "Warning: can't get vcode"
				var event = new CustomEvent("error", {detail: err_msg})
				window.dispatchEvent(event);
				cb({feedback: 'Failure'})
			}
			cb({feedback: 'Success', vcode: res.vcode})
		}
	})
}

// get extra parameter for verification
function get_extra(){
	var dict = {};
	var cookies = document.cookie.split(';');
	cookies.forEach(function(d){
		var x = d.split('=');
		dict[x[0]] = x[1];
	})
	var extra = JSON.stringify({sekey:decodeURIComponent(dict[" BDCLND"])});
	return extra;
}

// list directory
function list_dir(type, page, cb){
	console.log('Retrieving links');
	if(type == 1)var url = "/api/list?";
	else if(type == 2)var url = "/share/list?uk="+yunData.SHARE_UK+"&shareid="+yunData.SHARE_ID+"&";
	else return;

	url += "dir="+getURLParameter('path')+"&bdstoken="+yunData.MYBDSTOKEN+"&num=100&order=time&desc=1&clienttype=0&showempty=0&web=1&page="+page;
	$.ajax({
		url: url,
		success: function(res){
			console.log("links retrieved");
			if(res.errno != 0 ){
				var event = new CustomEvent("error", {detail: "Error: can't list folder"});
				window.dispatchEvent(event);
				return;
			}
			if(res.list.length == 0){
				var event = new CustomEvent("error", {detail: "It's empty!"});
				window.dispatchEvent(event);
				return;
			}
			cb(res.list);
		}
	})
}

