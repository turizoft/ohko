((window) ->

  

  class ohko.ViewModel extends kb.ViewModel
    constructor: ->
      # Model errors bindings
      @errors = {} # Errors for models content
      @show_errors = {} # Show an error only if not empty
      @has_errors = {} # Does a model have an error?

    # kb.Observable bulk builder
    bind: (attributes, options = {}) ->
      for attribute in attributes
        attr = (("#{options.namespace}_" if options.namespace) ? '') + attribute
        @[attr] = kb.observable(options.from, attribute)

    bind_all: (options = {}) ->
      for attribute of options.from.attributes
        except = options.except || []
        if attribute not in except
          attr = (("#{options.namespace}_" if options.namespace) ? '') + attribute
          @[attr] = kb.observable(options.from, attribute)

    # Exposes a model attribute to a view through a view-model without binding it
    expose: (attributes, options ={}) ->
      for attribute in attributes
        attr = (("#{options.namespace}_" if options.namespace) ? '') + attribute
        @[attr] = -> options.from[attribute]

    # Errors binding
    bind_errors_for: (model, options = {}) ->
      ns = options.namespace
      @errors[ns] = ko.computed(-> kb.triggeredObservable(model, 'change sync')(); _.reduce(model.get('response_errors'), ((obj, error, key) -> obj[key] = error[0] ? ''; obj), {}))
      @show_errors[ns] = ko.computed(-> kb.triggeredObservable(model, 'change sync')(); _.reduce(model.get('response_errors'), ((obj, error, key) -> obj[key] = error[0]?; obj), {}))
      @has_errors[ns] = ko.computed(=> @errors[ns](); model.has_errors())

    # TODO: bind once

    # List setup
    indexes: (list, options) ->
      options.act_as ||= []
      
      # Make list deletable in a remote server
      ffn = options.filter_fn ? (-> true)
      filter_fn = (i) -> ffn(i) and if 'remote_deletable' in options.act_as then not i.get('_destroy') else true

      # Basic list indexing
      cn = options.collection ? 'items'
      @["#{cn}_l"] = list
      @[cn] = kb.collectionObservable(@["#{cn}_l"], {view_model: options.view_model, filters: filter_fn})
      @["#{cn}_changed"] = kb.triggeredObservable(@["#{cn}_l"], 'change sort add remove reset')
      @["#{cn}_empty"] = ko.computed(=> @["#{cn}_changed"](); !@["#{cn}_l"].length)
      @["total_#{cn}"] = ko.computed(=> @["#{cn}_changed"](); @["#{cn}_l"].length
      @["total_#{cn}_formatted"] = ko.computed(=> @["#{cn}_changed"](); numeral(@["#{cn}_l"].length).format('0a'))
      
      # Make list selectable
      if 'selectable' in options.act_as
        @["#{cn}_selected_count"] = ko.computed(=> @["#{cn}_changed"](); @["#{cn}_l"].where({selected : true}).length)
        @["#{cn}_selection_exists"] = ko.computed(=> @["#{cn}_selected_count"] > 0)
        @["#{cn}_selection_empty"] = ko.computed(=> @["#{cn}_selected_count"] == 0)
        @["select_all_#{cn}"] = -> @["#{cn}_l"].selectAll()
        @["unselect_all_#{cn}"] = -> @["#{cn}_l"].unselectAll()
        @["invert_#{cn}_selection"] = -> @["#{cn}_l"].invertSelection()

      # Make list paginable
      if 'paginable' in options.act_as
        col = @["#{cn}_l"].pageableCollection ? @["#{cn}_l"]
        @["#{cn}_has_next_page"] = ko.computed(=> @["#{cn}_changed"](); col.hasNextPage())
        @["#{cn}_has_prev_page"] = ko.computed(=> @["#{cn}_changed"](); col.hasPreviousPage())
        @["#{cn}_lower_bound"] = ko.computed(=> @["#{cn}_changed"](); (col.state.currentPage - 1) * col.state.pageSize + 1)
        @["#{cn}_upper_bound"] = ko.computed(=> @["#{cn}_changed"](); Math.min(col.state.currentPage * col.state.pageSize, col.state.totalRecords))
        @["#{cn}_total_items"] = ko.computed(=> @["#{cn}_changed"](); numeral(col.state.totalRecords).format('0a'))
        @["#{cn}_total_pages"] = ko.computed(=> @["#{cn}_changed"](); col.state.totalPages)
        @["#{cn}_current_page"] = ko.computed({
          read: => @["#{cn}_changed"](); col.state.currentPage
          write: (value) => col.gotoPage(parseInt(value))
        })
        @["on_prev_#{cn}_page"] = -> col.gotoPreviousPage()
        @["on_next_#{cn}_page"] = -> col.gotoNextPage()

      # Make list sortable
      if 'sortable' in options.act_as
        @["#{cn}_sort_attribute"] = ko.computed(=> @["#{cn}_changed"](); @["#{cn}_l"].sort_attribute)
        @["#{cn}_sort_direction"] = ko.computed(=> @["#{cn}_changed"](); @["#{cn}_l"].sort_direction)
        @["#{cn}_sorted_by"] = (attribute, direction) => ko.computed(=> @["#{cn}_changed"](); if @sort_attribute() is attribute then @sort_direction() is direction else direction is 'none')



  window.ohko.ViewModel = ohko.ViewModel
  return
  
) window