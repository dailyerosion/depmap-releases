var tilecache=0<window.location.host.indexOf(".local")?"http://iem.local":"https://mesonet.agron.iastate.edu",BACKEND=0<window.location.host.indexOf(".local")?"http://depbackend.local":"https://mesonet-dep.agron.iastate.edu",appstate={sidebarOpen:!1,lastdate:null,lat:null,lon:null,date:null,date2:null,metric:0,ltype:"qc_precip"};var map,vectorLayer,scenario=0;const myDateFormat="M d, yy";var geojsonFormat=new ol.format.GeoJSON,quickFeature,detailedFeature,detailedFeatureIn,hoverOverlayLayer,clickOverlayLayer;let defaultCenter=ol.proj.transform([-94.5,42.1],"EPSG:4326","EPSG:3857"),defaultZoom=6;
var popup,varnames=["qc_precip","avg_runoff","avg_loss","avg_delivery"],multipliers={qc_precip:[1,25.4],avg_runoff:[1,25.4],avg_loss:[1,2.2417],avg_delivery:[1,2.2417],dt:[1,1],slp:[100,100]},levels={qc_precip:[[],[],0,0],avg_runoff:[[],[],0,0],avg_loss:[[],[],0,0],avg_delivery:[[],[],0,0],dt:[[1,2,3,4,5,6],[1,2,3,4,5,6],6,6],slp:[[1,2,3,5,10,20],[1,2,3,5,10,20],-1,-1]},colors={qc_precip:"#FFFF80 #98F046 #3BD923 #3FC453 #37AD7A #26989E #215394 #0C1078".split(" "),avg_runoff:"#FFFF80 #98F046 #3BD923 #3FC453 #37AD7A #26989E #215394 #0C1078".split(" "),
avg_loss:"#FFEBAF #E0A870 #BF8347 #DDFA00 #21DE00 #16B568 #1A818F #003075".split(" "),avg_delivery:"#FFEBAF #E0A870 #BF8347 #DDFA00 #21DE00 #16B568 #1A818F #003075".split(" "),dt:"#FFEBAF #E0A870 #BF8347 #DDFA00 #21DE00 #16B568".split(" "),slp:"#16B568 #21DE00 #DDFA00 #BF8347 #E0A870 #FFEBAF".split(" ")},vardesc={avg_runoff:"Runoff is the average amount of water that left the hillslopes via above ground transport.",avg_loss:"Soil Detachment is the average amount of soil disturbed on the modelled hillslopes.",
qc_precip:"Precipitation is the average amount of rainfall and melted snow received on the hillslopes.",avg_delivery:"Hillslope Soil Loss is the average amount of soil transported to the bottom of the modelled hillslopes.",dt:"Dominant Tillage Code is an index value with increasing values indicating increasing tillage intensity.",slp:"Average hillslope bulk slope."},varunits={avg_runoff:["inches","mm"],avg_loss:["tons per acre","tonnes per ha"],qc_precip:["inches","mm"],avg_delivery:["tons per acre",
"tonnes per ha"],dt:[" "," "],slp:["%","%"]},vartitle={avg_runoff:"Water Runoff",avg_loss:"Soil Detachment",qc_precip:"Precipitation",avg_delivery:"Hillslope Soil Loss",dt:"Dominant Tillage",slp:"Bulk Slope"};function handleSideBarClick(){$("#buttontabs .btn").removeClass("focus");$(".row-offcanvas").toggleClass("active");appstate.sidebarOpen=!appstate.sidebarOpen}function formatDate(a,c){return $.datepicker.formatDate(a,c)}function makeDate(a,c,d){return new Date(c+"/"+d+"/"+a)}
function setStatus(a){$.toaster({message:a,priority:"info"})}function showVersions(){$.ajax({url:BACKEND+"/auto/version.py?scenario="+scenario,fail:function(a,c){setStatus("DEP version check failed "+c)},success:a=>{$("#dv_label").text(a.label);$("#dv_wepp").text(a.wepp);$("#dv_acpf").text(a.acpf);$("#dv_flowpath").text(a.flowpath);$("#dv_gssurgo").text(a.gssurgo);$("#dv_software").text(a.software);$("#dv_tillage").text(a.tillage)}})}
function checkDates(){$.ajax({url:BACKEND+"/geojson/timedomain.py?scenario="+scenario,fail:function(a,c){setStatus("New data check failed "+c)},success:function(a){a.last_date&&(a=a.last_date,a=makeDate(a.substr(0,4),a.substr(5,2),a.substr(8,2)),a>appstate.lastdate&&(null==appstate.date||a.getTime()!==appstate.date.getTime())&&(appstate.lastdate=a,$("#datepicker").datepicker("change",{maxDate:formatDate(myDateFormat,a)}),$("#datepicker2").datepicker("change",{maxDate:formatDate(myDateFormat,a)}),
null!=appstate.date?($("#newdate-thedate").html(formatDate(myDateFormat,a)),$("#newdate-message").dialog({modal:!0,buttons:[{text:"Show Data!",icons:{primary:"ui-icon-heart"},click:function(){setDate(appstate.lastdate.getFullYear(),appstate.lastdate.getMonth()+1,appstate.lastdate.getDate());$(this).dialog("close")}},{text:"Ok",click:function(){$(this).dialog("close")}}]})):setDate(appstate.lastdate.getFullYear(),appstate.lastdate.getMonth()+1,appstate.lastdate.getDate())))}})}
function setWindowHash(){var a="";appstate.date&&"Invalid Date"!=appstate.date&&(a+=formatDate("yymmdd",appstate.date));a+="/";appstate.date2&&"Invalid Date"!=appstate.date2&&(a+=formatDate("yymmdd",appstate.date2));a+="/"+appstate.ltype+"/";var c=map.getView().getCenter();c=ol.proj.transform(c,"EPSG:3857","EPSG:4326");a+=c[0].toFixed(2)+"/"+c[1].toFixed(2)+"/"+map.getView().getZoom()+"/";detailedFeature&&(a+=detailedFeature.getId());a+="/"+appstate.metric.toString()+"/";window.location.hash=a}
function readWindowHash(){var a=window.location.hash.split("/");0<a.length&&""!=a[0]&&"#"!=a[0]&&"#NaNNaNNaN"!=a[0]&&(appstate.date=makeDate(a[0].substr(1,4),a[0].substr(5,2),a[0].substr(7,2)));1<a.length&&""!=a[1]&&"NaNNaNNaN"!=a[1]&&(appstate.date2=makeDate(a[1].substr(0,4),a[1].substr(4,2),a[1].substr(6,2)));2<a.length&&""!=a[2]&&(appstate.ltype=a[2],$("input[value="+a[2]+"]").prop("checked",!0));5<a.length&&""!=a[3]&&""!=a[4]&&""!=a[5]&&(defaultCenter=ol.proj.transform([parseFloat(a[3]),parseFloat(a[4])],
"EPSG:4326","EPSG:3857"),defaultZoom=parseFloat(a[5]));6<a.length&&12==a[6].length&&(detailedFeatureIn=a[6]);7<a.length&&1==a[7].length&&(appstate.metric=parseInt(a[7]),$("#units_radio input[value="+a[7]+"]").prop("checked",!0))}function setToday(){setDate(appstate.lastdate.getFullYear(),appstate.lastdate.getMonth()+1,appstate.lastdate.getDate());$("#settoday").css("display","none")}
function setTitle(){dt=formatDate(myDateFormat,appstate.date);dtextra=null===appstate.date2?"":" to "+formatDate(myDateFormat,appstate.date2);$("#maptitle").html("Viewing "+vartitle[appstate.ltype]+" for "+dt+" "+dtextra);$("#variable_desc").html(vardesc[appstate.ltype])}
function getShapefile(){dt=formatDate("yy-mm-dd",appstate.date);var a=[];$("input[name='dlstates']:checked").each(function(d,b){a.push($(b).val())});var c=BACKEND+"/dl/shapefile.py?dt="+dt+"&states="+a.join(",");null!==appstate.date2&&(c=c+"&dt2="+formatDate("yy-mm-dd",appstate.date2));0==appstate.metric&&(c+="&conv=english");window.location.href=c}
function hideDetails(){$("#details_hidden").css("display","block");$("#details_details").css("display","none");$("#details_loading").css("display","none")}
function updateDetails(a){appstate.sidebarOpen||handleSideBarClick();$("#datatablink").click();$("#details_hidden").css("display","none");$("#details_details").css("display","none");$("#details_loading").css("display","block");$.get(BACKEND+"/huc12-details.php",{huc12:a,date:formatDate("yy-mm-dd",appstate.date),date2:formatDate("yy-mm-dd",appstate.date2)},function(c){$("#details_details").css("display","block");$("#details_loading").css("display","none");$("#details_details").html(c)})}
function getJSONURL(){return BACKEND+"/auto/"+formatDate("yymmdd",appstate.date)+"_"+formatDate("yymmdd",null!==appstate.date2?appstate.date2:appstate.date)+".json"}function rerender_vectors(){drawColorbar();vectorLayer.changed();setWindowHash();setTitle()}
function remap(){null!=appstate.date&&(null!=appstate.date2&&appstate.date2<=appstate.date?setStatus("Please ensure that 'To Date' is later than 'Date'"):(setStatus("Fetching new data to display..."),$.ajax({url:getJSONURL(),dataType:"json",success:function(a){var c=vectorLayer.getSource();c.getFeatures().forEach(function(e){e.setProperties({avg_delivery:0,qc_precip:0},!0)});a.data.forEach(function(e){var f=c.getFeatureById(e.huc_12);null!==f&&f.setProperties(e,!0)});for(var d=0;d<varnames.length;d++){levels[varnames[d]][0]=
a.ramps[varnames[d]];levels[varnames[d]][2]=a.max_values[varnames[d]];for(var b=0;b<levels[varnames[d]][0].length;b++)levels[varnames[d]][1][b]=levels[varnames[d]][0][b]*multipliers[varnames[d]][1];levels[varnames[d]][3]=a.max_values[varnames[d]]*multipliers[varnames[d]][1]}drawColorbar();detailedFeature&&(clickOverlayLayer.getSource().removeFeature(detailedFeature),detailedFeature=vectorLayer.getSource().getFeatureById(detailedFeature.getId()),clickOverlayLayer.getSource().addFeature(detailedFeature),
updateDetails(detailedFeature.getId()));drawColorbar();vectorLayer.changed()}}),setTitle(),setWindowHash()))}function setYearInterval(a){$("#eventsModal").modal("hide");appstate.date=makeDate(a,1,1);appstate.date2=makeDate(a,12,31);$("#datepicker").datepicker("setDate",formatDate(myDateFormat,appstate.date));$("#datepicker2").datepicker("setDate",formatDate(myDateFormat,appstate.date2));$("#multi").prop("checked",!0).button("refresh");remap();$("#dp2").css("display","block")}
function setDateFromString(a){$("#eventsModal").modal("hide");a=new Date(a);setDate(formatDate("yy",a),formatDate("mm",a),formatDate("dd",a))}function setDate(a,c,d){appstate.date=makeDate(a,c,d);$("#datepicker").datepicker("setDate",formatDate(myDateFormat,appstate.date));$("#single").prop("checked",!0).button("refresh");appstate.date2=null;$("#dp2").css("display","none");remap()}
function make_iem_tms(a,c,d,b){return new ol.layer.Tile({title:a,visible:d,type:b,maxZoom:"depmask"==c?9:21,source:new ol.source.XYZ({url:tilecache+"/c/tile.py/1.0.0/"+c+"/{z}/{x}/{y}.png"})})}function setHUC12(a){feature=vectorLayer.getSource().getFeatureById(a);makeDetailedFeature(feature);$("#myModal").modal("hide")}
function makeDetailedFeature(a){null!=a&&(a!=detailedFeature&&(detailedFeature&&(detailedFeature.set("clicked",!1),clickOverlayLayer.getSource().removeFeature(detailedFeature)),a&&clickOverlayLayer.getSource().addFeature(a),detailedFeature=a),updateDetails(a.getId()),setWindowHash())}
function viewEvents(a,c){function d(g,k){return null==g?"0":g.toFixed(2)}function b(g,k){return"daily"==k?"":" ("+g+")"}var e="daily"==c?"Date":"Year",f="daily"==c?"Daily events":"Yearly summary (# daily events)";$("#eventsModalLabel").html(f+" for "+a);$("#eventsres").html('<p><img src="images/wait24trans.gif" /> Loading...</p>');$.ajax({method:"GET",url:BACKEND+"/geojson/huc12_events.py",data:{huc12:a,mode:c}}).done(function(g){var k="yearly"==c?"setYearInterval(":"setDateFromString(",l='<button class="btn btn-primary" onclick="javascript: window.open(\''+
BACKEND+"/geojson/huc12_events.py?huc12="+a+"&amp;mode="+c+'&amp;format=xlsx\');"><i class="bi-download"></i> Excel Download</button><br /><table class="table table-striped header-fixed" id="depdt"><thead><tr><th>'+e+"</th><th>Precip ["+varunits.qc_precip[appstate.metric]+"]</th><th>Runoff ["+varunits.qc_precip[appstate.metric]+"]</th><th>Detach ["+varunits.avg_loss[appstate.metric]+"]</th><th>Hillslope Soil Loss ["+varunits.avg_loss[appstate.metric]+"]</th></tr></thead>";$.each(g.results,function(m,
h){m="daily"==c?h.date:h.date.substring(0,4);l+='<tr><td><a href="javascript: '+k+"'"+m+"');\">"+m+"</a></td><td>"+d(h.qc_precip*multipliers.qc_precip[appstate.metric])+b(h.qc_precip_events,c)+"</td><td>"+d(h.avg_runoff*multipliers.avg_runoff[appstate.metric])+b(h.avg_runoff_events,c)+"</td><td>"+d(h.avg_loss*multipliers.avg_loss[appstate.metric])+b(h.avg_loss_events,c)+"</td><td>"+d(h.avg_delivery*multipliers.avg_delivery[appstate.metric])+b(h.avg_delivery_events,c)+"</td></tr>"});l+="</table>";
"yearly"==c&&(l+="<h4>Monthly Averages</h4>",l+='<p><img src="'+BACKEND+"/auto/huc12_bymonth.py?huc12="+a+'" class="img img-responsive"></p>');$("#eventsres").html(l);$("#depdt").DataTable()}).fail(function(g){$("#eventsres").html("<p>Something failed, sorry</p>")})}
function doHUC12Search(){$("#huc12searchres").html('<p><img src="images/wait24trans.gif" /> Searching...</p>');var a=$("#huc12searchtext").val();$.ajax({method:"GET",url:BACKEND+"/geojson/hsearch.py",data:{q:a}}).done(function(c){var d="<table class='table table-striped'><thead><tr><th>ID</th><th>Name</th></tr></thead>";$.each(c.results,function(b,e){d+="<tr><td><a href=\"javascript: setHUC12('"+e.huc_12+"');\">"+e.huc_12+"</a></td><td>"+e.name+"</td></tr>"});d+="</table>";$("#huc12searchres").html(d)}).fail(function(c){$("#huc12searchres").html("<p>Search failed, sorry</p>")})}
function drawColorbar(){var a=document.getElementById("colorbar"),c=a.getContext("2d");a.height=20*colors[appstate.ltype].length+80;c.clearRect(0,0,a.width,a.height);c.font="bold 12pt Calibri";c.fillStyle="black";var d=c.measureText("Legend");c.fillText("Legend",a.width/2-d.width/2,14);var b=levels[appstate.ltype][appstate.metric+2];b="Max: "+b.toFixed(100>b?2:0);c.font="bold 10pt Calibri";c.fillStyle="black";d=c.measureText(b);"dt"!=appstate.ltype&&"slp"!=appstate.ltype&&c.fillText(b,a.width/2-d.width/
2,32);var e=20;$.each(levels[appstate.ltype][appstate.metric],function(f,g){f>=colors[appstate.ltype].length||(c.beginPath(),c.rect(5,a.height-e-40,20,20),c.fillStyle=colors[appstate.ltype][f],c.fill(),c.font="bold 12pt Calibri",c.fillStyle="black",f=100>g?2:0,"dt"==appstate.ltype&&(f=0),f=g.toFixed(f),.001==g&&(f=.001),d=c.measureText(f),"dt"==appstate.ltype?c.fillText(f,10,a.height-(e+26)):c.fillText(f,45-d.width/2,a.height-(e+10)-4),e+=20)});b=varunits[appstate.ltype][appstate.metric];d=c.measureText(b);
c.fillText(b,a.width/2-d.width/2,a.height-5)}function layerVisible(a,c){a.setVisible(c);c&&"base"===a.get("type")&&$.each(map.getLayers().getArray(),function(d,b){b!=a&&"base"===b.get("type")&&b.setVisible(!1)})}
function makeLayerSwitcher(){var a=$("#ls-base-layers")[0],c=$("#ls-overlay-layers")[0];$.each(map.getLayers().getArray(),function(d,b){var e=b.get("title");if(void 0!==e){d="oll"+d;var f=document.createElement("li"),g=document.createElement("input");g.id=d;var k=document.createElement("label");k.htmlFor=d;"base"===b.get("type")?(g.type="radio",g.name="base"):g.type="checkbox";g.checked=b.get("visible");g.addEventListener("change",function(l){layerVisible(b,l.target.checked)});k.innerHTML="&nbsp; "+
e;f.appendChild(g);f.appendChild(k);"base"===b.get("type")?a.appendChild(f):c.appendChild(f)}})}
function displayFeatureInfo(a){var c=map.getFeaturesAtPixel(map.getEventPixel(a.originalEvent));if(0<c.length){var d=c[0];popup.element.hidden=!1;popup.setPosition(a.coordinate);$("#info-name").html(d.get("name"));$("#info-huc12").html(d.getId());$("#info-loss").html((d.get("avg_loss")*multipliers.avg_loss[appstate.metric]).toFixed(2)+" "+varunits.avg_loss[appstate.metric]);$("#info-runoff").html((d.get("avg_runoff")*multipliers.avg_runoff[appstate.metric]).toFixed(2)+" "+varunits.avg_runoff[appstate.metric]);
$("#info-delivery").html((d.get("avg_delivery")*multipliers.avg_delivery[appstate.metric]).toFixed(2)+" "+varunits.avg_delivery[appstate.metric]);$("#info-precip").html((d.get("qc_precip")*multipliers.qc_precip[appstate.metric]).toFixed(2)+" "+varunits.qc_precip[appstate.metric])}else popup.element.hidden=!0,$("#info-name").html("&nbsp;"),$("#info-huc12").html("&nbsp;"),$("#info-loss").html("&nbsp;"),$("#info-runoff").html("&nbsp;"),$("#info-delivery").html("&nbsp;"),$("#info-precip").html("&nbsp;");
d&&d!==quickFeature&&(quickFeature&&hoverOverlayLayer.getSource().removeFeature(quickFeature),d&&hoverOverlayLayer.getSource().addFeature(d),quickFeature=d)}function changeOpacity(a){vectorLayer.setOpacity(vectorLayer.getOpacity()+a)}function handleMapControlsClick(a){a=a.target.id;$("#mapcontrols button").removeClass("active");$("#"+a).addClass("active")}
function build(){try{readWindowHash()}catch(b){setStatus("An error occurred reading the hash link...")}$('[data-target="q1"]').click(function(b){handleSideBarClick()});var a=new ol.style.Style({fill:new ol.style.Fill({color:"rgba(255, 255, 255, 0)"}),text:new ol.style.Text({font:"14px Calibri,sans-serif",stroke:new ol.style.Stroke({color:"#fff",width:8}),fill:new ol.style.Fill({color:"#000",width:3})}),stroke:new ol.style.Stroke({color:"#000000",width:.5})});vectorLayer=new ol.layer.VectorImage({title:"DEP Data Layer",
imageRatio:2,source:new ol.source.Vector({url:BACKEND+"/geojson/huc12.geojson",format:new ol.format.GeoJSON,projection:ol.proj.get("EPSG:4326")}),style:function(b,e){b=b.get(appstate.ltype);b*=multipliers[appstate.ltype][appstate.metric];let f="rgba(255, 255, 255, 0)";for(var g=levels[appstate.ltype][appstate.metric].length-2;0<=g;g--)if(b>=levels[appstate.ltype][appstate.metric][g]){f=colors[appstate.ltype][g];break}a.getFill().setColor(f);a.getStroke().setColor(1250>e?"#000000":f);a.getText().setText(160>
e?b.toFixed(2):"");return[a]}});vectorLayer.getSource().on("featuresloadend",function(){remap()});map=new ol.Map({target:"map",controls:[],layers:[new ol.layer.Tile({title:"OpenStreetMap",visible:!0,type:"base",source:new ol.source.OSM}),new ol.layer.Tile({title:"Global Imagery",visible:!1,type:"base",source:new ol.source.XYZ({url:"https://s3.amazonaws.com/com.modestmaps.bluemarble/{z}-r{y}-c{x}.jpg"})}),make_iem_tms("Iowa 100m Hillshade","iahshd-900913",!1,"base"),vectorLayer,make_iem_tms("Domain Mask",
"depmask",!0,""),make_iem_tms("US Counties","c-900913",!1,""),make_iem_tms("US States","s-900913",!0,""),make_iem_tms("HUC 8","huc8-900913",!1,"")],view:new ol.View({enableRotation:!1,projection:ol.proj.get("EPSG:3857"),center:defaultCenter,zoom:defaultZoom})});popup=new ol.Overlay({element:document.getElementById("fdetails"),offset:[7,7],autoPan:{animation:{duration:250}}});map.addOverlay(popup);var c=[new ol.style.Style({stroke:new ol.style.Stroke({color:"#f00",width:1}),fill:new ol.style.Fill({color:"rgba(255,0,0,0.1)"})})],
d=[new ol.style.Style({stroke:new ol.style.Stroke({color:"#000",width:2})})];hoverOverlayLayer=new ol.layer.Vector({source:new ol.source.Vector({features:new ol.Collection}),style:function(b,e){return c}});map.addLayer(hoverOverlayLayer);clickOverlayLayer=new ol.layer.Vector({source:new ol.source.Vector({features:new ol.Collection}),style:function(b,e){return d}});map.addLayer(clickOverlayLayer);map.on("moveend",function(){setWindowHash()});map.on("pointermove",function(b){b.dragging||displayFeatureInfo(b)});
map.on("click",function(b){b.dragging||displayFeatureInfo(b)});map.on("dblclick",function(b){b.stopPropagation();b=map.getEventPixel(b.originalEvent);b=map.getFeaturesAtPixel(b);0<b.length?makeDetailedFeature(b[0]):setStatus("No features found for where you double clicked on the map.")});$("#datepicker").datepicker({changeMonth:!0,changeYear:!0,dateFormat:myDateFormat,minDate:new Date(2007,0,1),maxDate:formatDate(myDateFormat,appstate.lastdate),onSelect:function(b,e){b=$("#datepicker").datepicker("getDate");
appstate.date=makeDate(b.getUTCFullYear(),b.getUTCMonth()+1,b.getUTCDate());remap();appstate.date!=appstate.lastdate&&$("#settoday").css("display","block")}});$("#datepicker").on("change",function(b){b=$("#datepicker").datepicker("getDate");appstate.date=makeDate(b.getUTCFullYear(),b.getUTCMonth()+1,b.getUTCDate());remap();appstate.date<appstate.lastdate&&$("#settoday").css("display","block")});$("#datepicker").datepicker("setDate",formatDate(myDateFormat,appstate.date));$("#datepicker2").datepicker({changeMonth:!0,
changeYear:!0,disable:!0,dateFormat:myDateFormat,minDate:new Date(2007,0,1),maxDate:formatDate(myDateFormat,appstate.lastdate),onSelect:function(b,e){b=$("#datepicker2").datepicker("getDate");appstate.date2=makeDate(b.getUTCFullYear(),b.getUTCMonth()+1,b.getUTCDate());remap()}});$("#datepicker2").on("change",function(b){b=$("#datepicker2").datepicker("getDate");appstate.date2=makeDate(b.getUTCFullYear(),b.getUTCMonth()+1,b.getUTCDate());remap()});$("#datepicker2").datepicker("setDate",appstate.date2?
formatDate(myDateFormat,appstate.date2||new Date):formatDate(myDateFormat,appstate.lastdate||new Date));$("input[type=radio][name=whichlayer]").change(function(){appstate.ltype=this.value;rerender_vectors()});$("#units_radio").buttonset();$("#units_radio input[type=radio]").change(function(){appstate.metric=parseInt(this.value);rerender_vectors()});$("#t").buttonset();appstate.date2&&$("#t input[value=multi]").prop("checked",!0).button("refresh");$("#t input[type=radio]").change(function(){if("single"==
this.value)appstate.date2=null,$("#dp2").css("display","none"),remap();else{$("#dp2").css("display","block");var b=$("#datepicker2").datepicker("getDate");appstate.date2=makeDate(b.getUTCFullYear(),b.getUTCMonth()+1,b.getUTCDate())}});appstate.date2&&$("#dp2").css("display","block");$("#huc12searchtext").on("keypress",function(b){13===b.which&&doHUC12Search()});$("#huc12searchbtn").on("click",function(){doHUC12Search()});$("#minus1d").on("click",function(){appstate.date.setDate(appstate.date.getDate()-
1);$("#datepicker").datepicker("setDate",formatDate(myDateFormat,appstate.date));remap();appstate.date<appstate.lastdate&&$("#plus1d").prop("disabled",!1);appstate.date!=appstate.lastdate&&$("#settoday").css("display","block")});$("#plus1d").on("click",function(){appstate.date.setDate(appstate.date.getDate()+1);appstate.date>appstate.lastdate?($("#plus1d").prop("disabled",!0),appstate.date.setDate(appstate.date.getDate()-1)):($("#datepicker").datepicker("setDate",formatDate(myDateFormat,appstate.date)),
remap())});$("#il").on("click",function(){map.getView().setCenter(ol.proj.transform([-88.75,40.14],"EPSG:4326","EPSG:3857"));map.getView().setZoom(7);$(this).blur()});$("#wi").on("click",()=>{map.getView().setCenter(ol.proj.transform([-91.2,45.11],"EPSG:4326","EPSG:3857"));map.getView().setZoom(7);$(this).blur()});$("#ia").on("click",function(){map.getView().setCenter(ol.proj.transform([-93.5,42.07],"EPSG:4326","EPSG:3857"));map.getView().setZoom(7);$(this).blur()});$("#mn").on("click",function(){map.getView().setCenter(ol.proj.transform([-93.21,
46.05],"EPSG:4326","EPSG:3857"));map.getView().setZoom(7);$(this).blur()});$("#ks").on("click",function(){map.getView().setCenter(ol.proj.transform([-98.38,38.48],"EPSG:4326","EPSG:3857"));map.getView().setZoom(7);$(this).blur()});$("#ne").on("click",function(){map.getView().setCenter(ol.proj.transform([-96.01,40.55],"EPSG:4326","EPSG:3857"));map.getView().setZoom(8);$(this).blur()});$("#mapcontrols button").click(handleMapControlsClick);$("#mapplus").click(function(){map.getView().setZoom(map.getView().getZoom()+
1)});$("#mapminus").click(function(){map.getView().setZoom(map.getView().getZoom()-1)});$("#mapprint").click(function(){var b=BACKEND+"/auto/"+formatDate("yymmdd",appstate.date)+"_"+formatDate("yymmdd",null===appstate.date2?appstate.date:appstate.date2)+"_0_"+appstate.ltype+".png";window.open(b)});$("#mapinfo").click(function(){setStatus("Double click HUC12 for detailed data.")});checkDates();window.setInterval(checkDates,6E5);makeLayerSwitcher();showVersions()};$(document).ready(function(){build()});
