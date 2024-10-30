(function () {

    // Create a new plugin class
    tinymce.create('tinymce.plugins.LFEWidget', {
        init: function (editor, url) {
            // Register an example button
            editor.addButton('lfewidget', {
                title: 'Insert LFE Widget',
                onclick: function () {
                    // Open window
                    var widgetParameters = {};
                    widgetParameters.alreadyExists = isWidgetExists(editor.getContent());
                    widgetParameters.guid = lfe.guid;
                    widgetParameters.base_url = lfe.base_url;
                    widgetParameters.options_url = lfe.options_url;

                    editor.windowManager.open({
                        url: url + '/popup.html',
                        width: 450,
                        height: 360,
                        inline: true,
                        resizable: true
                    }, widgetParameters);
                },
                image: url + "/images/icon.png",
                'class': 'bold' // Use the bold icon from the theme
            });
        }
    });

    /**
     * Search in the text whether LFE widget exists.
     * @param HTML content
     * @returns {boolean}
     */
    function isWidgetExists(content) {
        var searchRegex = new RegExp('\\ssrc="' + lfe.base_url + '', "i");
        return searchRegex.exec(content) !== null;
    }

    // Register plugin with a short name
    tinymce.PluginManager.add('lfewidget', tinymce.plugins.LFEWidget);
})();