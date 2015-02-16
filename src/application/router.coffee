((window) ->

  

  class ohko.Router extends Backbone.Router
    # Config
    skip_login_for: ['all']
    skip_activation_for: ['all']
    redirect_if_logged_in_for: []
    redirect_if_active_for: []
    cached_templates: []
    
    constructor: (options) ->
      super()

      # Default options
      @options = options if options?
      @options.redirect_after_login ?= false

      # Pages rendering
      @pages_container = $(@options.pages_container ? '#pages')  
      @page_container = $(@options.page_container ? '#page-container')  
      @z = 10
      @template_cache = {}
      @needs_render_template = true
      for i in @cached_templates
        @template_cache[i] = false
        @pages_container.append "<div class='page-cache hidden' id='cache_#{i}'></div>"

    # Fired always before any action
    before: (fragment, @action) ->
      # Redirects
      @redirect_if_logged_in(@action)
      @redirect_if_active(@action)

      # Requires
      @require_login(@action)
      @require_activation(@action)

      # Manage template cache
      @needs_render_template = if @action then not @template_cache[@action] else true
      @template_cache[@action] = true if @needs_render_template

      # Apply redirects
      @[@action]() if @skip_original_action

    # Fired always after any action
    after: ->
      $template_container = null

      $('.page-cache').addClass 'hidden'
      @page_container.addClass 'hidden'

      if @action in @cached_templates
        $template_container = $("#cache_#{@action}")
        $template_container.html @html if @needs_render_template
        $template_container.removeClass 'hidden'
      else
        @page_container.html @html
        @page_container.removeClass 'hidden'
      
      @html = null

      setTimeout (=>
        $('.page-cache .content').css('z-index', @z)
        @z = @z + 1
      ), 0

      # Update navigation
      ohko.app.navigation?.goto @action

      # Re-initialize js frameworks on new DOM
      ohko.app.call_frameworks(@page_container)

    # Other methods
    require_login: (action) ->
      if 'all' not in @skip_login_for and ohko.app.has_session
        if not ohko.app.session.is_authenticated() and action not in @skip_login_for
          @skip_original_action = true
          @navigate_to_login()

    require_activation: (action) ->
      if 'all' not in @skip_activation_for and ohko.app.has_session
        if not ohko.app.session.is_active() and action not in @skip_activation_for
          @skip_original_action = true
          @navigate_to_activation() 

    redirect_if_logged_in: (action) ->
      if ohko.app.session?.is_authenticated() and action in @redirect_if_logged_in_for
        @skip_original_action = true
        @navigate_to_home()

    redirect_if_active: (action) ->
      if ohko.app.session?.is_active() and action in @redirect_if_active_for
        @skip_original_action = true
        @navigate_to_home()

    logout: (op = {trigger: false, url: null}) ->
      ohko.app.session?.logout()
      @navigate_to_login()
      @sessions_new()

    needs_logging_out: ->
      setTimeout (=> @goto_unathorized(expired: true)), 500

    goto_unathorized: (op = {}) ->
      if ohko.app.has_session()?
        expired = op.expired ? false
        ohko.app.session.set 'redirect_url', "#{encodeURIComponent(window.location.hash)}" if @options.redirect_after_login
        @navigate @logout_path, trigger: true
        ohko.app.onSessionExpired()

    navigate_to_login: ->
      @navigate @options.login_path, trigger: false, replace: true
      @action = @options.login_action if @options.login_action?

    navigate_to_activation: ->
      @navigate @options.activation_path, trigger: false, replace: true
      @action = @options.activation_action if @options.activation_action?

    navigate_to_home: ->  
      @navigate @options.home_path, trigger: false, replace: true
      @action = @options.home_action if @options.home_action?


    
  window.ohko.Router = ohko.Router
  return
 
) window
