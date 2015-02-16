((window) ->

  

  class ohko.Session extends ohko.Model
    # Default routing for session (override if necesary)
    paramRoot: 'session'
    urlRoot: -> ohko.app.server_api 'sessions'

    initialize: ->
      @has_response_errors()

    defaults: ->
      # Attributes
      username: null
      password: null
      access_token: null
      remember_me: false
      authenticated: false
      redirect_url: null
      activation_state: 'pending'

    # Shorthands
    is_authenticated: -> @get('authenticated')
    is_active: ->  @get('activation_state') is 'active'
    logout: -> @set_authenticated false

    # Login
    set_authenticated: (authenticated, op = {}) ->
      @set('authenticated', authenticated)
      if authenticated
        @save_access_token(op.access_token)
        @save_activation_state(op.activation_state)
        
        ohko.app.current_user?.fetch()
      else
        @set('access_token', null)
        @delete_storage()
        ohko.app.current_user?.reset()

    login: (op = {}) ->
      op.success = (model, response, options) =>
        @set_authenticated true,
          access_token: response.access_token
          activation_state: response.activation_state

        @login_successful?()

      op.error = (model, response, options) =>
        @login_failed?()

      @save_model op

    # Storage
    get_storage: -> 
      if @get('remember_me') then localStorage else sessionStorage

    access_token_in_storage: ->
      @get_storage().getItem(ohko.app.access_token_name)?

    save_access_token: (token) ->
      @set('access_token', token)
      @get_storage().setItem(ohko.app.access_token_name, token)

    save_activation_state: (state) ->
      @set('activation_state', state)
      @get_storage().setItem('activation_state', state)

    try_to_restore_from_storage: ->
      if @access_token_in_storage()
        @set('remember_me', localStorage.getItem(ohko.app.access_token_name)?)
        @set_authenticated true, 
          access_token: @get_storage().getItem(ohko.app.access_token_name)
          activation_state: @get_storage().getItem('activation_state')

        @login_successful?()

    delete_storage: ->
      @get_storage().removeItem(ohko.app.access_token_name)
      @get_storage().removeItem('activation_state')

  

  window.ohko.Session = ohko.Session
  return
  
) window