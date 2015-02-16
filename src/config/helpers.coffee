# Traverse a JSON tree and apply a function to each node
window.traverse_object = (o, f) ->
  for i of o
    f(i, o)
    if o[i] instanceof Object
      traverse_object o[i], f

# Extensions
String::startsWith ?= (s) -> @slice(0, s.length) == s
String::endsWith   ?= (s) -> s == '' or @slice(-s.length) == s
String::replaceAll ?= (s, r) -> @split(s).join r