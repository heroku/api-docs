$(window).ready(function() {

  $('input.execute').click(function(ev) {
    var button = ev.target;
    var endpoint = $(button).parents('.endpoint');
    var action = $(endpoint).find('.action').text();
    var apikey = $('#api_key input').val();

    calculate_request(endpoint);
    calculate_response(endpoint, true);

    enable_status(endpoint, 'spinner');

    $.ajax({
      type: 'POST',
      url: '/request',
      data: {
        accept: $('#accept select').val(),
        action: action,
        params: calculate_params(endpoint),
        apikey: apikey
      },
      success: function(data) {
        enable_status(endpoint, 'success');
        $(endpoint).find('.response textarea').text(data);
        $(endpoint).find('.response textarea').css('background-color', '#cfc');
      },
      error: function(xhr, data) {
        enable_status(endpoint, 'error');
        $(endpoint).find('.response textarea').text(xhr.responseText);
        $(endpoint).find('.response textarea').css('background-color', '#fcc');
      }
    });
  });

  $('input.param').bind('keyup', function(ev) {
    var endpoint = $(ev.target).parents('.endpoint');
    calculate_request(endpoint);
    calculate_response(endpoint);
  });

  $('#api_key input').bind('change', function(ev) {
    $.cookie('apikey', $(ev.target).val(), { expires: 3650 });
  });

  $('#api_key input').val($.cookie('apikey'));

  $('#accept select').bind('change', function(ev) {
    $.cookie('accept', $(ev.target).val(), { expires: 3650 });

    $('.endpoint').each(function() {
      calculate_response(this);
    });
  });

  $('#accept select').val($.cookie('accept'));

  $('.endpoint').each(function() {
    calculate_request(this);
    calculate_response(this);
  });
});

function calculate_params(endpoint) {
  var params = [];

  $(endpoint).find('input.param').each(function() {
    if ($(this).val() != '') {
      var name = $(this).attr('name');
      var value = $(this).val();
      params.push(name + '=' + escape(value));
    }
  });

  return(params.join('&'));
}

function calculate_request(endpoint) {
  var request = $(endpoint).find('.action').text();
  var params = calculate_params(endpoint);

  request += '\n';
  request += params

  $(endpoint).find('.request textarea').text(request);
}

function calculate_response(endpoint, ignore_blank) {
  var blank = true;

  $(endpoint).find('.response textarea').css('background-color', '#fff');

  $(endpoint).find('input.param').each(function(idx, param) {
    if ($(param).val() != '') {
      blank = false;
      return(false);
    }
  });

  if (ignore_blank) {
    blank = false;
  }

  if (blank) {
    var short = short_accept($('#accept select').val());
    var data = $(endpoint).find('input.sample.' + short).val();
    $(endpoint).find('.response textarea').text(data);
  } else {
    $(endpoint).find('.response textarea').text('');
  }
}

function short_accept(accept) {
  switch (accept) {
    case 'application/json': return('json');
    case 'application/xml':  return('xml');
    default: return('unknown');
  }
}

function enable_status(endpoint, status) {
  $(endpoint).find('.status').css('display', 'none');
  $(endpoint).find('.' + status).css('display', 'block');
}
