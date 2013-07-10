//var auto_blank=$('#autocompletion');
var $auto_links=$(".source");
var filenames = [];

//var $classList = $(".source");
$auto_links.each(function(index){
  //$('#jump_result').append($auto_links[index]);
  filenames.push($auto_links[index].text);
  //alert($auto_links[index]);
});

/*for(var i=0;i<auto_links.length;i++){
  $('#jump_result').append('<p>'+auto_links+'</p>');
}*/
var sourcedata = [{"label":"NC.nc","value":"aaaaaa"}];
$auto_links.each(function(i){
    sourcedata.push({
         "label": filenames[i],
         "value": $auto_links[i]
    });
});
//alert(sourcedata[2].label+" "+sourcedata[2].value+" "+sourcedata.length+" "+filenames);



var states = [{"label":"PA.pa","value":"file:///Users/duj/Code/docco/docs/bagBarTemplates.html"},{"label":"MD","value":"Maryland"},{"label":"DC","value":"Washington"}];
//var tryit = [];
//for(var j=0;j<sourcedata.length;j++){
   // tryit[j]=sourcedata[j].label;
//}
alert(states+" "+states[1].label);
alert(sourcedata+" "+sourcedata[1].label);
  $("#autocompletion").autocomplete({
    source: function( req, response ) {
              var re = $.ui.autocomplete.escapeRegex(req.term);
              var matcher = new RegExp( "^" + re, "i" );
              //alert(matcher);

              response( $.grep(sourcedata, function( item ){
                    var aftertrans;
                    aftertrans=item.label.toString().replace(/\ +/g,"");
                    aftertrans=aftertrans.replace(/[ ]/g,"");
                    aftertrans=aftertrans.replace(/[\r\n]/g,"");
                //alert("'"+aftertrans+"' '"+matcher+"' "+ matcher.test(aftertrans));
                return matcher.test(aftertrans);
              }));
    },
    autoFocus: true,
    appendTo: "#jump_source",
    position:{
      my: "right top",
      at: "right bottom"
    },
    select: function(event, ui){
      window.location.href = ui.item.value;
    },
  });

