((window) ->

  
  
  class ohko.Profile extends ohko.Model
    paramRoot: 'user'
    urlRoot: -> ohko.app.server_api 'user/profile'
    url: -> @urlRoot()
  
    initialize: ->
      @has_response_errors()

    defaults: ->
      # Attributes
      email: null
      username: null

      # Misc
      activation_state: null
      current_password: null
      password: null
      password_confirmation: null



  window.ohko.Profile = ohko.Profile
  return
  
) window