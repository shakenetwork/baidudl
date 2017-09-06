// variant base64 encoding function, copy from pan.baidu.com
// I don't understand it. But we don't have to.
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
function get_hlink(yunData, extra, vcode, indices, type, dir, fidlist, cb){
	/*
	 * 	Parameters:
	 * 		yunData:	which yunData to use
	 * 		extra:		whether extra encryption needed
	 * 		vcode:		verification code information
	 * 		indices:	what the indices of these files in popup are
	 * 		type:		which type of information to use
	 * 		dir:		whether this file is a directory
	 * 		fidlist:	whose hlink you want to get
	 * */

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
	else if(type == 4){
		var url = "/api/sharedownload?sign="+yunData.SIGN+"&timestamp="+yunData.TIMESTAMP;
		var data = "encrypt=0&product=share&uk="+yunData.SHARE_UK+"&primaryid="+yunData.SHARE_ID+'&type=batch';
	}
	else return;

	// additional information
	if(vcode)data += "&vcode_str="+vcode.vcode_str+"&vcode_input="+vcode.vcode_input;
	if(extra)data += "&extra="+encodeURIComponent(get_extra());
	if(dir)data += "&type=batch";
	data += "&fid_list="+JSON.stringify(fidlist);

	// get hlink
	$.ajax({
		type: "POST",
		url: url,
		data: data,
		dataType: "json",
		success: function(res){

			// in case of failure
			if(res.errno != 0){
				console.log(res);
				var err_msg = "Warning: can't get high speed link";

				// -20 means verification is needed
				if(res.errno == -20){

					// get verification image
					get_vcode(function(result){

						// in case that it fails to get verification image, return an error message
						if(result.feedback != 'Success'){
							var event = new CustomEvent("error", {detail: err_msg});
							window.dispatchEvent(event);
							return;
						}

						// now we have got verification image, send it to popup
						var event = new CustomEvent("vcode", {detail: {vcode: result.vcode, indices: indices}});
						window.dispatchEvent(event);
						return;
					})
				}

				if(res.errno == 118) err_msg = "Error: no download permission"

				// other errors
				var event = new CustomEvent("error", {detail: err_msg});
				window.dispatchEvent(event);
				return;
			}
			// now we have got hlink
			if(dir)cb([res.dlink], [indices]);
			else{
				var d = {};
				res.list.forEach(function(e){
					d[e.fs_id] = e.dlink;
				})
				var links = [];
				for(var i=0; i<fidlist.length; i++){
					links.push(d[fidlist[i]]);
				}
				cb(links, indices);
			}
		}
	});
}

// get dlink by sign and fidlist
function get_dlink(sign, fidlist, cb){
	/*
	 *	Parameters:
	 *		sign: verification parameters
	 *		fidlist: whose dlink you want to get
	  */
	$.ajax({
		type: "POST",
		url: "/api/download?sign="+sign+"&timestamp="+yunData.timestamp+"&fidlist="+JSON.stringify(fidlist)+"&bdstoken="+yunData.MYBDSTOKEN,
		success: function(d){
			var err_msg = "Error: can't get dlinks";
			if(d.errno != 0){
				console.log(d);
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

// share file by fs_id
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
				if(d.errno == -3)err_msg = "Error: this is not your file, you can't share it"
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

// unshare a file by its shareid
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
	/*
	 * Parameters:
	 * 	type: list directory in homepage or list dirctory in shared page
	 * 	page: which page to display
	  */
	console.log('Retrieving links');

	// decide which url to use to list directory
	if(type == 1)var url = "/api/list?";
	else if(type == 2)var url = "/share/list?uk="+yunData.SHARE_UK+"&shareid="+yunData.SHARE_ID+"&";
	else return;

	// append parameters
	url += "dir="+getURLParameter('path')+"&bdstoken="+yunData.MYBDSTOKEN+"&num=100&order=time&desc=1&clienttype=0&showempty=0&web=1&page="+page;

	// start to list directory
	$.ajax({
		url: url,
		success: function(res){
			console.log("links retrieved");

			// if error is encountered
			if(res.errno != 0 ){
				console.log(res);
				var event = new CustomEvent("error", {detail: "Error: can't list folder"});
				window.dispatchEvent(event);
				return;
			}
			// good, we make it
			if(res.list.length == 0){
				var event = new CustomEvent("error", {detail: "It's empty!"});
				window.dispatchEvent(event);
				return;
			}
			cb(res.list);
		}
	})
}

// list search result
function list_search(cb){
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
				err_msg = "Warning: can't get search result";
				event = new CustomEvent("error", {detail: err_msg});
				window.dispatchEvent(event);
				return;
			}
			cb(res.list);
		}
	})
}

// get links by file list in home page
function get_home_links(list){
	var dict = {};
	list.forEach(function(e){
		var len = e.path.split('/').length;
		dict[e.fs_id] = e.path.split('/')[len-1];
	})

	// get fid list
	var fidlist = list.map(function(d){return d.fs_id});

	// get dlink by fid list
	get_dlink(sign, fidlist, function(links){
		result = [];

		// process non-directory files
		for(var i=0; i<links.length; i++){
			result.push({dlink: links[i].dlink, hlink: "", fs_id: links[i].fs_id, path: dict[links[i].fs_id], isdir: 0});
			var index = fidlist.indexOf(links[i].fs_id);
			fidlist.splice(index, 1);
		}

		// process directory
		for(var i=0; i<fidlist.length; i++){
			result.push({dlink: "NA", hlink: "", fs_id: fidlist[i], path: dict[fidlist[i]], isdir: 1});

			// get directory dlink
			get_hlink(yunData, 0, undefined, [i+links.length], 3, 1, [fidlist[i]], function(links, indices){
				var event =  new CustomEvent("hlink2", {detail: {links: links, indices: indices}});
				window.dispatchEvent(event);
			});
		}

		// dispatch result
		var event =  new CustomEvent("dlink", {detail: result});
		window.dispatchEvent(event);
	});
}

// get links by file list in share page
function get_share_links(list){
	// dispatch general information
	var links = list.map(function(e){return {fs_id: e.fs_id, dlink: "NA", hlink: "", path: e.path, isdir: e.isdir}});
	var event = new CustomEvent("dlink", {detail: links});
	window.dispatchEvent(event);

	// get hlink for each file and dispatch it
	var file_fs_id_list = [];
	var file_indices = [];
	for(var i=0; i<links.length; i++){
		if(!links[i].isdir){
			file_fs_id_list.push(links[i].fs_id);
			file_indices.push(i);
		}else{
			get_hlink(yunData, 1, undefined, [i], 4, 1, [links[i].fs_id], function(links, indices){
				var event = new CustomEvent("hlink2", {detail: {links: links, indices: indices}});
				window.dispatchEvent(event);
			})
		}
	}
	if(file_fs_id_list.length != 0){
		get_hlink(yunData, 1, undefined, file_indices, 2, 0, file_fs_id_list, function(links, indices){
			var event = new CustomEvent("hlink2", {detail: {links: links, indices: indices}});
			window.dispatchEvent(event);
		})
	}
}
