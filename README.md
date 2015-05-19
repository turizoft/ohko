# One Hit K.O.

OHKO, Knockout, Backbone and Knockback shorthands for Single Page Applications. Provides a set of classes and methods to avoid repeating yourself while doing common tasks such as creating data or collection bindings, routing your application, or saving a session.

## Features

* Application wrapper
* Navigtion bindings
* SPA router boilerplate with Backbone and Knockback
* Basic profile/session template
* Rails friendly backbone configuration
* Data binding collection manipulation (paging, sorting)
* Utility model methods
* Utility view model methods

## Introduction

When I began writing SPA applications, one library that caught my attention was Knockout.js, due to its simplicity and lack of additional requirements.
On the other hand, Backbone.js is proven to be one of the most mature and stable libraries for JSON based RESTful applications. The first, provides an excelent way to connect data with views, but falls short of a strong model definition. The second, provides a robust way to manipulate models, but does not make it so easy to work with views. There is where Knockback.js enters, to provide a bridge between them both.

Nevertheless, I realised that i was repeating my self again and again when doing basic things such as defining view models and observables. For instance:

```coffescript
class ViewModel extends kb.ViewModel
  constructor: (model) ->
    super model
    @full_name = ko.computed => "#{@first_name()} #{@last_name()}"
``
