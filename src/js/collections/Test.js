define("collections/Test", [
    "backbone",
    "models/Test"
], function (Backbone, TestModel) {
    "use strict";

    return Backbone.Collection.extend({
        url:   "https://openclipart.org/search/json/?&query=christmas&page=1&amount=4",
        model: TestModel,

        parse: function(response) {
            return response.payload;
        }
    });
});