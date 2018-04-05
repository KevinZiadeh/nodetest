$(document).ready(function(){

  var button = $('#register-button');
  $(button).prop('disabled', true);

$('#password').click(function(){
  $('.pswrdRequirements').show(400);
});

$('#password').mouseout(function(){
  $('.pswrdRequirements').hide(400);
});

$('#password').on('keyup', (event) => {
    checkPassword(event.target.value);
  });

  function checkPassword(password){
    var strength = 0;
    if (password.match(/[a-zA-Z0-9][a-zA-Z0-9]+/)) {
        strength += 1
    }
    if (password.match(/[~<>?]+/)) {
        strength += 1
    }
    if (password.match(/[!@#$%^&*()-]+/)) {
        strength += 1
    }
    if (password.length > 5) {
        strength += 1
    }
    switch(strength){
      case 0:
        $('#pswrdStrength').css('width', '0%');
      break
      case 1:
        $('#pswrdStrength').css('width', '10%');
      break
      case 2:
        $('#pswrdStrength').css('width', '30%');
      break
      case 3:
        $('#pswrdStrength').css('width', '70%');
        $(button).prop('disabled', false);
      break
      case 4:
        $('#pswrdStrength').css('width', '100%');
        $(button).prop('disabled', false);
      break
    }
  }

});
