((window) ->

  

  class ohko.NavigationViewModel extends ohko.ViewModel
    constructor: ->
      super()

      # Observable attributes
      @bind ['header_visible', 'footer_visible', 'floating_button_visible', 'searching', 'section'], from: ohko.app.navigation
      @bind ['username'], from: ohko.app.current_user if ohko.app.has_session
      @floating_button_pressed = ko.observable(false)
      @floating_button_pressed_and_visible = ko.computed => @floating_button_pressed() and @floating_button_visible()

    section_tab_is: (section) ->
      @section() is section
     
    onOpenFloatingButton: (e) ->
      @floating_button_pressed(true)

    onCloseFloatingButton: (e) ->
      @floating_button_pressed(false)

    onToggleFloatingButton: ->
      @floating_button_pressed(not @floating_button_pressed())

    onBackHistory: -> window.history.back()

    onKeyPress: (d, e) ->
      if e.keyCode is 13
        @onSearch()
        $(ohko).blur()

      # Allow default action
      true


  window.ohko.NavigationViewModel = ohko.NavigationViewModel
  return
  
) window