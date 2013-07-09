//var auto_blank=$('#autocompletion');
var $auto_links=$(".source");
var filenames = [];

//var $classList = $(".source");
$auto_links.each(function(index){
  $('#jump_result').append($auto_links[index]);
  filenames.push($auto_links[index].text);
});

/*for(var i=0;i<auto_links.length;i++){
  $('#jump_result').append('<p>'+auto_links+'</p>');
}*/

$(function() {
  $("#autocompletion").autocomplete({
    source: filenames
  });
});
