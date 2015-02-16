((window) ->

  

  class ohko.Collection extends Backbone.Collection

    # Methods
    select_all: ->
      _.invoke(@models, 'set', 'selected', true)

    unselect_all: ->
      _.invoke(@models, 'set', 'selected', false)

    invert_selection: ->
      @each((model) -> model.set('selected', not model.get('selected')))

    sort_by: (attribute, direction) ->
      @sort_attribute = attribute
      @sort_direction = direction ? 'asc'
      @comparator = attribute
      @sort()
      @set(@models.reverse(), {sort: false}) if @sort_direction is 'desc'
    
    toggle_sort: (attribute) ->
      direction = if attribute is @sort_attribute then {'asc': 'desc', 'desc': 'asc'}[@sort_direction] else 'asc'
      sort_by attribute, direction



  window.ohko.Collection = ohko.Collection
  return
  
) window
