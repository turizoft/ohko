((window) ->

  

  class ohko.Application
    # Configuration
    constructor: (options = {}) ->
      ohko.app = this

      @server_url = options.server_url if options.server_url?
      @access_token_name = options.access_token_name if options.access_token_name?
      @set_global_timeout options.ajax_timeout ? 20000

    # Methods
    server: (path) -> "#{@server_url}/#{path}"
    server_api: (path) -> "#{@server_url}/api/#{path}"
    set_global_timeout: (time) -> $.ajaxSetup timeout: time

    has_session: -> @session?
    has_navigation: -> @navigation?
    has_router: -> @router?

    # Events
    onSessionExpired: -> return
    onProgressStart: ->
    onProgressEnd: ->

    # Actions
    call_frameworks: -> return
    show_alert: (message) -> alert message


    
  window.ohko.Application = ohko.Application
  return
 
) window

