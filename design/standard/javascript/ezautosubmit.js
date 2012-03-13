YUI(YUI3_config).add('ezautosubmit', function (Y) {

    Y.namespace('eZ');

    var defaultConfig = {
        interval: 300,
        trackUserInput: true,
        ignoreClass: false
    };

    // based on Y.IO._serialize which is private
    // also ignore form elements that have ignoreClass
    function serializeForm(id, ignoreClass) {
        var data = [], eUC = encodeURIComponent,
            item = 0,
            e, f, n, v, i, il, j, jl, o,
            form = Y.one(id), f = form.getDOMNode(),
            searchClass = ' ' + ignoreClass + ' ';

        for (i = 0, il = f.elements.length; i < il; ++i) {
            e = f.elements[i];

            if ( ignoreClass && (' ' + e.className + ' ').indexOf(searchClass) > -1 ) {
                continue;
            }

            n = eUC(e.name) + '=';
            v = eUC(e.value);

            switch (e.type) {
                // Safari, Opera, FF all default options.value from .text if
                // value attribute not specified in markup
                case 'select-one':
                    if (e.selectedIndex > -1) {
                        o = e.options[e.selectedIndex];
                        data[item++] = n + eUC(o.attributes.value && o.attributes.value.specified ? o.value : o.text);
                    }
                    break;
                case 'select-multiple':
                    if (e.selectedIndex > -1) {
                        for (j = e.selectedIndex, jl = e.options.length; j < jl; ++j) {
                            o = e.options[j];
                            if (o.selected) {
                              data[item++] = n + eUC(o.attributes.value && o.attributes.value.specified ? o.value : o.text);
                            }
                        }
                    }
                    break;
                case 'radio':
                case 'checkbox':
                    if (e.checked) {
                        data[item++] = n + v;
                    }
                    break;
                case undefined:
                case 'reset':
                case 'button':
                    break;
                case 'file':
                case 'submit':
                default:
                    data[item++] = n + v;
            }
        }
        return data.join('&');
    }

    /**
     * Constructor of Y.eZ.AutoSubmit object
     *
     * @param conf configuration object containing the following elements
     *              - form String, a selector to the form element
     *              - action String, the URI to POST the form
     *              - interval Integer, number of seconds between 2 auto submit attempts
     *              - trackUserInput Boolean, whether to auto submit the end user leave a form field
     */
    function eZAutoSubmit(conf) {
        var that = this;

        this.conf = Y.merge(defaultConfig, conf);
        this.conf.interval = parseInt(this.conf.interval);
        if ( !this.conf.interval ) {
            this.conf.interval = defaultConfig.interval;
        }
        this.timer = false;
        this.started = false;
        this.state = '';
        this.ajaxConfiguration = {
            form:{
                id: Y.one(this.conf.form),
                upload: true
            },
            method: 'POST'
        };
        this.ajax = false;
        this.ajaxSubscription = false;

        Y.on('domready', function () {
            that.fire('init');
        });

        Y.on('autosubmit:forcesave', function () {
            that.submit('AutoSubmitForced=' + new Date().getTime());
        });
    }

    /**
     * Starts the autosubmit job
     *  - stores the initial state of the form
     *  - initializes the timer to periodically submit the form
     *  - initializes the events to track user inputs
     *  - initializes the event to stop autosubmit if the user submits the form
     */
    eZAutoSubmit.prototype.start = function () {
        var that = this;

        if ( this.started ) {
            return;
        }
        Y.on('domready', function () {
            that.timer = Y.later(that.conf.interval * 1000, that, that.submit, [], true);
            that.started = true;
            that.state = serializeForm(that.conf.form, that.conf.ignoreClass);
            if ( that.conf.trackUserInput ) {
                Y.one(that.conf.form).delegate('blur', function (e) {
                    if ( !that.conf.ignoreClass || !e.target.hasClass(that.conf.ignoreClass) ) {
                        that.submit();
                    }
                }, 'input, select, textarea, iframe');
            }
            Y.one(that.conf.form).on('submit', function () {
                that.stop();
            });
        });
    }

    /**
     * Stops the autosubmit job
     */
    eZAutoSubmit.prototype.stop = function () {
        if ( this.started ) {
            this.timer.cancel();
            this.started = false;
            if ( this.ajax ) {
                this.ajax.abort();
                this.ajax = false;
            }
            if ( this.ajaxSubscription ) {
                this.ajaxSubscription.detach();
            }
        }
    }

    /**
     * Tries to submit the form attached to the Y.eZ.AutoSubmit instance
     *
     * @param fields String, optional additional data to submit with the form
     */
    eZAutoSubmit.prototype.submit = function (fields) {
        var that = this,
            formState = serializeForm(this.conf.form, this.conf.ignoreClass),
            originalFormState = formState,
            ajaxConf = Y.clone(this.ajaxConfiguration, true);

        ajaxConf.form.id = Y.one(this.conf.form);
        if ( !this.started ) {
            return;
        }
        if ( fields ) {
            formState += '&' + fields;
        }
        if ( this.state != formState ) {
            if ( this.ajax && this.ajax.isInProgress() ) {
                this.ajaxSubscription.detach();
                this.ajax.abort();
                this.ajax = false;
            }
            this.ajaxSubscription = Y.on('io:complete', function (tId, data) {
                var json, error = false;

                that.ajaxSubscription.detach();
                if ( Y.Lang.isUndefined(data.responseText) ) {
                    // the request was aborted
                    // probably because of Y.AutoSubmit.stop();
                    that.fire('abort');
                    return;
                }
                try {
                    json = Y.JSON.parse(data.responseText);
                } catch(e) {
                    error = true;
                }
                if ( error || json.error_text ) {
                    that.fire('error', {json: json});
                } else {
                    that.fire('success', {json: json});
                }
            });
            this.state = originalFormState;
            this.fire('beforesave');
            if ( fields ) {
                ajaxConf.data = fields;
            }
            this.ajax = Y.io(this.conf.action, ajaxConf);
        } else {
            this.fire('nochange');
        }
    }

    Y.augment(eZAutoSubmit, Y.EventTarget, true, null, {emitFacade: true});
    Y.eZ.AutoSubmit = eZAutoSubmit;

}, '1.0.0', {
    requires: [
        'event', 'event-custom', 'node-event-delegate', 'io-form', 'io-upload-iframe', 'yui-later', 'json-parse'
    ]
});
