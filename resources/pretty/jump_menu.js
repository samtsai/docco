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
var sourcedata = [];
$auto_links.each(function(i){
    sourcedata.push({
         "label": filenames[i],
         "value": $auto_links[i]
    });
});
//alert(sourcedata[2].label+" "+sourcedata[2].value+" "+sourcedata.length+" "+filenames);

bindButtons();

//var states = [{"label":"PA.pa","value":"file:///Users/duj/Code/docco/docs/bagBarTemplates.html"},{"label":"MD","value":"Maryland"},{"label":"DC","value":"Washington"}];
//var tryit = [];
//for(var j=0;j<sourcedata.length;j++){
   // tryit[j]=sourcedata[j].label;
//}
//alert(states+" "+states[1].label);
//alert(sourcedata+" "+sourcedata[1].label);

$(document).ready(function(){
  $("#autocompletion")
  .bind("keydown", function(event){
    if(event.keyCode == $.ui.keyCode.TAB && $(this).data("ui-autocomplete").menu.active){
      event.preventDefault();
    }
  })
  .autocomplete({
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
    appendTo: null,
    position:{
      my: "right top",
      at: "right bottom"
    },
    select: function(event, ui){
      window.location.href = ui.item.value;
    },
    close: function(event,ui){
     //$(".ui-autocomplete").css('display','block');
     $("#autocompletion").val("");
    }
  });
});

$("#autocompletion").click(function(){
  var $this = $(this);
  $(this).val("");
  //another way that select all text: $(this).select();

  //in order to work around Chrome's problme
  $(this).mouseup(function(){
    //prevent further mouseup intervention
    $this.unbind("mouseup");
    return false;
  });
});

function bindButtons(){
  var buttons = $("#file_section button");

  buttons.on('click',function(e){
    var $this = $(this);
    buttons.removeClass("selected").addClass("disabled");
    $this.addClass("selected").removeClass("disabled");

    switch($this.attr('id')){
      case 'filelist':
            val = true;
            break;
      case 'filechoice':
            val = false;
            break;
    }
    //alert(val);
    if(val){
      $("#jump_source").css("display","block");
      $("#jump_choice").css("display","none");
    }
    else{
      $("#jump_source").css("display","none");
      $("#jump_choice").css("display","block");

      //alert("success");
      //$("#ui-id-1").css("z-index","1000");
    }
  })
}

