((window) ->

  

  class ohko.Navigation extends Backbone.Model
    hide_header_for: []
    hide_footer_for: ['all']
    hide_floating_button_for: ['all']
    keep_search_bar_for: []

    defaults: ->
      section: ''
      visible: true
      footer_visible: true
      floating_button_visible: true
      searching: false

    goto: (section) ->
      @set('section', section)
      @set('header_visible', @is_header_visible(section))
      @set('footer_visible', @is_footer_visible(section))
      @set('floating_button_visible', @is_floating_button_visible(section))
      if not @keep_search_bar(section)
        @set('searching', false)
        $(@get('search_box_selector')?).blur()

    # Hide header for some sections
    is_header_visible: (section) ->
      'all' not in @hide_header_for and section not in @hide_header_for

    # Hide footer for some sections
    is_footer_visible: (section) ->
      'all' not in @hide_footer_for and section not in @hide_footer_for

    # Hide floating button for some sections
    is_floating_button_visible: (section) ->
      'all' not in @hide_floating_button_for and section not in @hide_floating_button_for

    # Define whether search bar must be kept between transitions
    keep_search_bar: (section) ->
      section in @keep_search_bar_for

    
    
  window.ohko.Navigation = ohko.Navigation
  return
 
) window

