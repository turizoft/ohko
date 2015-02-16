((window) ->

  

  class ohko.PageableCollection extends Backbone.PageableCollection
    # Methods
    select_all: ->
      _.invoke(@models, 'set', 'selected', true)

    unselect_all: ->
      _.invoke(@models, 'set', 'selected', false)

    invert_selection: ->
      @each((model) -> model.set('selected', not model.get('selected')))

    fetch_options: ->
      if @sort_direction isnt 'none' 
        data: 
          sort_attribute: @sort_attribute
          sort_direction: @sort_direction

    sort_by: (attribute, direction) ->
      @sort_attribute = attribute
      @sort_direction = direction ? 'asc'
      @gotoFirstPage()

    toggle_sort: (attribute) ->
      if attribute is @sort_attribute
        @sort_direction = {'asc': 'desc', 'desc': 'none', 'none': 'asc'}[@sort_direction]
      else
        @sort_attribute = attribute
        @sort_direction = 'asc'

      @gotoFirstPage()

    # Overrides
    parseRecords: (resp, queryParams, state, options) ->
      resp.collection

    parseLinks: (resp, options) ->
      PARAM_TRIM_RE = /[\s'"]/g
      URL_TRIM_RE = /[<>\s'"]/g
      links = {}
      if resp.meta.links
        relations = ['first', 'prev', 'next']
        _.each resp.meta.links.split(','), (linkValue) ->
          linkParts = linkValue.split(';')
          url = linkParts[0].replace(URL_TRIM_RE, '')
          params = linkParts.slice(1)
          _.each params, (param) ->
            paramParts = param.split('=')
            key = paramParts[0].replace(PARAM_TRIM_RE, '')
            value = paramParts[1].replace(PARAM_TRIM_RE, '')
            links[value] = url  if key is 'rel' and _.contains(relations, value)
      links

    parseState: (resp, queryParams, state, options) ->
      totalRecords:
        resp.meta.total_entries
      totalPages:
        resp.meta.total_pages
      pageSize:
        resp.meta.page_size

    sync: (method, model, options) ->
      # Handle progressbar
      ohko.app.onProgressStart()
      _success = options.success

      options.success = (method, model, options) -> 
        _success?(method, model, options)
        ohko.app.onProgressEnd()

      super(method, model, options)

    gotoFirstPage: (op) ->
      _op = @fetch_options()
      _op.success = op?.success
      _op.error = op?.error
      @getFirstPage(_op)

    gotoNextPage: ->
      @getNextPage(@fetch_options())

    gotoPreviousPage: ->
      @getPreviousPage(@fetch_options())

    gotoPage: (page) ->
      @getPage(page, @fetch_options)



  window.ohko.PageableCollection = ohko.PageableCollection
  return
  
) window
