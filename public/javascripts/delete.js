$(document).ready(function(){
  $('.delete-user').on('click', function(e){
    if(!confirm('Are you sure ?')){
      return false;
    }
    var $target = $(e.target);
    const id = $target.attr('data-id');
    $.ajax({
      type:'DELETE',
      url: '/posts/'+id,
      success: function(response){
        window.location.href='/posts';
      },
      error: function(err){
        console.log(err);
      }
    });
  });
});
