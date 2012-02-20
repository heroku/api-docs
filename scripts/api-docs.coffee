current_example = "http"
sidebar_enabled = true
sidebar_top     = null

delayfn = (ms, func) -> setTimeout func, ms

encode_param = (key, val) ->
  if key is "body"
    full_uri_encode val
  else
    "#{key}=#{full_uri_encode(val)}"

flatten_params = (params) ->
  flattened = for key, val of params
    encode_param key, val
  flattened.join "&"

params_for_endpoint = (endpoint) ->
  params = {}
  $(endpoint).find("input.param").each ->
    unless $(this).val() is ""
      name = $(this).attr("name")
      value = $(this).val()
      params[name] = value
  params

action_and_params_for_endpoint = (endpoint) ->
  action = $(endpoint).find(".action").text()
  params = params_for_endpoint(endpoint)
  matched_params = action.match(/(:[^\/]+)/g)
  if matched_params
    $.each matched_params, (idx, action_param) ->
      name = action_param.substring(1)
      action = action.replace(action_param, (if params[name] then full_uri_encode(params[name]) else action_param))
      delete params[name]
  action: action
  params: params

calculate_request = (endpoint) ->
  action_and_params = action_and_params_for_endpoint(endpoint)
  request = action_and_params.action + "\n" + flatten_params(action_and_params.params)
  $(endpoint).find(".example.http .request textarea").text request

  accept = $("#accept select").val()
  apikey = $("#api_key input").val()
  method = action_and_params.action.split(" ")[0]
  path = action_and_params.action.split(" ")[1]
  params = params_for_endpoint(endpoint)

  curl = ""
  curl += "curl -H \"Accept: " + accept + "\" \\\n"
  curl += "  -u :" + apikey + " \\\n"
  $.each action_and_params.params, (key, val) ->
    curl += "  -d \"" + key + "=" + full_uri_encode(val) + "\" \\\n"
  curl += "  -X " + method + " https://api.heroku.com" + path
  $(endpoint).find(".example.curl textarea").text curl

  ruby = $(endpoint).find(".sample.ruby").val()
  ruby = ruby.replace("%api_key%", apikey)
  $.each params, (key, val) ->
    ruby = ruby.replace("%" + key + "%", val)
  ruby = ruby.replace(/%.*?%/g, "")
  $(endpoint).find(".example.ruby textarea").text ruby

calculate_response = (endpoint, ignore_blank=false) ->
  blank = true
  $(endpoint).find("input.param").each (idx, param) ->
    unless $(param).val() is ""
      blank = false
      false
  if blank || ignore_blank
    short = short_accept($("#accept select").val())
    data = $(endpoint).find("input.sample." + short).val()
    $(endpoint).find(".example.http .response textarea").text data
  else
    $(endpoint).find(".example.http .response textarea").text ""

short_accept = (accept) ->
  switch accept
    when "application/json"
      "json"
    when "application/xml"
      "xml"
    else
      "unknown"

validate_params = (endpoint) ->
  valid = true
  $(endpoint).find("div.param").each (idx, param) ->
    if $(param).hasClass("required")
      input = $(param).find("input.param")
      if $(input).val() is ""
        $(input).css "background-color", "#fcc"
        valid = false
  valid

enable_status = (endpoint, status) ->
  $(endpoint).find(".status").css "display", "none"
  $(endpoint).find("." + status).css "display", "block"

full_uri_encode = (string) ->
  string = encodeURIComponent(string)
  string = string.replace(/\./g, "%2E")
  string

bottom = (element) ->
  $(element).offset().top + $(element).height()

switch_to_example = (example) ->
  $(".example_selector ." + current_example).removeClass "active"
  $(".example." + current_example).css "display", "none"
  $(".example_selector ." + example).addClass "active"
  $(".example." + example).css "display", "block"
  $.cookie "example", example,
    expires: 3650
  current_example = example
  diff = bottom("ul.sidebar") - bottom(".endpoint:last")
  $("ul.sidebar").css("marginTop", 0) if diff > 0

relocate_sidebar = (delay=500, duration=200) ->
  sidebar = $("ul.sidebar")
  scroll_top = $(document).scrollTop()
  sidebar_margin_top = (if (scroll_top < sidebar_top) then 0 else scroll_top - sidebar_top + 22)
  $(sidebar).clearQueue().stop().delay(delay).animate { marginTop: sidebar_margin_top }, { duration: duration }, ->
    true

$(window).ready ->
  $("input.execute").click (ev) ->
    button = ev.target
    endpoint = $(button).parents(".endpoint")
    apikey = $("#api_key input").val()
    return  unless validate_params(endpoint)
    action_and_params = action_and_params_for_endpoint(endpoint)
    calculate_request endpoint
    calculate_response endpoint, true
    enable_status endpoint, "spinner"
    $.ajax
      type: "POST"
      url: "/request"
      data:
        accept: $("#accept select").val()
        action: action_and_params.action
        params: flatten_params(action_and_params.params)
        apikey: apikey
      success: (data) ->
        enable_status endpoint, "success"
        $(endpoint).find(".response textarea").text data
        $(endpoint).find(".response textarea").css "color", "#9c9"
      error: (xhr, data) ->
        enable_status endpoint, "error"
        $(endpoint).find(".response textarea").text xhr.responseText
        $(endpoint).find(".response textarea").css "color", "#fcc"

  $("input.param").bind "keyup", (ev) ->
    endpoint = $(ev.target).parents(".endpoint")
    $(ev.target).css "background-color", "#fff"
    calculate_request endpoint
    calculate_response endpoint

  $("#api_key input").bind "change", (ev) ->
    $.cookie "apikey", $(ev.target).val(),
      expires: 3650

  $("#accept select").bind "change", (ev) ->
    $.cookie "accept", $(ev.target).val(),
      expires: 3650
    $(".endpoint").each ->
      calculate_request this
      calculate_response this

  $(".endpoint").each ->
    calculate_request this
    calculate_response this

  $(".example_selector li").bind "click", (ev) ->
    example = $(ev.target).attr("data-example")
    endpoint = $(ev.target).parents(".endpoint")
    old_relative_top = $(endpoint).offset().top - $(document).scrollTop()
    switch_to_example example
    new_relative_top = $(endpoint).offset().top - $(document).scrollTop()
    $(document).scrollTop $(document).scrollTop() + (new_relative_top - old_relative_top)

  $("#api_key input").val $.cookie("apikey")
  $("#accept select").val $.cookie("accept")

  switch_to_example $.cookie("example") or "http"

  $(window).scroll ->
    relocate_sidebar()

  sidebar_top = $("ul.sidebar").offset().top
