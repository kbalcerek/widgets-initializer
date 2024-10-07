const WidgetsInitializer = (function() {
    let defaultOptions = {
        /** ignored when resolver is provided */
        useRelativePathToImportWidgetClass: false,
        /** custom Widget classes dynamic loader.
         * ```
         * ```
         * If provided this one will be used to load Widget classes (instead of import())
         * ```
         * (path) => new Promise()
         * ```
         */
        resolver: undefined,
    };
    let config = defaultOptions;

    async function loadWidget(path) {
        try {
            if (config.resolver !== undefined) {
                const module = await config.resolver(path);
                return module.default;
            } else {
                const relativePart = config.useRelativePathToImportWidgetClass
                    ? window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'))
                    : '';
                const module = await import(`${relativePart}/${path}.js`);
                return module.default;
            }
        } catch (err) {
            console.error(err);
            throw err;
        }
    }

    async function init(target, callback, options = {}) {
        config = { ...defaultOptions, ...options };
        const errors = [];
        const node = target.querySelectorAll('[widget]')[0];

        const widgetPath = node.getAttribute('widget');
        try {
            const WidgetClass = await loadWidget(widgetPath);
            widgetInstance = new WidgetClass();
            widgetInstance.init(node, err => {
                if (err) errors.push({ node, error: err });
            });
        } catch (err) {
            errors.push({ node, error: err });
        }
        
        try {
            callback(errors.length ? errors : null);
        } catch (err) {
            callback(err);
        }
    }

    return {
        init,
    };
})();

module.exports = WidgetsInitializer;