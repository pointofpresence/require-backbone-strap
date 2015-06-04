define("views/Test", [
    "backbone",
    "templates",
    "jquery",

    "collections/Test"
], function (Backbone, templates, $, TestCollection) {
    "use strict";

    return Backbone.View.extend({
        el:       "#test",
        template: templates.Test,

        initialize: function () {
            this.collection = new TestCollection;

            this.collection.fetch({
                success: (this.render).bind(this)
            });
        },

        render: function () {
            this.$el.html(this.template({
                data: this.collection.toJSON()
            }));
        }
    });
});