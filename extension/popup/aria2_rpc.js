var servers = [
				'd11.baidupcs.com',
				'd7.baidupcs.com',
				'nbcache00.baidupcs.com',
				'nbcache03.baidupcs.com',
				'nj02all01.baidupcs.com',
				'yqall02.baidupcs.com',
				'bjbgp01.baidupcs.com',
				'allall01.baidupcs.com',
				'allall02.baidupcs.com'
										]

function get_all_hlinks(glink, cb){
	var $scope = angular.element(document.getElementById('app')).scope();
	var $http = angular.injector(["ng"]).get("$http");

	var parsed_glink = new URL(glink);
	var pathnames = parsed_glink.pathname.split('/')
	var url = 'https://d.pcs.baidu.com/rest/2.0/pcs/file?time='+parsed_glink.searchParams.get('time')+'&version=2.2.0&vip=1&path='+pathnames[pathnames.length-1]+'&fid='+parsed_glink.searchParams.get('fid')+'&rt=sh&sign='+parsed_glink.searchParams.get('sign')+'&expires=8h&chkv=1&method=locatedownload&app_id=250528&esl=0&ver=4.0';
	console.log(url);

	$http.get(url)
	.then(function(res){
		var urls = res.data.urls.map(function(e){return e.url});
		return cb(urls);
	}, function(res){
		console.log(res);
		$scope.$apply(function(){
			$scope.message = 'Error: can\' get high speed url list'
		});
	})
}
