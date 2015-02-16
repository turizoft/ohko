((window) ->



  # Use backbone relational model as base 
  class ohko.Model extends Backbone.RelationalModel
    
    constructor: (attributes, options) ->
      super(attributes, options)

      # Make a backup of current attributes
      @previous_attributes = _.clone(@attributes)

      # Utility states
      @set 'selected', false
      @set 'saving', false
      @set 'loading', false
      @set '_destroy', false

      # Hooks
      @on 'change', => @unsaved = true
      @on 'sync', => @unsaved = false

      for relation in @getRelations()
        @on "add:#{relation.key}", (model) =>
          # Ensure that revert will not detach children
          if model.previous_attributes?[relation.reverseRelation.key?]
            delete model.previous_attributes[relation.reverseRelation.key]

          # Subscribe changes in children
          @listenTo model, 'change', => @unsaved = true

    # Generate errors placeholders
    # Bindings will expect them to exist, no matter if empty
    has_response_errors: ->
      @set('response_errors', {}, silent: true)
      for attr of @attributes
        @get('response_errors')[attr] = [] unless attr in ['id', 'saving', 'selected']

    # Reset a model to defaults
    reset: ->
      @set(_.clone @defaults())

    # Revert a model to previous status (last sync)
    revert: ->
      @set(@previous_attributes)
      @unsaved = false

      # Revert children
      for relation in @getRelations()
        if @get(relation.key)? && @get(relation.key).models?
          for model in @get(relation.key).models
            model.revert()

    # Reset model errors
    reset_errors: ->
      @set('response_errors', @defaults.response_errors)

      # Reset children errors
      for relation in @getRelations()
        if @get(relation.key)? && @get(relation.key).models?
          for model in @get(relation.key).models
            model.reset_errors()

    # Finds out if any model has any error
    has_errors: ->
      for _, error of @get('response_errors')
        unless error.length is 0
          return true
      return false

    # Add errors to model and children
    add_errors: (errors) ->
      # If model have children models
      if @getRelations()?
        # Loop through all keys and assign to children
        relations_keys = _.pluck @getRelations(), 'key'
        relations = @getRelations()
        for error_key, error_value of errors
          # If it is an association assign individual errors
          if error_key in relations_keys
            for array_key, array_value of error_value
              for collection_index, collection_value of array_value
                @get(error_key).models[collection_index].add_errors(collection_value)

            # Delete key so the parent doesn't receive it
            delete errors[error_key]

      # Finally add the remaining errors to parent
      @set('response_errors', errors)
      
    # Clone from another object without the id (thus relational safe)
    safe_clone_from: (source) ->
      attributes = _.clone(source.attributes)
      delete attributes['id']
      @set(attributes)

    # The model will autosave each x seconds
    autosaves: (op = {}) ->
      interval = op.interval ? 3000
      
      @on 'change', =>
        @unsaved = true
        clearTimeout(@countdown)

        # Dont trigger save if changed attributes are just extra attributes
        changed_attributes = @changedAttributes()
        unless Object.keys(changed_attributes).length is 1 and changed_attributes.saving?
          @countdown = setTimeout (=>
            @save_model progress: true
          ), interval

      @on 'sync', =>
        @unsaved = false
        clearTimeout(@countdown)

    # Fetch model
    fetch_model: (op = {}) ->
      ohko.app.onProgressStart()

      # Defaults
      delay = op.delay ? 0

      @set('loading', true)

      setTimeout (=> @fetch {
        success: =>
          # Call success if defined
          op.success?()

          @set('loading', false)

          # Call after if defined
          op.after?()

          ohko.app.onProgressEnd()
        error: =>
          # Call error if defined
          op.error?()

          @set('loading', false)

          # Call after if defined
          op.after?()

          # Show an error message
          ohko.app.show_alert op.error_message if op.error_message

          ohko.app.onProgressEnd()
      }), delay

    # Handle model saving and callbacks
    save_model: (op = {}) ->
      ohko.app.onProgressStart()

      # Defaults
      delay = op.delay ? 0

      if @unsaved
        @set('saving', true)

        # Call before_save if defined
        op.before?()
        
        # Attempt to save model
        setTimeout (=> @save null, {
          success: (model, response, options) =>
            # Show success message if defined
            ohko.app.show_alert op.success_message if op.success_message

            # Call success if defined
            op.success?(model, response, options)

            @set('saving', false)

            # Call after if defined
            op.after?()

            ohko.app.onProgressEnd()
          error: (model, response, options) =>
            # Show error message if defined
            ohko.app.show_alert op.error_message if op.error_message

            # Add server side errors to the model and children
            @add_errors(response.responseJSON?.errors)

            # Call error if defined
            op.error?(model)

            @set('saving', false)

            # Call after if defined
            op.after?()

            ohko.app.onProgressEnd()
        }), delay
      else
        # Show error message if defined
        ohko.app.show_alert op.not_changed_message if op.not_changed_message

        # Call not changed if defined
        op.not_changed?()
      
    # Handle model deleting and callbacks
    delete_model: (op = {}) ->
      ohko.app.onProgressStart()

      # Attempt to delete the model
      @destroy
        success: =>
          # Call success if defined
          op.success?()

          # Call after if defined
          op.after?()

          ohko.app.onProgressEnd()
        error: =>
          # Call error if defined
          op.error?()

          # Call after if defined
          op.after?()

          ohko.app.onProgressEnd()

    # Mark for deletion in a remote server
    mark_for_deletion: ->
      @set '_destroy', true

    # Static
    # Has many asociation shorthand
    @has_many: (key, options = {}) ->
      # Act like active record
      model = options.model
      # Initialize relation
      relation =
        type: Backbone.HasMany
        key: key
        keyDestination: "#{key}_attributes"
        relatedModel: model
        collectionType: "#{model}List"
        reverseRelation:
          includeInJSON: false
      # Use relation inverse if specified
      relation.reverseRelation.key = options?.inverse

      relation

    # Has one asociation shorthand
    @has_one: (key, options = {}) ->
      # Act like active record
      model = options.model
      # Initialize relation
      relation =
        type: Backbone.HasOne
        key: key
        keyDestination: "#{key}_attributes"
        relatedModel: model
        reverseRelation:
          includeInJSON: false
      # Use relation inverse if specified
      relation.reverseRelation.key = options?.inverse

      relation



  window.ohko.Model = ohko.Model
  return
 
) window