$(window).ready(function() {

  $('input.execute').click(function(ev) {
    var button = ev.target;
    var endpoint = $(button).parents('.endpoint');
    var apikey = $('#api_key input').val();

    if (! (validate_params(endpoint))) {
      return;
    }

    var action_and_params = action_and_params_for_endpoint(endpoint);

    calculate_request(endpoint);
    calculate_response(endpoint, true);

    enable_status(endpoint, 'spinner');

    $.ajax({
      type: 'POST',
      url: '/request',
      data: {
        accept: $('#accept select').val(),
        action: action_and_params.action,
        params: flatten_params(action_and_params.params),
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
    $(ev.target).css('background-color', '#fff');
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
      calculate_request(this);
      calculate_response(this);
    });
  });

  $('#accept select').val($.cookie('accept'));

  $('.endpoint').each(function() {
    calculate_request(this);
    calculate_response(this);
  });
});

function flatten_params(params) {
  var flattened_params = [];

  $.each(params, function(key, val) {
    if (key == 'body') {
      flattened_params.push(full_uri_encode(val))
    } else {
      flattened_params.push(key + '=' + full_uri_encode(val));
    }
  });

  return(flattened_params.join('&'));
}

function params_for_endpoint(endpoint) {
  var params = {};

  $(endpoint).find('input.param').each(function() {
    if ($(this).val() != '') {
      var name = $(this).attr('name');
      var value = $(this).val();
      params[name] = value;
    }
  });

  return(params);
}

function action_and_params_for_endpoint(endpoint) {
  var action = $(endpoint).find('.action').text();
  var params = params_for_endpoint(endpoint);
  var matched_params = action.match(/(:[^\/]+)/g);

  if (matched_params) {
    $.each(matched_params, function(idx, action_param) {
      var name = action_param.substring(1);
      action = action.replace(action_param, params[name] ? full_uri_encode(params[name]) : action_param);
      delete params[name]
    });
  }

  return({ action:action, params:params });
}

function calculate_request(endpoint) {
  var action_and_params = action_and_params_for_endpoint(endpoint);
  request = action_and_params.action + '\n' + flatten_params(action_and_params.params);
  $(endpoint).find('.request.http textarea').text(request);

  var accept = $('#accept select').val();
  var apikey = $('#api_key input').val();
  var method = action_and_params.action.split(' ')[0];
  var path = action_and_params.action.split(' ')[1];
  var curl = '';
  curl += 'curl -H "Accept: ' + accept + '" \\\n';
  curl += '  -u :' + apikey + ' \\\n';
  $.each(action_and_params.params, function(key, val) {
    curl += '  -d "' + key + '=' + full_uri_encode(val) + '" \\\n';
  });
  curl += '  -X ' + method + ' https://api.heroku.com' + path;
  $(endpoint).find('.request.curl textarea').text(curl);
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
    $(endpoint).find('.response textarea').css('background-image', 'url(/sample.png)');
  } else {
    $(endpoint).find('.response textarea').text('');
    $(endpoint).find('.response textarea').css('background-image', '');
  }
}

function short_accept(accept) {
  switch (accept) {
    case 'application/json': return('json');
    case 'application/xml':  return('xml');
    default: return('unknown');
  }
}

function validate_params(endpoint) {
  var valid = true;

  $(endpoint).find('div.param').each(function(idx, param) {
    if ($(param).hasClass('required')) {
      var input = $(param).find('input.param');

      if ($(input).val() == '') {
        $(input).css('background-color', '#fcc');
        valid = false;
      }
    }
  });

  return(valid);
}

function enable_status(endpoint, status) {
  $(endpoint).find('.status').css('display', 'none');
  $(endpoint).find('.' + status).css('display', 'block');
}

function full_uri_encode(string) {
  string = encodeURIComponent(string);
  string = string.replace(/\./g, '%2E');
  return(string);
}
