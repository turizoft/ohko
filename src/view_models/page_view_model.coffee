((window) ->

  

  class ohko.PageViewModel extends ohko.ViewModel
    # Authentication
    is_authenticable: ->
      @bind ['authenticated'], from: ohko.app.session
      @bind ['username', 'full_name'], from: ohko.app.current_user, namespace: 'user'
      @current_user_changed = kb.triggeredObservable ohko.app.current_user, 'change'

    onBackHistory: -> window.history.back()


  window.ohko.PageViewModel = ohko.PageViewModel
  return
  
) window