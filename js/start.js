// Our bootstrapping
var tilecache = "https://mesonet.agron.iastate.edu";
var BACKEND = "https://mesonet-dep.agron.iastate.edu";
var appstate = {
	lastdate: null,
	lat: null,
	lon: null,
	date: null,
	date2: null,
    metric: 0,
	ltype: 'qc_precip'
};

$(document).ready(function(){
    build();
});
