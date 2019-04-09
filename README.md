# VueModel

A Vue plugin that provides a rich object model for Vue using model.js.

## Install & Setup

```js
import VueModel from "vuemodel";

// Install the Vue plugin
Vue.use(VueModel);

// Define your model
var model = new VueModel({ ... });
```

## How it works

Whereas Vue by default proxies at an object's own properties to enable observable
updates, for model types observability is based on the defined schema of the model.
To accomplish this, the Vue plugin (installed via the `Vue.use()` call) obtains a
reference to `Vue` and its internal observer types. When an instance of `VueModel`
is constructed, it hooks into model eventing in order to create a custom observer
for model instances, which will raise the appropriate events when model properties
are accessed and changed.

## License

[MIT](http://opensource.org/licenses/MIT)
