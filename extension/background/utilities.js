// home page logic
function home_page_exec(){
	console.log('home_page_exec');
	get_user_yunData(function(yunData){
		console.log(yunData);
	})
}

// search page logic
function search_page_exec(){
	console.log('search_page_exec');
	get_user_yunData(function(yunData){
		console.log(yunData);
	})
}

// share page logic
function share_page_exec(){
	console.log('share_page_exec');
}

function get_user_yunData(cb){
	$http.get('https://pan.baidu.com/disk/home')
	.then(function(res){
		var code = res.data.match(/var context={.*};/);
		code = code[0].substr(12, code[0].length-13);
		var yunData = JSON.parse(code);
		cb(yunData);
	},function(res){
		console.log(res);
	});
}
