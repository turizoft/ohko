# Configure backbone
_sync = Backbone.sync

clean_parameters = (key, object) ->
  delete object[key] if key in ['response_errors', 'saving', 'selected', 'loading'] or (key is '_destroy' and not object['_destroy'])
  if object[key] instanceof Array
    delete object[key] if object[key].length is 0

# Override sync
Backbone.sync = (method, model, options) ->
  # Serialize data, optionally using paramRoot
  if not options.data? and model and (method is 'create' or method is 'update' or method is 'patch')
    options.contentType = 'application/json'
    data = ''
    if model.paramRoot
      data = {}
      data[model.paramRoot] = model.toJSON(options)
      traverse_object data[model.paramRoot], clean_parameters
    else
      data = model.toJSON()
      traverse_object data, clean_parameters

    options.data = JSON.stringify(data)

  # Inject access token, TODO: add as option
  new_options = _.extend({
    beforeSend: (xhr) ->
      if ohko.app.has_session?
        token = ohko.app.session.get('access_token')
        token_header = "Token token=#{token}"
        xhr.setRequestHeader('Authorization', token_header) if ohko.app.session.is_authenticated()
  }, options)

  # Inject response error to models
  new_options.error = (resp) ->
    # Redirect if token was invalidated
    if resp.status is 401 and ohko.app.session?.is_authenticated()
      ohko.app.router?.needs_logging_out()
    
    options.error?(resp)

  # Call original sync
  _sync.call(this, method, model, new_options)


# Router callbacks
Backbone.Router::before = -> return

Backbone.Router::after = -> return

Backbone.Router::route = (route, name, callback) ->
  if !_.isRegExp(route)
    route = @_routeToRegExp(route)
  if _.isFunction(name)
    callback = name
    name = ''
  if !callback
    callback = @[name]
  router = this
  Backbone.history.route route, (fragment) ->
    args = router._extractParameters(route, fragment)
    router.render_action = true
    _arguments = [
      arguments[0]
      name
    ]
    router.before.apply router, _arguments
    if !router.skip_original_action
      callback and callback.apply(router, args)
    router.after.apply router, _arguments
    router.trigger.apply router, [ 'route:' + name ].concat(args)
    router.trigger 'route', name, args
    Backbone.history.trigger 'route', router, name, args
    return
  this