(function(window) {
  var ohko;
  ohko = (function() {
    function ohko() {}

    ohko.app = null;

    return ohko;

  })();
  window.ohko = ohko;
})(window);

var _base, _base1, _base2;

window.traverse_object = function(o, f) {
  var i, _results;
  _results = [];
  for (i in o) {
    f(i, o);
    if (o[i] instanceof Object) {
      _results.push(traverse_object(o[i], f));
    } else {
      _results.push(void 0);
    }
  }
  return _results;
};

if ((_base = String.prototype).startsWith == null) {
  _base.startsWith = function(s) {
    return this.slice(0, s.length) === s;
  };
}

if ((_base1 = String.prototype).endsWith == null) {
  _base1.endsWith = function(s) {
    return s === '' || this.slice(-s.length) === s;
  };
}

if ((_base2 = String.prototype).replaceAll == null) {
  _base2.replaceAll = function(s, r) {
    return this.split(s).join(r);
  };
}

var clean_parameters, _sync;

_sync = Backbone.sync;

clean_parameters = function(key, object) {
  if ((key === 'response_errors' || key === 'saving' || key === 'selected' || key === 'loading') || (key === '_destroy' && !object['_destroy'])) {
    delete object[key];
  }
  if (object[key] instanceof Array) {
    if (object[key].length === 0) {
      return delete object[key];
    }
  }
};

Backbone.sync = function(method, model, options) {
  var data, new_options;
  if ((options.data == null) && model && (method === 'create' || method === 'update' || method === 'patch')) {
    options.contentType = 'application/json';
    data = '';
    if (model.paramRoot) {
      data = {};
      data[model.paramRoot] = model.toJSON(options);
      traverse_object(data[model.paramRoot], clean_parameters);
    } else {
      data = model.toJSON();
      traverse_object(data, clean_parameters);
    }
    options.data = JSON.stringify(data);
  }
  new_options = _.extend({
    beforeSend: function(xhr) {
      var token, token_header;
      if (ohko.app.has_session != null) {
        token = ohko.app.session.get('access_token');
        token_header = "Token token=" + token;
        if (ohko.app.session.is_authenticated()) {
          return xhr.setRequestHeader('Authorization', token_header);
        }
      }
    }
  }, options);
  new_options.error = function(resp) {
    var _ref, _ref1;
    if (resp.status === 401 && ((_ref = ohko.app.session) != null ? _ref.is_authenticated() : void 0)) {
      if ((_ref1 = ohko.app.router) != null) {
        _ref1.needs_logging_out();
      }
    }
    return typeof options.error === "function" ? options.error(resp) : void 0;
  };
  return _sync.call(this, method, model, new_options);
};

Backbone.Router.prototype.before = function() {};

Backbone.Router.prototype.after = function() {};

Backbone.Router.prototype.route = function(route, name, callback) {
  var router;
  if (!_.isRegExp(route)) {
    route = this._routeToRegExp(route);
  }
  if (_.isFunction(name)) {
    callback = name;
    name = '';
  }
  if (!callback) {
    callback = this[name];
  }
  router = this;
  Backbone.history.route(route, function(fragment) {
    var args, _arguments;
    args = router._extractParameters(route, fragment);
    router.render_action = true;
    _arguments = [arguments[0], name];
    router.before.apply(router, _arguments);
    if (!router.skip_original_action) {
      callback && callback.apply(router, args);
    }
    router.after.apply(router, _arguments);
    router.trigger.apply(router, ['route:' + name].concat(args));
    router.trigger('route', name, args);
    Backbone.history.trigger('route', router, name, args);
  });
  return this;
};

var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

(function(window) {
  ohko.Model = (function(_super) {
    __extends(Model, _super);

    function Model(attributes, options) {
      var relation, _i, _len, _ref;
      Model.__super__.constructor.call(this, attributes, options);
      this.previous_attributes = _.clone(this.attributes);
      this.set('selected', false);
      this.set('saving', false);
      this.set('loading', false);
      this.set('_destroy', false);
      this.on('change', (function(_this) {
        return function() {
          return _this.unsaved = true;
        };
      })(this));
      this.on('sync', (function(_this) {
        return function() {
          return _this.unsaved = false;
        };
      })(this));
      _ref = this.getRelations();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        relation = _ref[_i];
        this.on("add:" + relation.key, (function(_this) {
          return function(model) {
            var _ref1;
            if ((_ref1 = model.previous_attributes) != null ? _ref1[relation.reverseRelation.key != null] : void 0) {
              delete model.previous_attributes[relation.reverseRelation.key];
            }
            return _this.listenTo(model, 'change', function() {
              return _this.unsaved = true;
            });
          };
        })(this));
      }
    }

    Model.prototype.has_response_errors = function() {
      var attr, _results;
      this.set('response_errors', {}, {
        silent: true
      });
      _results = [];
      for (attr in this.attributes) {
        if (attr !== 'id' && attr !== 'saving' && attr !== 'selected') {
          _results.push(this.get('response_errors')[attr] = []);
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    Model.prototype.reset = function() {
      return this.set(_.clone(this.defaults()));
    };

    Model.prototype.revert = function() {
      var model, relation, _i, _len, _ref, _results;
      this.set(this.previous_attributes);
      this.unsaved = false;
      _ref = this.getRelations();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        relation = _ref[_i];
        if ((this.get(relation.key) != null) && (this.get(relation.key).models != null)) {
          _results.push((function() {
            var _j, _len1, _ref1, _results1;
            _ref1 = this.get(relation.key).models;
            _results1 = [];
            for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
              model = _ref1[_j];
              _results1.push(model.revert());
            }
            return _results1;
          }).call(this));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    Model.prototype.reset_errors = function() {
      var model, relation, _i, _len, _ref, _results;
      this.set('response_errors', this.defaults.response_errors);
      _ref = this.getRelations();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        relation = _ref[_i];
        if ((this.get(relation.key) != null) && (this.get(relation.key).models != null)) {
          _results.push((function() {
            var _j, _len1, _ref1, _results1;
            _ref1 = this.get(relation.key).models;
            _results1 = [];
            for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
              model = _ref1[_j];
              _results1.push(model.reset_errors());
            }
            return _results1;
          }).call(this));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    Model.prototype.has_errors = function() {
      var error, _, _ref;
      _ref = this.get('response_errors');
      for (_ in _ref) {
        error = _ref[_];
        if (error.length !== 0) {
          return true;
        }
      }
      return false;
    };

    Model.prototype.add_errors = function(errors) {
      var array_key, array_value, collection_index, collection_value, error_key, error_value, relations, relations_keys;
      if (this.getRelations() != null) {
        relations_keys = _.pluck(this.getRelations(), 'key');
        relations = this.getRelations();
        for (error_key in errors) {
          error_value = errors[error_key];
          if (__indexOf.call(relations_keys, error_key) >= 0) {
            for (array_key in error_value) {
              array_value = error_value[array_key];
              for (collection_index in array_value) {
                collection_value = array_value[collection_index];
                this.get(error_key).models[collection_index].add_errors(collection_value);
              }
            }
            delete errors[error_key];
          }
        }
      }
      return this.set('response_errors', errors);
    };

    Model.prototype.safe_clone_from = function(source) {
      var attributes;
      attributes = _.clone(source.attributes);
      delete attributes['id'];
      return this.set(attributes);
    };

    Model.prototype.autosaves = function(op) {
      var interval, _ref;
      if (op == null) {
        op = {};
      }
      interval = (_ref = op.interval) != null ? _ref : 3000;
      this.on('change', (function(_this) {
        return function() {
          var changed_attributes;
          _this.unsaved = true;
          clearTimeout(_this.countdown);
          changed_attributes = _this.changedAttributes();
          if (!(Object.keys(changed_attributes).length === 1 && (changed_attributes.saving != null))) {
            return _this.countdown = setTimeout((function() {
              return _this.save_model({
                progress: true
              });
            }), interval);
          }
        };
      })(this));
      return this.on('sync', (function(_this) {
        return function() {
          _this.unsaved = false;
          return clearTimeout(_this.countdown);
        };
      })(this));
    };

    Model.prototype.fetch_model = function(op) {
      var delay, _ref;
      if (op == null) {
        op = {};
      }
      ohko.app.onProgressStart();
      delay = (_ref = op.delay) != null ? _ref : 0;
      this.set('loading', true);
      return setTimeout(((function(_this) {
        return function() {
          return _this.fetch({
            success: function() {
              if (typeof op.success === "function") {
                op.success();
              }
              _this.set('loading', false);
              if (typeof op.after === "function") {
                op.after();
              }
              return ohko.app.onProgressEnd();
            },
            error: function() {
              if (typeof op.error === "function") {
                op.error();
              }
              _this.set('loading', false);
              if (typeof op.after === "function") {
                op.after();
              }
              if (op.error_message) {
                ohko.app.show_alert(op.error_message);
              }
              return ohko.app.onProgressEnd();
            }
          });
        };
      })(this)), delay);
    };

    Model.prototype.save_model = function(op) {
      var delay, _ref;
      if (op == null) {
        op = {};
      }
      ohko.app.onProgressStart();
      delay = (_ref = op.delay) != null ? _ref : 0;
      if (this.unsaved) {
        this.set('saving', true);
        if (typeof op.before === "function") {
          op.before();
        }
        return setTimeout(((function(_this) {
          return function() {
            return _this.save(null, {
              success: function(model, response, options) {
                if (op.success_message) {
                  ohko.app.show_alert(op.success_message);
                }
                if (typeof op.success === "function") {
                  op.success(model, response, options);
                }
                _this.set('saving', false);
                if (typeof op.after === "function") {
                  op.after();
                }
                return ohko.app.onProgressEnd();
              },
              error: function(model, response, options) {
                var _ref1;
                if (op.error_message) {
                  ohko.app.show_alert(op.error_message);
                }
                _this.add_errors((_ref1 = response.responseJSON) != null ? _ref1.errors : void 0);
                if (typeof op.error === "function") {
                  op.error(model);
                }
                _this.set('saving', false);
                if (typeof op.after === "function") {
                  op.after();
                }
                return ohko.app.onProgressEnd();
              }
            });
          };
        })(this)), delay);
      } else {
        if (op.not_changed_message) {
          ohko.app.show_alert(op.not_changed_message);
        }
        return typeof op.not_changed === "function" ? op.not_changed() : void 0;
      }
    };

    Model.prototype.delete_model = function(op) {
      if (op == null) {
        op = {};
      }
      ohko.app.onProgressStart();
      return this.destroy({
        success: (function(_this) {
          return function() {
            if (typeof op.success === "function") {
              op.success();
            }
            if (typeof op.after === "function") {
              op.after();
            }
            return ohko.app.onProgressEnd();
          };
        })(this),
        error: (function(_this) {
          return function() {
            if (typeof op.error === "function") {
              op.error();
            }
            if (typeof op.after === "function") {
              op.after();
            }
            return ohko.app.onProgressEnd();
          };
        })(this)
      });
    };

    Model.prototype.mark_for_deletion = function() {
      return this.set('_destroy', true);
    };

    Model.has_many = function(key, options) {
      var model, relation;
      if (options == null) {
        options = {};
      }
      model = options.model;
      relation = {
        type: Backbone.HasMany,
        key: key,
        keyDestination: "" + key + "_attributes",
        relatedModel: model,
        collectionType: "" + model + "List",
        reverseRelation: {
          includeInJSON: false
        }
      };
      relation.reverseRelation.key = options != null ? options.inverse : void 0;
      return relation;
    };

    Model.has_one = function(key, options) {
      var model, relation;
      if (options == null) {
        options = {};
      }
      model = options.model;
      relation = {
        type: Backbone.HasOne,
        key: key,
        keyDestination: "" + key + "_attributes",
        relatedModel: model,
        reverseRelation: {
          includeInJSON: false
        }
      };
      relation.reverseRelation.key = options != null ? options.inverse : void 0;
      return relation;
    };

    return Model;

  })(Backbone.RelationalModel);
  window.ohko.Model = ohko.Model;
})(window);

var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

(function(window) {
  ohko.Collection = (function(_super) {
    __extends(Collection, _super);

    function Collection() {
      return Collection.__super__.constructor.apply(this, arguments);
    }

    Collection.prototype.select_all = function() {
      return _.invoke(this.models, 'set', 'selected', true);
    };

    Collection.prototype.unselect_all = function() {
      return _.invoke(this.models, 'set', 'selected', false);
    };

    Collection.prototype.invert_selection = function() {
      return this.each(function(model) {
        return model.set('selected', !model.get('selected'));
      });
    };

    Collection.prototype.sort_by = function(attribute, direction) {
      this.sort_attribute = attribute;
      this.sort_direction = direction != null ? direction : 'asc';
      this.comparator = attribute;
      this.sort();
      if (this.sort_direction === 'desc') {
        return this.set(this.models.reverse(), {
          sort: false
        });
      }
    };

    Collection.prototype.toggle_sort = function(attribute) {
      var direction;
      direction = attribute === this.sort_attribute ? {
        'asc': 'desc',
        'desc': 'asc'
      }[this.sort_direction] : 'asc';
      return sort_by(attribute, direction);
    };

    return Collection;

  })(Backbone.Collection);
  window.ohko.Collection = ohko.Collection;
})(window);

var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

(function(window) {
  ohko.PageableCollection = (function(_super) {
    __extends(PageableCollection, _super);

    function PageableCollection() {
      return PageableCollection.__super__.constructor.apply(this, arguments);
    }

    PageableCollection.prototype.select_all = function() {
      return _.invoke(this.models, 'set', 'selected', true);
    };

    PageableCollection.prototype.unselect_all = function() {
      return _.invoke(this.models, 'set', 'selected', false);
    };

    PageableCollection.prototype.invert_selection = function() {
      return this.each(function(model) {
        return model.set('selected', !model.get('selected'));
      });
    };

    PageableCollection.prototype.fetch_options = function() {
      if (this.sort_direction !== 'none') {
        return {
          data: {
            sort_attribute: this.sort_attribute,
            sort_direction: this.sort_direction
          }
        };
      }
    };

    PageableCollection.prototype.sort_by = function(attribute, direction) {
      this.sort_attribute = attribute;
      this.sort_direction = direction != null ? direction : 'asc';
      return this.gotoFirstPage();
    };

    PageableCollection.prototype.toggle_sort = function(attribute) {
      if (attribute === this.sort_attribute) {
        this.sort_direction = {
          'asc': 'desc',
          'desc': 'none',
          'none': 'asc'
        }[this.sort_direction];
      } else {
        this.sort_attribute = attribute;
        this.sort_direction = 'asc';
      }
      return this.gotoFirstPage();
    };

    PageableCollection.prototype.parseRecords = function(resp, queryParams, state, options) {
      return resp.collection;
    };

    PageableCollection.prototype.parseLinks = function(resp, options) {
      var PARAM_TRIM_RE, URL_TRIM_RE, links, relations;
      PARAM_TRIM_RE = /[\s'"]/g;
      URL_TRIM_RE = /[<>\s'"]/g;
      links = {};
      if (resp.meta.links) {
        relations = ['first', 'prev', 'next'];
        _.each(resp.meta.links.split(','), function(linkValue) {
          var linkParts, params, url;
          linkParts = linkValue.split(';');
          url = linkParts[0].replace(URL_TRIM_RE, '');
          params = linkParts.slice(1);
          return _.each(params, function(param) {
            var key, paramParts, value;
            paramParts = param.split('=');
            key = paramParts[0].replace(PARAM_TRIM_RE, '');
            value = paramParts[1].replace(PARAM_TRIM_RE, '');
            if (key === 'rel' && _.contains(relations, value)) {
              return links[value] = url;
            }
          });
        });
      }
      return links;
    };

    PageableCollection.prototype.parseState = function(resp, queryParams, state, options) {
      return {
        totalRecords: resp.meta.total_entries,
        totalPages: resp.meta.total_pages,
        pageSize: resp.meta.page_size
      };
    };

    PageableCollection.prototype.sync = function(method, model, options) {
      var _success;
      ohko.app.onProgressStart();
      _success = options.success;
      options.success = function(method, model, options) {
        if (typeof _success === "function") {
          _success(method, model, options);
        }
        return ohko.app.onProgressEnd();
      };
      return PageableCollection.__super__.sync.call(this, method, model, options);
    };

    PageableCollection.prototype.gotoFirstPage = function(op) {
      var _op;
      _op = this.fetch_options();
      _op.success = op != null ? op.success : void 0;
      _op.error = op != null ? op.error : void 0;
      return this.getFirstPage(_op);
    };

    PageableCollection.prototype.gotoNextPage = function() {
      return this.getNextPage(this.fetch_options());
    };

    PageableCollection.prototype.gotoPreviousPage = function() {
      return this.getPreviousPage(this.fetch_options());
    };

    PageableCollection.prototype.gotoPage = function(page) {
      return this.getPage(page, this.fetch_options);
    };

    return PageableCollection;

  })(Backbone.PageableCollection);
  window.ohko.PageableCollection = ohko.PageableCollection;
})(window);

var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

(function(window) {
  ohko.Session = (function(_super) {
    __extends(Session, _super);

    function Session() {
      return Session.__super__.constructor.apply(this, arguments);
    }

    Session.prototype.paramRoot = 'session';

    Session.prototype.urlRoot = function() {
      return ohko.app.server_api('sessions');
    };

    Session.prototype.initialize = function() {
      return this.has_response_errors();
    };

    Session.prototype.defaults = function() {
      return {
        username: null,
        password: null,
        access_token: null,
        remember_me: false,
        authenticated: false,
        redirect_url: null,
        activation_state: 'pending'
      };
    };

    Session.prototype.is_authenticated = function() {
      return this.get('authenticated');
    };

    Session.prototype.is_active = function() {
      return this.get('activation_state') === 'active';
    };

    Session.prototype.logout = function() {
      return this.set_authenticated(false);
    };

    Session.prototype.set_authenticated = function(authenticated, op) {
      var _ref, _ref1;
      if (op == null) {
        op = {};
      }
      this.set('authenticated', authenticated);
      if (authenticated) {
        this.save_access_token(op.access_token);
        this.save_activation_state(op.activation_state);
        return (_ref = ohko.app.current_user) != null ? _ref.fetch() : void 0;
      } else {
        this.set('access_token', null);
        this.delete_storage();
        return (_ref1 = ohko.app.current_user) != null ? _ref1.reset() : void 0;
      }
    };

    Session.prototype.login = function(op) {
      if (op == null) {
        op = {};
      }
      op.success = (function(_this) {
        return function(model, response, options) {
          _this.set_authenticated(true, {
            access_token: response.access_token,
            activation_state: response.activation_state
          });
          return typeof _this.login_successful === "function" ? _this.login_successful() : void 0;
        };
      })(this);
      op.error = (function(_this) {
        return function(model, response, options) {
          return typeof _this.login_failed === "function" ? _this.login_failed() : void 0;
        };
      })(this);
      return this.save_model(op);
    };

    Session.prototype.get_storage = function() {
      if (this.get('remember_me')) {
        return localStorage;
      } else {
        return sessionStorage;
      }
    };

    Session.prototype.access_token_in_storage = function() {
      return this.get_storage().getItem(ohko.app.access_token_name) != null;
    };

    Session.prototype.save_access_token = function(token) {
      this.set('access_token', token);
      return this.get_storage().setItem(ohko.app.access_token_name, token);
    };

    Session.prototype.save_activation_state = function(state) {
      this.set('activation_state', state);
      return this.get_storage().setItem('activation_state', state);
    };

    Session.prototype.try_to_restore_from_storage = function() {
      if (this.access_token_in_storage()) {
        this.set('remember_me', localStorage.getItem(ohko.app.access_token_name) != null);
        this.set_authenticated(true, {
          access_token: this.get_storage().getItem(ohko.app.access_token_name),
          activation_state: this.get_storage().getItem('activation_state')
        });
        return typeof this.login_successful === "function" ? this.login_successful() : void 0;
      }
    };

    Session.prototype.delete_storage = function() {
      this.get_storage().removeItem(ohko.app.access_token_name);
      return this.get_storage().removeItem('activation_state');
    };

    return Session;

  })(ohko.Model);
  window.ohko.Session = ohko.Session;
})(window);

(function(window) {
  ohko.Application = (function() {
    function Application(options) {
      var _ref;
      if (options == null) {
        options = {};
      }
      ohko.app = this;
      if (options.server_url != null) {
        this.server_url = options.server_url;
      }
      if (options.access_token_name != null) {
        this.access_token_name = options.access_token_name;
      }
      this.set_global_timeout((_ref = options.ajax_timeout) != null ? _ref : 20000);
    }

    Application.prototype.server = function(path) {
      return "" + this.server_url + "/" + path;
    };

    Application.prototype.server_api = function(path) {
      return "" + this.server_url + "/api/" + path;
    };

    Application.prototype.set_global_timeout = function(time) {
      return $.ajaxSetup({
        timeout: time
      });
    };

    Application.prototype.has_session = function() {
      return this.session != null;
    };

    Application.prototype.has_navigation = function() {
      return this.navigation != null;
    };

    Application.prototype.has_router = function() {
      return this.router != null;
    };

    Application.prototype.onSessionExpired = function() {};

    Application.prototype.onProgressStart = function() {};

    Application.prototype.onProgressEnd = function() {};

    Application.prototype.call_frameworks = function() {};

    Application.prototype.show_alert = function(message) {
      return alert(message);
    };

    return Application;

  })();
  window.ohko.Application = ohko.Application;
})(window);

var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

(function(window) {
  ohko.Router = (function(_super) {
    __extends(Router, _super);

    Router.prototype.skip_login_for = ['all'];

    Router.prototype.skip_activation_for = ['all'];

    Router.prototype.redirect_if_logged_in_for = [];

    Router.prototype.redirect_if_active_for = [];

    Router.prototype.cached_templates = [];

    function Router(options) {
      var i, _base, _i, _len, _ref, _ref1, _ref2;
      Router.__super__.constructor.call(this);
      if (options != null) {
        this.options = options;
      }
      if ((_base = this.options).redirect_after_login == null) {
        _base.redirect_after_login = false;
      }
      this.pages_container = $((_ref = this.options.pages_container) != null ? _ref : '#pages');
      this.page_container = $((_ref1 = this.options.page_container) != null ? _ref1 : '#page-container');
      this.z = 10;
      this.template_cache = {};
      this.needs_render_template = true;
      _ref2 = this.cached_templates;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        i = _ref2[_i];
        this.template_cache[i] = false;
        this.pages_container.append("<div class='page-cache hidden' id='cache_" + i + "'></div>");
      }
    }

    Router.prototype.before = function(fragment, action) {
      this.action = action;
      this.redirect_if_logged_in(this.action);
      this.redirect_if_active(this.action);
      this.require_login(this.action);
      this.require_activation(this.action);
      this.needs_render_template = this.action ? !this.template_cache[this.action] : true;
      if (this.needs_render_template) {
        this.template_cache[this.action] = true;
      }
      if (this.skip_original_action) {
        return this[this.action]();
      }
    };

    Router.prototype.after = function() {
      var $template_container, _ref, _ref1;
      $template_container = null;
      $('.page-cache').addClass('hidden');
      this.page_container.addClass('hidden');
      if (_ref = this.action, __indexOf.call(this.cached_templates, _ref) >= 0) {
        $template_container = $("#cache_" + this.action);
        if (this.needs_render_template) {
          $template_container.html(this.html);
        }
        $template_container.removeClass('hidden');
      } else {
        this.page_container.html(this.html);
        this.page_container.removeClass('hidden');
      }
      this.html = null;
      setTimeout(((function(_this) {
        return function() {
          $('.page-cache .content').css('z-index', _this.z);
          return _this.z = _this.z + 1;
        };
      })(this)), 0);
      if ((_ref1 = ohko.app.navigation) != null) {
        _ref1.goto(this.action);
      }
      return ohko.app.call_frameworks(this.page_container);
    };

    Router.prototype.require_login = function(action) {
      if (__indexOf.call(this.skip_login_for, 'all') < 0 && ohko.app.has_session) {
        if (!ohko.app.session.is_authenticated() && __indexOf.call(this.skip_login_for, action) < 0) {
          this.skip_original_action = true;
          return this.navigate_to_login();
        }
      }
    };

    Router.prototype.require_activation = function(action) {
      if (__indexOf.call(this.skip_activation_for, 'all') < 0 && ohko.app.has_session) {
        if (!ohko.app.session.is_active() && __indexOf.call(this.skip_activation_for, action) < 0) {
          this.skip_original_action = true;
          return this.navigate_to_activation();
        }
      }
    };

    Router.prototype.redirect_if_logged_in = function(action) {
      var _ref;
      if (((_ref = ohko.app.session) != null ? _ref.is_authenticated() : void 0) && __indexOf.call(this.redirect_if_logged_in_for, action) >= 0) {
        this.skip_original_action = true;
        return this.navigate_to_home();
      }
    };

    Router.prototype.redirect_if_active = function(action) {
      var _ref;
      if (((_ref = ohko.app.session) != null ? _ref.is_active() : void 0) && __indexOf.call(this.redirect_if_active_for, action) >= 0) {
        this.skip_original_action = true;
        return this.navigate_to_home();
      }
    };

    Router.prototype.logout = function(op) {
      var _ref;
      if (op == null) {
        op = {
          trigger: false,
          url: null
        };
      }
      if ((_ref = ohko.app.session) != null) {
        _ref.logout();
      }
      this.navigate_to_login();
      return this.sessions_new();
    };

    Router.prototype.needs_logging_out = function() {
      return setTimeout(((function(_this) {
        return function() {
          return _this.goto_unathorized({
            expired: true
          });
        };
      })(this)), 500);
    };

    Router.prototype.goto_unathorized = function(op) {
      var expired, _ref;
      if (op == null) {
        op = {};
      }
      if (ohko.app.has_session() != null) {
        expired = (_ref = op.expired) != null ? _ref : false;
        if (this.options.redirect_after_login) {
          ohko.app.session.set('redirect_url', "" + (encodeURIComponent(window.location.hash)));
        }
        this.navigate(this.logout_path, {
          trigger: true
        });
        return ohko.app.onSessionExpired();
      }
    };

    Router.prototype.navigate_to_login = function() {
      this.navigate(this.options.login_path, {
        trigger: false,
        replace: true
      });
      if (this.options.login_action != null) {
        return this.action = this.options.login_action;
      }
    };

    Router.prototype.navigate_to_activation = function() {
      this.navigate(this.options.activation_path, {
        trigger: false,
        replace: true
      });
      if (this.options.activation_action != null) {
        return this.action = this.options.activation_action;
      }
    };

    Router.prototype.navigate_to_home = function() {
      this.navigate(this.options.home_path, {
        trigger: false,
        replace: true
      });
      if (this.options.home_action != null) {
        return this.action = this.options.home_action;
      }
    };

    return Router;

  })(Backbone.Router);
  window.ohko.Router = ohko.Router;
})(window);

var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

(function(window) {
  ohko.Profile = (function(_super) {
    __extends(Profile, _super);

    function Profile() {
      return Profile.__super__.constructor.apply(this, arguments);
    }

    Profile.prototype.paramRoot = 'user';

    Profile.prototype.urlRoot = function() {
      return ohko.app.server_api('user/profile');
    };

    Profile.prototype.url = function() {
      return this.urlRoot();
    };

    Profile.prototype.initialize = function() {
      return this.has_response_errors();
    };

    Profile.prototype.defaults = function() {
      return {
        email: null,
        username: null,
        activation_state: null,
        current_password: null,
        password: null,
        password_confirmation: null
      };
    };

    return Profile;

  })(ohko.Model);
  window.ohko.Profile = ohko.Profile;
})(window);

var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

(function(window) {
  ohko.Navigation = (function(_super) {
    __extends(Navigation, _super);

    function Navigation() {
      return Navigation.__super__.constructor.apply(this, arguments);
    }

    Navigation.prototype.hide_header_for = [];

    Navigation.prototype.hide_footer_for = ['all'];

    Navigation.prototype.hide_floating_button_for = ['all'];

    Navigation.prototype.keep_search_bar_for = [];

    Navigation.prototype.defaults = function() {
      return {
        section: '',
        visible: true,
        footer_visible: true,
        floating_button_visible: true,
        searching: false
      };
    };

    Navigation.prototype.goto = function(section) {
      this.set('section', section);
      this.set('header_visible', this.is_header_visible(section));
      this.set('footer_visible', this.is_footer_visible(section));
      this.set('floating_button_visible', this.is_floating_button_visible(section));
      if (!this.keep_search_bar(section)) {
        this.set('searching', false);
        return $(this.get('search_box_selector') != null).blur();
      }
    };

    Navigation.prototype.is_header_visible = function(section) {
      return __indexOf.call(this.hide_header_for, 'all') < 0 && __indexOf.call(this.hide_header_for, section) < 0;
    };

    Navigation.prototype.is_footer_visible = function(section) {
      return __indexOf.call(this.hide_footer_for, 'all') < 0 && __indexOf.call(this.hide_footer_for, section) < 0;
    };

    Navigation.prototype.is_floating_button_visible = function(section) {
      return __indexOf.call(this.hide_floating_button_for, 'all') < 0 && __indexOf.call(this.hide_floating_button_for, section) < 0;
    };

    Navigation.prototype.keep_search_bar = function(section) {
      return __indexOf.call(this.keep_search_bar_for, section) >= 0;
    };

    return Navigation;

  })(Backbone.Model);
  window.ohko.Navigation = ohko.Navigation;
})(window);

var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

(function(window) {
  ohko.ViewModel = (function(_super) {
    __extends(ViewModel, _super);

    function ViewModel() {
      this.errors = {};
      this.show_errors = {};
      this.has_errors = {};
    }

    ViewModel.prototype.bind = function(attributes, options) {
      var attr, attribute, _i, _len, _ref, _results;
      if (options == null) {
        options = {};
      }
      _results = [];
      for (_i = 0, _len = attributes.length; _i < _len; _i++) {
        attribute = attributes[_i];
        attr = ((_ref = (options.namespace ? "" + options.namespace + "_" : void 0)) != null ? _ref : '') + attribute;
        _results.push(this[attr] = kb.observable(options.from, attribute));
      }
      return _results;
    };

    ViewModel.prototype.bind_all = function(options) {
      var attr, attribute, except, _ref, _results;
      if (options == null) {
        options = {};
      }
      _results = [];
      for (attribute in options.from.attributes) {
        except = options.except || [];
        if (__indexOf.call(except, attribute) < 0) {
          attr = ((_ref = (options.namespace ? "" + options.namespace + "_" : void 0)) != null ? _ref : '') + attribute;
          _results.push(this[attr] = kb.observable(options.from, attribute));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    ViewModel.prototype.expose = function(attributes, options) {
      var attr, attribute, _i, _len, _ref, _results;
      if (options == null) {
        options = {};
      }
      _results = [];
      for (_i = 0, _len = attributes.length; _i < _len; _i++) {
        attribute = attributes[_i];
        attr = ((_ref = (options.namespace ? "" + options.namespace + "_" : void 0)) != null ? _ref : '') + attribute;
        _results.push(this[attr] = function() {
          return options.from[attribute];
        });
      }
      return _results;
    };

    ViewModel.prototype.bind_errors_for = function(model, options) {
      var ns;
      if (options == null) {
        options = {};
      }
      ns = options.namespace;
      this.errors[ns] = ko.computed(function() {
        kb.triggeredObservable(model, 'change sync')();
        return _.reduce(model.get('response_errors'), (function(obj, error, key) {
          var _ref;
          obj[key] = (_ref = error[0]) != null ? _ref : '';
          return obj;
        }), {});
      });
      this.show_errors[ns] = ko.computed(function() {
        kb.triggeredObservable(model, 'change sync')();
        return _.reduce(model.get('response_errors'), (function(obj, error, key) {
          obj[key] = error[0] != null;
          return obj;
        }), {});
      });
      return this.has_errors[ns] = ko.computed((function(_this) {
        return function() {
          _this.errors[ns]();
          return model.has_errors();
        };
      })(this));
    };

    ViewModel.prototype.indexes = function(list, options) {
      var cn, col, ffn, filter_fn, _ref, _ref1, _ref2;
      options.act_as || (options.act_as = []);
      ffn = (_ref = options.filter_fn) != null ? _ref : (function() {
        return true;
      });
      filter_fn = function(i) {
        return ffn(i) && (__indexOf.call(options.act_as, 'remote_deletable') >= 0 ? !i.get('_destroy') : true);
      };
      cn = (_ref1 = options.collection) != null ? _ref1 : 'items';
      this["" + cn + "_l"] = list;
      this[cn] = kb.collectionObservable(this["" + cn + "_l"], {
        view_model: options.view_model,
        filters: filter_fn
      });
      this["" + cn + "_changed"] = kb.triggeredObservable(this["" + cn + "_l"], 'change sort add remove reset');
      this["" + cn + "_empty"] = ko.computed((function(_this) {
        return function() {
          _this["" + cn + "_changed"]();
          return !_this["" + cn + "_l"].length;
        };
      })(this));
      this["total_" + cn] = ko.computed((function(_this) {
        return function() {
          _this["" + cn + "_changed"]();
          return numeral(_this["" + cn + "_l"].length).format('0a');
        };
      })(this));
      if (__indexOf.call(options.act_as, 'selectable') >= 0) {
        this["" + cn + "_selected_count"] = ko.computed((function(_this) {
          return function() {
            _this["" + cn + "_changed"]();
            return _this["" + cn + "_l"].where({
              selected: true
            }).length;
          };
        })(this));
        this["" + cn + "_selection_exists"] = ko.computed((function(_this) {
          return function() {
            return _this["" + cn + "_selected_count"] > 0;
          };
        })(this));
        this["" + cn + "_selection_empty"] = ko.computed((function(_this) {
          return function() {
            return _this["" + cn + "_selected_count"] === 0;
          };
        })(this));
        this["select_all_" + cn] = function() {
          return this["" + cn + "_l"].selectAll();
        };
        this["unselect_all_" + cn] = function() {
          return this["" + cn + "_l"].unselectAll();
        };
        this["invert_" + cn + "_selection"] = function() {
          return this["" + cn + "_l"].invertSelection();
        };
      }
      if (__indexOf.call(options.act_as, 'paginable') >= 0) {
        col = (_ref2 = this["" + cn + "_l"].pageableCollection) != null ? _ref2 : this["" + cn + "_l"];
        this["" + cn + "_has_next_page"] = ko.computed((function(_this) {
          return function() {
            _this["" + cn + "_changed"]();
            return col.hasNextPage();
          };
        })(this));
        this["" + cn + "_has_prev_page"] = ko.computed((function(_this) {
          return function() {
            _this["" + cn + "_changed"]();
            return col.hasPreviousPage();
          };
        })(this));
        this["" + cn + "_lower_bound"] = ko.computed((function(_this) {
          return function() {
            _this["" + cn + "_changed"]();
            return (col.state.currentPage - 1) * col.state.pageSize + 1;
          };
        })(this));
        this["" + cn + "_upper_bound"] = ko.computed((function(_this) {
          return function() {
            _this["" + cn + "_changed"]();
            return Math.min(col.state.currentPage * col.state.pageSize, col.state.totalRecords);
          };
        })(this));
        this["" + cn + "_total_items"] = ko.computed((function(_this) {
          return function() {
            _this["" + cn + "_changed"]();
            return numeral(col.state.totalRecords).format('0a');
          };
        })(this));
        this["" + cn + "_total_pages"] = ko.computed((function(_this) {
          return function() {
            _this["" + cn + "_changed"]();
            return col.state.totalPages;
          };
        })(this));
        this["" + cn + "_current_page"] = ko.computed({
          read: (function(_this) {
            return function() {
              _this["" + cn + "_changed"]();
              return col.state.currentPage;
            };
          })(this),
          write: (function(_this) {
            return function(value) {
              return col.gotoPage(parseInt(value));
            };
          })(this)
        });
        this["on_prev_" + cn + "_page"] = function() {
          return col.gotoPreviousPage();
        };
        this["on_next_" + cn + "_page"] = function() {
          return col.gotoNextPage();
        };
      }
      if (__indexOf.call(options.act_as, 'sortable') >= 0) {
        this["" + cn + "_sort_attribute"] = ko.computed((function(_this) {
          return function() {
            _this["" + cn + "_changed"]();
            return _this["" + cn + "_l"].sort_attribute;
          };
        })(this));
        this["" + cn + "_sort_direction"] = ko.computed((function(_this) {
          return function() {
            _this["" + cn + "_changed"]();
            return _this["" + cn + "_l"].sort_direction;
          };
        })(this));
        return this["" + cn + "_sorted_by"] = (function(_this) {
          return function(attribute, direction) {
            return ko.computed(function() {
              _this["" + cn + "_changed"]();
              if (_this.sort_attribute() === attribute) {
                return _this.sort_direction() === direction;
              } else {
                return direction === 'none';
              }
            });
          };
        })(this);
      }
    };

    return ViewModel;

  })(kb.ViewModel);
  window.ohko.ViewModel = ohko.ViewModel;
})(window);

var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

(function(window) {
  ohko.NavigationViewModel = (function(_super) {
    __extends(NavigationViewModel, _super);

    function NavigationViewModel() {
      NavigationViewModel.__super__.constructor.call(this);
      this.bind(['header_visible', 'footer_visible', 'floating_button_visible', 'searching', 'section'], {
        from: ohko.app.navigation
      });
      if (ohko.app.has_session) {
        this.bind(['username'], {
          from: ohko.app.current_user
        });
      }
      this.floating_button_pressed = ko.observable(false);
      this.floating_button_pressed_and_visible = ko.computed((function(_this) {
        return function() {
          return _this.floating_button_pressed() && _this.floating_button_visible();
        };
      })(this));
    }

    NavigationViewModel.prototype.section_tab_is = function(section) {
      return this.section() === section;
    };

    NavigationViewModel.prototype.onOpenFloatingButton = function(e) {
      return this.floating_button_pressed(true);
    };

    NavigationViewModel.prototype.onCloseFloatingButton = function(e) {
      return this.floating_button_pressed(false);
    };

    NavigationViewModel.prototype.onToggleFloatingButton = function() {
      return this.floating_button_pressed(!this.floating_button_pressed());
    };

    NavigationViewModel.prototype.onBackHistory = function() {
      return window.history.back();
    };

    NavigationViewModel.prototype.onKeyPress = function(d, e) {
      if (e.keyCode === 13) {
        this.onSearch();
        $(ohko).blur();
      }
      return true;
    };

    return NavigationViewModel;

  })(ohko.ViewModel);
  window.ohko.NavigationViewModel = ohko.NavigationViewModel;
})(window);

var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

(function(window) {
  ohko.PageViewModel = (function(_super) {
    __extends(PageViewModel, _super);

    function PageViewModel() {
      return PageViewModel.__super__.constructor.apply(this, arguments);
    }

    PageViewModel.prototype.is_authenticable = function() {
      this.bind(['authenticated'], {
        from: ohko.app.session
      });
      this.bind(['username', 'full_name'], {
        from: ohko.app.current_user,
        namespace: 'user'
      });
      return this.current_user_changed = kb.triggeredObservable(ohko.app.current_user, 'change');
    };

    PageViewModel.prototype.onBackHistory = function() {
      return window.history.back();
    };

    return PageViewModel;

  })(ohko.ViewModel);
  window.ohko.PageViewModel = ohko.PageViewModel;
})(window);
