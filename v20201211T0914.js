var tilecache="https://mesonet.agron.iastate.edu",BACKEND=0<window.location.host.indexOf(".local")?"http://depbackend.local":"https://mesonet-dep.agron.iastate.edu",appstate={lastdate:null,lat:null,lon:null,date:null,date2:null,metric:0,ltype:"qc_precip"};var map,vectorLayer,iaextent,scenario=0,myDateFormat="M d, yy",geojsonFormat=new ol.format.GeoJSON,quickFeature,detailedFeature,detailedFeatureIn,hoverOverlayLayer,clickOverlayLayer,defaultCenter=ol.proj.transform([-94.5,42.1],"EPSG:4326","EPSG:3857"),defaultZoom=6,popup,varnames=["qc_precip","avg_runoff","avg_loss","avg_delivery"],multipliers={qc_precip:[1,25.4],avg_runoff:[1,25.4],avg_loss:[1,2.2417],avg_delivery:[1,2.2417]},levels={qc_precip:[[],[],0,0],avg_runoff:[[],[],0,0],avg_loss:[[],[],0,
0],avg_delivery:[[],[],0,0]},colors={qc_precip:"#FFFF80 #98F046 #3BD923 #3FC453 #37AD7A #26989E #215394 #0C1078".split(" "),avg_runoff:"#FFFF80 #98F046 #3BD923 #3FC453 #37AD7A #26989E #215394 #0C1078".split(" "),avg_loss:"#FFEBAF #E0A870 #BF8347 #DDFA00 #21DE00 #16B568 #1A818F #003075".split(" "),avg_delivery:"#FFEBAF #E0A870 #BF8347 #DDFA00 #21DE00 #16B568 #1A818F #003075".split(" ")},vardesc={avg_runoff:"Runoff is the average amount of water that left the hillslopes via above ground transport.",
avg_loss:"Soil Detachment is the average amount of soil disturbed on the modelled hillslopes.",qc_precip:"Precipitation is the average amount of rainfall and melted snow received on the hillslopes.",avg_delivery:"Hillslope Soil Loss is the average amount of soil transported to the bottom of the modelled hillslopes."},varunits={avg_runoff:["inches","mm"],avg_loss:["tons per acre","tonnes per ha"],qc_precip:["inches","mm"],avg_delivery:["tons per acre","tonnes per ha"]},vartitle={avg_runoff:"Water Runoff",
avg_loss:"Soil Detachment",qc_precip:"Total Precipitation",avg_delivery:"Hillslope Soil Loss"},currentTab=null;function handleClick(a){$("#buttontabs .btn").removeClass("active");for(i=1;5>i;i++)$("#q"+i).hide();$("#q"+a).show();null==currentTab?($("#btnq"+a).toggleClass("active"),$(".row-offcanvas").toggleClass("active"),currentTab=a):currentTab==a?($(".row-offcanvas").toggleClass("active"),currentTab=null):($("#btnq"+a).toggleClass("active"),currentTab=a)}
function formatDate(a,b){return $.datepicker.formatDate(a,b)}function makeDate(a,b,c){return new Date(b+"/"+c+"/"+a)}function setStatus(a){$.toaster({message:a,priority:"info"})}
function checkDates(){$.ajax({url:BACKEND+"/geojson/timedomain.py?scenario=0",fail:function(a,b){setStatus("New data check failed "+b)},success:function(a){a.last_date&&(a=a.last_date,a=makeDate(a.substr(0,4),a.substr(5,2),a.substr(8,2)),a>appstate.lastdate&&(appstate.lastdate=a,$("#datepicker").datepicker("change",{maxDate:formatDate(myDateFormat,a)}),$("#datepicker2").datepicker("change",{maxDate:formatDate(myDateFormat,a)}),null!=appstate.date?($("#newdate-thedate").html(formatDate(myDateFormat,
a)),$("#newdate-message").dialog({modal:!0,buttons:[{text:"Show Data!",icons:{primary:"ui-icon-heart"},click:function(){setDate(appstate.lastdate.getFullYear(),appstate.lastdate.getMonth()+1,appstate.lastdate.getDate());$(this).dialog("close")}},{text:"Ok",click:function(){$(this).dialog("close")}}]})):setDate(appstate.lastdate.getFullYear(),appstate.lastdate.getMonth()+1,appstate.lastdate.getDate())))}})}
function setWindowHash(){var a="";appstate.date&&"Invalid Date"!=appstate.date&&(a+=formatDate("yymmdd",appstate.date));a+="/";appstate.date2&&"Invalid Date"!=appstate.date2&&(a+=formatDate("yymmdd",appstate.date2));var a=a+("/"+appstate.ltype+"/"),b=map.getView().getCenter(),b=ol.proj.transform(b,"EPSG:3857","EPSG:4326"),a=a+(b[0].toFixed(2)+"/"+b[1].toFixed(2)+"/"+map.getView().getZoom()+"/");detailedFeature&&(a+=detailedFeature.getId());a+="/"+appstate.metric.toString()+"/";window.location.hash=
a}
function readWindowHash(){var a=window.location.hash.split("/");0<a.length&&""!=a[0]&&"#"!=a[0]&&"#NaNNaNNaN"!=a[0]&&(appstate.date=makeDate(a[0].substr(1,4),a[0].substr(5,2),a[0].substr(7,2)));1<a.length&&""!=a[1]&&"NaNNaNNaN"!=a[1]&&(appstate.date2=makeDate(a[1].substr(0,4),a[1].substr(4,2),a[1].substr(6,2)));2<a.length&&""!=a[2]&&(appstate.ltype=a[2],$("#radio input[value="+a[2]+"]").prop("checked",!0));5<a.length&&""!=a[3]&&""!=a[4]&&""!=a[5]&&(defaultCenter=ol.proj.transform([parseFloat(a[3]),parseFloat(a[4])],
"EPSG:4326","EPSG:3857"),defaultZoom=parseFloat(a[5]));6<a.length&&12==a[6].length&&(detailedFeatureIn=a[6]);7<a.length&&1==a[7].length&&(appstate.metric=parseInt(a[7]),$("#units_radio input[value="+a[7]+"]").prop("checked",!0))}function setToday(){setDate(appstate.lastdate.getFullYear(),appstate.lastdate.getMonth()+1,appstate.lastdate.getDate());$("#settoday").css("display","none")}
function setTitle(){dt=formatDate(myDateFormat,appstate.date);dtextra=null===appstate.date2?"":" to "+formatDate(myDateFormat,appstate.date2);$("#maptitle").html(vartitle[appstate.ltype]+" ["+varunits[appstate.ltype][appstate.metric]+"] for "+dt+" "+dtextra);$("#variable_desc").html(vardesc[appstate.ltype])}
function get_shapefile(){dt=formatDate("yy-mm-dd",appstate.date);var a=[];$("input[name='dlstates']:checked").each(function(b,d){a.push($(d).val())});var b=BACKEND+"/dl/shapefile.py?dt="+dt+"&states="+a.join(",");null!==appstate.date2&&(b=b+"&dt2="+formatDate("yy-mm-dd",appstate.date2));window.location.href=b}function setType(a){$("#"+a+"_opt").click()}
function hideDetails(){$("#details_hidden").css("display","block");$("#details_details").css("display","none");$("#details_loading").css("display","none")}
function updateDetails(a){$("#details_hidden").css("display","none");$("#details_details").css("display","none");$("#details_loading").css("display","block");$.get(BACKEND+"/huc12-details.php",{huc12:a,date:formatDate("yy-mm-dd",appstate.date),date2:formatDate("yy-mm-dd",appstate.date2)},function(a){$("#details_details").css("display","block");$("#details_loading").css("display","none");$("#details_details").html(a)})}
function getGeoJSONURL(){var a=BACKEND+"/geojson/huc12.py?date="+formatDate("yy-mm-dd",appstate.date);null!==appstate.date2&&(a=a+"&date2="+formatDate("yy-mm-dd",appstate.date2));return a}function rerender_vectors(){drawColorbar();vectorLayer.changed();setWindowHash();setTitle()}
function remap(){null!=appstate.date&&(null!=appstate.date2&&appstate.date2<=appstate.date?setStatus("Please ensure that 'To Date' is later than 'Date'"):(setStatus("Fetching new data to display..."),$.ajax({url:getGeoJSONURL(),dataType:"json",success:function(a){vectorLayer.getSource().clear();for(var b=0;b<varnames.length;b++){levels[varnames[b]][0]=a.jenks[varnames[b]];levels[varnames[b]][2]=a.max_values[varnames[b]];for(var c=0;c<levels[varnames[b]][0].length;c++)levels[varnames[b]][1][c]=levels[varnames[b]][0][c]*
multipliers[varnames[b]][1];levels[varnames[b]][3]=a.max_values[varnames[b]]*multipliers[varnames[b]][1]}drawColorbar();vectorLayer.getSource().addFeatures((new ol.format.GeoJSON).readFeatures(a,{featureProjection:ol.proj.get("EPSG:3857")}));detailedFeature&&(clickOverlayLayer.getSource().removeFeature(detailedFeature),detailedFeature=vectorLayer.getSource().getFeatureById(detailedFeature.getId()),clickOverlayLayer.getSource().addFeature(detailedFeature),updateDetails(detailedFeature.getId()));drawColorbar()}}),
setTitle(),setWindowHash()))}function setYearInterval(a){$("#eventsModal").modal("hide");appstate.date=makeDate(a,1,1);appstate.date2=makeDate(a,12,31);$("#datepicker").datepicker("setDate",formatDate(myDateFormat,appstate.date));$("#datepicker2").datepicker("setDate",formatDate(myDateFormat,appstate.date2));$("#multi").prop("checked",!0).button("refresh");remap();$("#dp2").css("visibility","visible")}
function setDateFromString(a){$("#eventsModal").modal("hide");a=new Date(a);setDate(formatDate("yy",a),formatDate("mm",a),formatDate("dd",a))}function setDate(a,b,c){appstate.date=makeDate(a,b,c);$("#datepicker").datepicker("setDate",formatDate(myDateFormat,appstate.date));$("#single").prop("checked",!0).button("refresh");appstate.date2=null;$("#dp2").css("visibility","hidden");remap()}function zoom_iowa(){map.zoomToExtent(iaextent)}
function make_iem_tms(a,b,c,d){return new ol.layer.Tile({title:a,visible:c,type:d,source:new ol.source.XYZ({url:tilecache+"/c/tile.py/1.0.0/"+b+"/{z}/{x}/{y}.png"})})}function setHUC12(a){feature=vectorLayer.getSource().getFeatureById(a);makeDetailedFeature(feature);$("#myModal").modal("hide")}
function makeDetailedFeature(a){null!=a&&(a!=detailedFeature&&(detailedFeature&&(detailedFeature.set("clicked",!1),clickOverlayLayer.getSource().removeFeature(detailedFeature)),a&&clickOverlayLayer.getSource().addFeature(a),detailedFeature=a),updateDetails(a.getId()),setWindowHash())}
function viewEvents(a,b){function c(a,b){return null==a?"0":a.toFixed(2)}function d(a,b){return"daily"==b?"":" ("+a+")"}var h="daily"==b?"Daily events":"Yearly summary (# daily events)";$("#eventsModalLabel").html(h+" for "+a);$("#eventsres").html('<p><img src="images/wait24trans.gif" /> Loading...</p>');$.ajax({method:"GET",url:BACKEND+"/geojson/huc12_events.py",data:{huc12:a,mode:b}}).done(function(e){var h="yearly"==b?"setYearInterval(":"setDateFromString(",f="<table class='table table-striped header-fixed'><thead><tr><th>Date</th><th>Precip ["+
varunits.qc_precip[appstate.metric]+"]</th><th>Runoff ["+varunits.qc_precip[appstate.metric]+"]</th><th>Detach ["+varunits.avg_loss[appstate.metric]+"]</th><th>Hillslope Soil Loss ["+varunits.avg_loss[appstate.metric]+"]</th></tr></thead>";$.each(e.results,function(a,e){var k="daily"==b?e.date:e.date.substring(6,10);f+='<tr><td><a href="javascript: '+h+"'"+k+"');\">"+k+"</a></td><td>"+c(e.qc_precip*multipliers.qc_precip[appstate.metric])+d(e.qc_precip_events,b)+"</td><td>"+c(e.avg_runoff*multipliers.avg_runoff[appstate.metric])+
d(e.avg_runoff_events,b)+"</td><td>"+c(e.avg_loss*multipliers.avg_loss[appstate.metric])+d(e.avg_loss_events,b)+"</td><td>"+c(e.avg_delivery*multipliers.avg_delivery[appstate.metric])+d(e.avg_delivery_events,b)+"</td></tr>"});f+="</table>";"yearly"==b&&(f+="<h4>Monthly Average Detachment</h4>",f+='<p><img src="/auto/huc12_bymonth.py?huc12='+a+'" class="img img-responsive" /></p>');$("#eventsres").html(f)}).fail(function(a){$("#eventsres").html("<p>Something failed, sorry</p>")})}
function doHUC12Search(){$("#huc12searchres").html('<p><img src="images/wait24trans.gif" /> Searching...</p>');var a=$("#huc12searchtext").val();$.ajax({method:"GET",url:BACKEND+"/geojson/hsearch.py",data:{q:a}}).done(function(a){var c="<table class='table table-striped'><thead><tr><th>ID</th><th>Name</th></tr></thead>";$.each(a.results,function(a,b){c+="<tr><td><a href=\"javascript: setHUC12('"+b.huc_12+"');\">"+b.huc_12+"</a></td><td>"+b.name+"</td></tr>"});c+="</table>";$("#huc12searchres").html(c)}).fail(function(a){$("#huc12searchres").html("<p>Search failed, sorry</p>")})}
function changeMapHeight(a){var b=map.getSize();map.setSize([b[0],b[1]+b[1]*a])}
function drawColorbar(){var a=document.getElementById("colorbar"),b=a.getContext("2d");a.height=20*colors[appstate.ltype].length+50;b.clearRect(0,0,a.width,a.height);b.font="bold 12pt Calibri";b.fillStyle="white";var c=b.measureText("Legend");b.fillText("Legend",a.width/2-c.width/2,14);var d=levels[appstate.ltype][appstate.metric+2],d="Max: "+d.toFixed(100>d?2:0);b.font="bold 10pt Calibri";b.fillStyle="yellow";c=b.measureText(d);b.fillText(d,a.width/2-c.width/2,32);var h=20;$.each(levels[appstate.ltype][appstate.metric],
function(d,g){b.beginPath();b.rect(5,a.height-h-10,20,20);b.fillStyle=colors[appstate.ltype][d];b.fill();b.font="bold 12pt Calibri";b.fillStyle="white";var f=g.toFixed(100>g?2:0);.001==g&&(f=.001);c=b.measureText(f);b.fillText(f,45-c.width/2,a.height-(h-20)-4);h+=20})}function layerVisible(a,b){a.setVisible(b);b&&"base"===a.get("type")&&$.each(map.getLayers().getArray(),function(b,d){d!=a&&"base"===d.get("type")&&d.setVisible(!1)})}
function makeLayerSwitcher(){var a=$("#ls-base-layers")[0],b=$("#ls-overlay-layers")[0];$.each(map.getLayers().getArray(),function(c,d){var h=d.get("title");if(void 0!==h){var e=document.createElement("li"),g=document.createElement("input"),f=document.createElement("span");"base"===d.get("type")?(g.type="radio",g.name="base"):g.type="checkbox";g.checked=d.get("visible");g.onchange=function(a){layerVisible(d,a.target.checked)};f.innerHTML=h;e.appendChild(g);e.appendChild(f);"base"===d.get("type")?
a.appendChild(e):b.appendChild(e)}})}
function displayFeatureInfo(a){a=map.getFeaturesAtPixel(map.getEventPixel(a.originalEvent));var b;document.getElementById("info");0<a.length?(b=a[0],$("#info-huc12").html(b.getId()),$("#info-loss").html((b.get("avg_loss")*multipliers.avg_loss[appstate.metric]).toFixed(2)+" "+varunits.avg_loss[appstate.metric]),$("#info-runoff").html((b.get("avg_runoff")*multipliers.avg_runoff[appstate.metric]).toFixed(2)+" "+varunits.avg_runoff[appstate.metric]),$("#info-delivery").html((b.get("avg_delivery")*multipliers.avg_delivery[appstate.metric]).toFixed(2)+
" "+varunits.avg_delivery[appstate.metric]),$("#info-precip").html((b.get("qc_precip")*multipliers.qc_precip[appstate.metric]).toFixed(2)+" "+varunits.qc_precip[appstate.metric])):($("#info-huc12").html("&nbsp;"),$("#info-loss").html("&nbsp;"),$("#info-runoff").html("&nbsp;"),$("#info-delivery").html("&nbsp;"),$("#info-precip").html("&nbsp;"));b&&b!==quickFeature&&(quickFeature&&hoverOverlayLayer.getSource().removeFeature(quickFeature),b&&hoverOverlayLayer.getSource().addFeature(b),quickFeature=b)}
var featureDisplayFunc=displayFeatureInfo;
function build(){try{readWindowHash()}catch(d){setStatus("An error occurred reading the hash link...")}$('[data-target="q1"]').click(function(a){handleClick(1)});$('[data-target="q2"]').click(function(a){handleClick(2)});$('[data-target="q3"]').click(function(a){handleClick(3)});$('[data-target="q4"]').click(function(a){handleClick(4)});$("#close_sidebar").click(function(){handleClick(currentTab)});var a=new ol.style.Style({fill:new ol.style.Fill({color:"rgba(255, 255, 255, 0)"}),text:new ol.style.Text({font:"14px Calibri,sans-serif",
stroke:new ol.style.Stroke({color:"#fff",width:8}),fill:new ol.style.Fill({color:"#000",width:3})}),stroke:new ol.style.Stroke({color:"#000000",width:.5})});vectorLayer=new ol.layer.VectorImage({title:"DEP Data Layer",imageRatio:2,source:new ol.source.Vector({format:new ol.format.GeoJSON,projection:ol.proj.get("EPSG:4326")}),style:function(b,c){val=b.get(appstate.ltype);1==appstate.metric&&(val*=multipliers[appstate.ltype][1]);for(var e="rgba(255, 255, 255, 0)",g=levels[appstate.ltype][appstate.metric].length-
2;0<=g;g--)if(val>=levels[appstate.ltype][appstate.metric][g]){e=colors[appstate.ltype][g];break}a.getFill().setColor(e);a.getStroke().setColor(1250>c?"#000000":e);a.getText().setText(160>c?val.toFixed(2):"");return[a]}});map=new ol.Map({target:"map",controls:[],layers:[new ol.layer.Tile({title:"OpenStreetMap",visible:!0,type:"base",source:new ol.source.OSM}),new ol.layer.Tile({title:"Global Imagery",visible:!1,type:"base",source:new ol.source.XYZ({url:"https://s3.amazonaws.com/com.modestmaps.bluemarble/{z}-r{y}-c{x}.jpg"})}),
make_iem_tms("Iowa 100m Hillshade","iahshd-900913",!1,"base"),vectorLayer,make_iem_tms("US Counties","c-900913",!1,""),make_iem_tms("US States","s-900913",!0,""),make_iem_tms("Hydrology","iahydrology-900913",!1,""),make_iem_tms("HUC 8","huc8-900913",!1,"")],view:new ol.View({enableRotation:!1,projection:ol.proj.get("EPSG:3857"),center:defaultCenter,zoom:defaultZoom})});popup=new ol.Overlay({element:document.getElementById("popup")});map.addOverlay(popup);var b=[new ol.style.Style({stroke:new ol.style.Stroke({color:"#f00",
width:1}),fill:new ol.style.Fill({color:"rgba(255,0,0,0.1)"})})],c=[new ol.style.Style({stroke:new ol.style.Stroke({color:"#000",width:2})})];hoverOverlayLayer=new ol.layer.Vector({source:new ol.source.Vector({features:new ol.Collection}),style:function(a,c){return b}});map.addLayer(hoverOverlayLayer);clickOverlayLayer=new ol.layer.Vector({source:new ol.source.Vector({features:new ol.Collection}),style:function(a,b){return c}});map.addLayer(clickOverlayLayer);map.on("moveend",function(){setWindowHash()});
map.on("pointermove",function(a){a.dragging||featureDisplayFunc(a)});map.on("click",function(a){a.dragging||featureDisplayFunc(a)});map.on("dblclick",function(a){a.stopPropagation();3!=currentTab&&handleClick(3);a=map.getEventPixel(a.originalEvent);(a=map.getFeaturesAtPixel(a))?makeDetailedFeature(a[0]):setStatus("No features found for where you double clicked on the map.")});$("#datepicker").datepicker({changeMonth:!0,changeYear:!0,dateFormat:myDateFormat,minDate:new Date(2007,0,1),maxDate:formatDate(myDateFormat,
appstate.lastdate),onSelect:function(a,b){var c=$("#datepicker").datepicker("getDate");appstate.date=makeDate(c.getUTCFullYear(),c.getUTCMonth()+1,c.getUTCDate());remap();appstate.date!=appstate.lastdate&&$("#settoday").css("display","block")}});$("#datepicker").on("change",function(a){a=$("#datepicker").datepicker("getDate");appstate.date=makeDate(a.getUTCFullYear(),a.getUTCMonth()+1,a.getUTCDate());remap();appstate.date<appstate.lastdate&&$("#settoday").css("display","block")});$("#datepicker").datepicker("setDate",
formatDate(myDateFormat,appstate.date));$("#datepicker2").datepicker({changeMonth:!0,changeYear:!0,disable:!0,dateFormat:myDateFormat,minDate:new Date(2007,0,1),maxDate:formatDate(myDateFormat,appstate.lastdate),onSelect:function(a,b){var c=$("#datepicker2").datepicker("getDate");appstate.date2=makeDate(c.getUTCFullYear(),c.getUTCMonth()+1,c.getUTCDate());remap()}});$("#datepicker2").on("change",function(a){a=$("#datepicker2").datepicker("getDate");appstate.date2=makeDate(a.getUTCFullYear(),a.getUTCMonth()+
1,a.getUTCDate());remap()});$("#datepicker2").datepicker("setDate",appstate.date2?formatDate(myDateFormat,appstate.date2||new Date):formatDate(myDateFormat,appstate.lastdate||new Date));$("#radio").buttonset();$("#radio input[type=radio]").change(function(){appstate.ltype=this.value;rerender_vectors()});$("#units_radio").buttonset();$("#units_radio input[type=radio]").change(function(){appstate.metric=parseInt(this.value);rerender_vectors()});$("#t").buttonset();appstate.date2&&$("#t input[value=multi]").prop("checked",
!0).button("refresh");$("#t input[type=radio]").change(function(){if("single"==this.value)appstate.date2=null,$("#dp2").css("visibility","hidden"),remap();else{$("#dp2").css("visibility","visible");var a=$("#datepicker2").datepicker("getDate");appstate.date2=makeDate(a.getUTCFullYear(),a.getUTCMonth()+1,a.getUTCDate())}});appstate.date2&&$("#dp2").css("visibility","visible");$("#huc12searchtext").on("keypress",function(a){13===a.which&&doHUC12Search()});$("#huc12searchbtn").on("click",function(){doHUC12Search()});
$("#minus1d").on("click",function(){appstate.date.setDate(appstate.date.getDate()-1);$("#datepicker").datepicker("setDate",formatDate(myDateFormat,appstate.date));remap();appstate.date<appstate.lastdate&&$("#plus1d").prop("disabled",!1);appstate.date!=appstate.lastdate&&$("#settoday").css("display","block")});$("#plus1d").on("click",function(){appstate.date.setDate(appstate.date.getDate()+1);appstate.date>appstate.lastdate?($("#plus1d").prop("disabled",!0),appstate.date.setDate(appstate.date.getDate()-
1)):($("#datepicker").datepicker("setDate",formatDate(myDateFormat,appstate.date)),remap())});$("#ia").on("click",function(){map.getView().setCenter(ol.proj.transform([-93.5,42.07],"EPSG:4326","EPSG:3857"));map.getView().setZoom(7);$(this).blur()});$("#mn").on("click",function(){map.getView().setCenter(ol.proj.transform([-94.31,44.3],"EPSG:4326","EPSG:3857"));map.getView().setZoom(7);$(this).blur()});$("#ks").on("click",function(){map.getView().setCenter(ol.proj.transform([-98.38,38.48],"EPSG:4326",
"EPSG:3857"));map.getView().setZoom(7);$(this).blur()});$("#ne").on("click",function(){map.getView().setCenter(ol.proj.transform([-96.01,40.55],"EPSG:4326","EPSG:3857"));map.getView().setZoom(8);$(this).blur()});$("#mapplus").click(function(){map.getView().setZoom(map.getView().getZoom()+1)});$("#mapminus").click(function(){map.getView().setZoom(map.getView().getZoom()-1)});remap();drawColorbar();checkDates();window.setInterval(checkDates,6E5);makeLayerSwitcher()};$(document).ready(function(){build()});
