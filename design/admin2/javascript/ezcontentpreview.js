YUI(YUI3_config).add('ezcontentpreview', function (Y) {

    Y.namespace('eZ');

    var defaultConf = {
        previewTemplate: '<div id="content-preview" class="unsaved"><div id="preview-iframe"></div><div class="loader">%loading</div><div class="error">%error</div></div>',
        elementTemplate: '<a id="preview-spacer"><span>%preview</span></a><a id="preview-link"><span>%preview</span></a>',
        place: '#content-preview',
        preview: '#preview-iframe',
        element: '#preview-link',
        buttonPlace: '#controlbar-top .button-right',
        texts: {
            loading: 'Loading...',
            preview: 'Preview',
            error: 'An error occured'
        },
        topPosition: '0px'
    };

    /**
     * Constructor of Y.eZ.ContentPreview object
     *
     * @param conf configuration object to override the defaut configuration
     * @see defaultConf
     */
    function eZContentPreview(conf) {
        this.conf = Y.merge(defaultConf, conf);
        var conf = this.conf,
            prTpl = this.conf.previewTemplate,
            elTpl = this.conf.elementTemplate;
        this.conf.previewTemplate = prTpl.replace('%loading', conf.texts.loading)
                                         .replace('%error', conf.texts.error);
        this.conf.elementTemplate= elTpl.replace(/%preview/g, conf.texts.preview);
    }

    /**
     * Initializes the content preview:
     *  - appends the link to trigger the preview and fixes it style
     *  - appends the preview placeholder
     *  - defines the event subscriptions to handle the preview
     *  - initializes the internal Y.eZ.CollapsibleMenu object
     */
    eZContentPreview.prototype.init = function () {
        var that = this,
            button = Y.one(this.conf.buttonPlace);

        button.append(this.conf.elementTemplate)
              .append(this.conf.previewTemplate);

        var link = Y.one(this.conf.element),
            place = Y.one(this.conf.place),
            preview = Y.one(this.conf.preview);

        this.place = place;
        this.link = link;
        this.preview = preview;

        this._initStyles();
        this._initEvents();

        this.collapsible = new Y.eZ.CollapsibleMenu({
            link: that.conf.element,
            content: false,
            collapsed: 1,
            beforeuncollapse: function () {
                that.initPreview();
            },
            aftercollapse: function () {
                that.resetPreview();
            },
            beforecollapse: function () {
                // just to make the transition a bit more smooth
                that.place.get('children').transition({
                    duration: 0.5,
                    opacity: 0
                });
            },
            elements: [{
                selector: this.conf.place,
                duration: 0.7,
                fullStyle:{
                    height: function () {
                        return (link.get('winHeight') - parseInt(that.conf.topPosition)) + 'px';
                    }
                },
                collapsedStyle:{
                    height:0
                }
            }, {
                selector: this.conf.place + ' iframe',
                duration: 0.8,
                fullStyle:{
                    height: function () {
                        return that.getIframeHeight();
                    }
                },
                collapsedStyle:{
                    height:0
                }
            }]
        });
        this.loading();
    }

    /**
     * Closes the content preview
     */
    eZContentPreview.prototype.close = function () {
        this.collapsible.collapse();
    }

    /**
     * Sets the content preview in "loading" state
     */
    eZContentPreview.prototype.loading = function () {
        this.place.removeClass('error')
                  .addClass('loading');
    }

    /**
     * Returns the height of iframe to fill the content preview space
     * @return string (ex. "300px")
     */
    eZContentPreview.prototype.getIframeHeight = function () {
        var header, height, iframe, offset = 0;

        iframe = this.place.one('iframe');
        this.preview.get('children').each(function (element) {
            if ( element.get('tagName').toLowerCase() != 'iframe' ) {
                offset += parseInt(element.get('offsetHeight'));
            }
        });
        height = parseInt(this.place.get('winHeight'))
                    - parseInt(this.conf.topPosition)
                    - offset
                    - parseInt(iframe.getComputedStyle('marginTop'))
                    - parseInt(iframe.getComputedStyle('marginBottom'));
        return height + 'px';
    }

    /**
     * Initializes the preview by adding necessary styles and
     * if the autosave has occured, trigger the autosubmit:forcesave event
     */
    eZContentPreview.prototype.initPreview = function () {
        this.link.addClass('previewed');
        this.place.addClass('previewed');
        this.place.get('children').setStyle('opacity', 1);
        if ( this.place.hasClass('unsaved') || this.place.hasClass('error') ) {
            this.place.removeClass('unsaved');
            Y.fire('autosubmit:forcesave');
        }
    }

    /**
     * Resets the preview by removing classes and styles added by initPreview()
     */
    eZContentPreview.prototype.resetPreview = function () {
        this.link.removeClass('previewed');
        this.place.removeClass('previewed');
        this.place.get('children').setStyle('opacity', 1);
    }

    /**
     * Defines the actual content of the preview and
     * adjust the height of the iframe if necessary
     *
     * @param content the actual preview content
     */
    eZContentPreview.prototype.setContent = function (content) {
        this.place.removeClass('loading');
        this.preview.setContent(content);
        // adjust iframe height if the preview place is shown
        if ( this.place.hasClass('previewed') ) {
            this.place.one('iframe').transition({
                duration: 0.4,
                height: this.getIframeHeight()
            });
        }
    }

    /**
     * Display the error
     *
     * @param err (not required) error message
     */
    eZContentPreview.prototype.error = function (err) {
        var msg = this.conf.texts.error;

        if ( err ) {
            msg += ': ' + err;
        }

        this.place.one('.error').setContent(msg);
        this.place.removeClass('loading')
                  .addClass('error');
    }

    /**
     * Initializes the styles of the preview link and the position of the preview
     * @private
     */
    eZContentPreview.prototype._initStyles = function () {
        this.link.setStyles({
            height: this.conf.topPosition
        });

        this.place.setStyle(
            'top', this.conf.topPosition
        );
    }

    /**
     * Initializes the events that will occur inside the preview
     *  - siteaccess change
     *  - link to return to the edit form
     * @private
     */
    eZContentPreview.prototype._initEvents = function () {
        var that = this;

        this.preview.delegate('click', function (e) {
            var sa = e.target.get('value'),
                iframe = that.preview.one('iframe'),
                urlArray = iframe.get('src').split('/'),
                currentSA = urlArray.pop();
            if ( currentSA != sa ) {
                var loader = that.preview.one('#iframe-loader');
                loader.show('fadeIn');
                urlArray.push(sa);
                iframe.on('load', function () {
                    loader.hide('fadeOut');
                });
                iframe.set('src', urlArray.join('/'));
            }
        },
        'select');

        this.preview.delegate('click', function (e) {
            that.close();
            e.preventDefault();
        },
        'a.close');
    }

    Y.eZ.ContentPreview = eZContentPreview

}, '1.0.0', {
    requires: [
        'transition', 'ezcollapsiblemenu', 'node-screen', 'node-event-delegate'
    ]
});

