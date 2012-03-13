{literal}
<!--[if IE 6]>
<style>
.controlbar-fixed #preview-link, .controlbar-fixed #preview-spacer
{
display:none;
}
</style>
<![endif]-->
{/literal}
{ezscript_require( array( 'ezjsc::yui3', 'ezautosubmit.js' ) )}
<script type="text/javascript">

YUI(YUI3_config).use('ezautosubmit', 'ezcontentpreview', 'node-base', 'node-style', function (Y) {ldelim}

    var as = new Y.eZ.AutoSubmit({ldelim}

            form: '#editform',
            ignoreClass: 'no-autosave',
            action: {concat( 'ezjscore/call/ezautosave::savedraftpreview::', $object.id, '::', $edit_version, '::', $edit_language, '?ContentType=javascript' )|ezurl},
            interval: {ezini( 'AutosaveSettings', 'Interval', 'autosave.ini' )|int()},
            trackUserInput: {cond( ezini( 'AutosaveSettings', 'TrackUserInput', 'autosave.ini')|eq( 'enabled' ), "true", "false" )}
        {rdelim}),
        messages = {ldelim}

            error: "{'An error occured while autosaving the draft'|i18n( 'design/admin2/autosave' )|wash( 'javascript' )}",
            saving: "{'The draft is being saved'|i18n( 'design/admin2/autosave' )|wash( 'javascript' )}"
        {rdelim},
        preview = new Y.eZ.ContentPreview({ldelim}

            texts: {ldelim}

                loading: "{'Loading...'|i18n( 'design/admin2/preview' )|wash( 'javascript' )}",
                error: "{'An error occured.'|i18n( 'design/admin2/preview' )|wash( 'javascript' )}",
                preview: "{'Preview'|i18n( 'design/admin2/preview' )|wash( 'javascript' )}"
            {rdelim},
            topPosition: Y.one('#controlbar-top .box-bc').getStyle('height')
        {rdelim}),
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
            preview.error(e.json.error_text);
        } else {
            preview.error();
        }
    });

    as.on('init', function () {
        var that = this;
        Y.one('#controlbar-top .button-right').prepend(
            '<em id="ez-as-place"></em>'
        );
        place = Y.one('#ez-as-place');
        preview.init();
{/literal}
        {if ezini( 'AutosaveSettings', 'HideStoreDraftButton', 'autosave.ini' )|eq( 'enabled' )}Y.all(this.conf.form + ' input[name=StoreButton]').each(function () {ldelim} this.hide() {rdelim});{/if}
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
             .setContent(messages.saving)
             .setAttribute('title', '');
        preview.loading();
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
        preview.setContent(e.json.content.preview);
        if ( timer ) {
            timer.cancel();
        }
        timer = Y.later(60000, this, updateMsg, [], true);
    });

    as.start();
    {/literal}

{rdelim});

</script>
