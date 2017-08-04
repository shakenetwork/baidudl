var app = angular.module('app', []);
app.controller('control', function($scope, $interval){
	$scope.status = false;
	$scope.message = 'loading...';

	$scope.clear = function(){}
	$scope.generate = function(){}
	$scope.generateAll = function(){}
	$scope.copy = function(){}
	$scope.copyAll = function(){}
	$scope.download = function(){}
	$scope.verify = function(){}

	var checkDatabase = function (){
		var background = chrome.extension.getBackgroundPage();
		var database = background.database;
		console.log('refreshing...');
		console.log(database);
		$scope.message = 'loading...';
		switch(database.status){
			case 'loading':
				$scope.status = false;
				break;
			case 'error':
				$scope.status = false;
				$interval.cancel(checkRoutine);
				break;
			case 'complete':
				$scope.status = true;
				$scope.links = database.links;
				$scope.vcodes = database.vcodes;
				$interval.cancel(checkRoutine);
				break;
			default:
				$scope.status = false;
				$scope.message = 'Error: unknown status'
		}
	}
	var checkRoutine = $interval(checkDatabase, 1000)
})
