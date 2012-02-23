{ezscript_require( array( 'ezjsc::yui3', 'ezautosubmit.js' ) )}
{ezcss_require( 'autosave.css' )}
<script type="text/javascript">

YUI(YUI3_config).use('ezautosubmit', 'node-base', 'node-style', function (Y) {ldelim}

    var as = new Y.eZ.AutoSubmit({ldelim}

            form: '#editform',
            action: {concat( 'ezjscore/call/ezautosave::savedraft::', $object.id, '::', $edit_version, '::', $edit_language, '?ContentType=javascript' )|ezurl},
            interval: {ezini( 'AutosaveSettings', 'Interval', 'autosave.ini' )|int()},
            trackUserInput: {cond( ezini( 'AutosaveSettings', 'TrackUserInput', 'autosave.ini')|eq( 'enabled' ), "true", "false" )}
        {rdelim}),
        messages = {ldelim}

            error: "{'An error occured while autosaving the draft'|i18n( 'design/ezwebin/autosave' )|wash( 'javascript' )}",
            saving: "{'The draft is being saved'|i18n( 'design/ezwebin/autosave' )|wash( 'javascript' )}"
        {rdelim},
        timer = false, place;

    {literal}

    as.on('abort', function() {
        place.removeClass('as-saving')
             .removeClass('as-error')
             .removeClass('as-success')
             .setContent('');
    });

    as.on('error', function (e) {
        if ( timer ) {
            timer.cancel();
        }
        place.removeClass('as-saving')
             .removeClass('as-success')
             .addClass('as-error')
             .setContent('<span>' + messages.error + '</span>');
        if ( e.json && e.json.error_text ) {
             place.setAttribute('title', e.json.error_text);
        }
    });

    as.on('init', function () {
        var that = this;
        Y.one('#ezwt').append('<div id="ez-as-place" class="as-init"></div>');
        place = Y.one('#ez-as-place');
        place.setStyle('top', parseInt(Y.one('#ezwt').get('offsetHeight')) - 1 + 'px');
{/literal}
        {if ezini( 'AutosaveSettings', 'HideStoreDraftButton', 'autosave.ini' )|eq( 'enabled' )}Y.all(this.conf.form + ' input[name=StoreButton]').hide();{/if}
{literal}
        Y.on('beforeunload', function (e) {
            setTimeout(function () {
                that.submit("StoreExitButton=1");
            }, 0);
        });
    });

    as.on('beforesave', function () {
        place.addClass('as-saving')
             .removeClass('as-error')
             .removeClass('as-success')
             .removeClass('as-init')
             .setContent(messages.saving)
             .setAttribute('title', '');
    });

    as.on('success', function (e) {
        var counter = 0,
            msgAgo = e.json.content.message_ago,
            updateMsg = function () {
                var n = msgAgo.replace(counter, counter + 1);
                place.setContent(place.getContent().replace(msgAgo, n));
                msgAgo = n;
                counter++;
            };

        place.removeClass('as-error')
             .removeClass('as-saving')
             .addClass('as-success')
             .setContent(e.json.content.message_success + ' ' + msgAgo)
             .setAttribute('title', '');
        if ( timer ) {
            timer.cancel();
        }
        timer = Y.later(60000, this, updateMsg, [], true);
    });

    as.start();
    {/literal}

{rdelim});

</script>
