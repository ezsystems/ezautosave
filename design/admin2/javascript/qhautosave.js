var qh_autosave_config = "";
var qh_autosave_interval = 15000;
var qh_warn_on_unload = true;
var qh_autosave_notification_method = 'pulsing_bar';

var qh_autosave_form_content = "";
var qh_autosave_edit_form = "";

var qh_autosave_stop = false;

// Wait for the DOM to be ready
$(document).ready(function() {

    // If the user clicks on a button, then don't warn them of unsaved changes 
    $( 'input' ).each( function() {
        if( $(this).hasClass( 'button' ) ||
            $(this).hasClass( 'defaultbutton' )
          ) {
              // When a button is clicked
              $(this).click( function() {
                  // Do not autosave 
                  qh_autosave_stop = false;

                  // Do not warn of leaving the page
                  if( qh_warn_on_unload ) $(window).unbind( 'beforeunload' );
              }); 
    } 
    });

    // If we are in an edit form
    if( $( '#editform' ).length > 0 ) {
        qh_autosave_edit_form = $( '#editform' );

        // Load the config from qhautosave.ini via ezjscore in JSON format
        $.ez( 'qhautosave::configload', '', function( ezp_data ) {

            // If any error
            if ( ezp_data.error_text ) {
                console.log( 'ezjscore ajax error, using default setting values' );
            } else {
                qh_autosave_config = jQuery.parseJSON( ezp_data.content );

                if( typeof parseInt( qh_autosave_config.autosave_interval ) == 'number' && qh_autosave_config.autosave_interval > 1000 )
                    qh_autosave_interval = qh_autosave_config.autosave_interval;

                if( typeof qh_autosave_config.warn_on_unload == 'boolean' )
                    qh_warn_on_unload = qh_autosave_config.warn_on_unload;

                if( typeof qh_autosave_config.autosave_interval == 'string' )
                    qh_autosave_notification_method = qh_autosave_config.notification_method;

                if( qh_warn_on_unload )
                    qhAutosaveActivateWarnOnUnload();

		console.log( qh_autosave_interval );

		qhAutosaveInitialize();
            }
        });
    }
});

// Setup the process
function qhAutosaveInitialize() {
    // Inject the autosave notification container
    $( '#page' ).prepend( '<div id="qhautosavecontainer"><div class="qhautosavemessage" id="qhautosave_notify_by_'+ qh_autosave_notification_method +'"></div></div>' );

    if( qh_autosave_notification_method == 'label' )
        $( '#qhautosavecontainer' ).css( 'opacity', 0 );

    // Start the automatic saving feature
        setInterval( "qhAutosave()", qh_autosave_interval );
}

// Bind the beforeunload event to warn from leaving the page
function qhAutosaveActivateWarnOnUnload() {
    // Display a warning if the user leaves the page
    $(window).bind( "beforeunload", function( event ) {
        // Attempt to autosave
        var autosaved = qhAutosave();

        // This might not work on all browsers as some are preventing
        // JS to continue running while displaying the message
        // The message returned might not be displayed with some browsers
        if( autosaved ) return "You have unsaved changes.";
            return "A draft will be left for this object.";
    });
}

// Autosave function
function qhAutosave() {
    if( !qh_autosave_stop ) {
        if( qh_autosave_notification_method == 'label' )
            qhAutosaveNotify( 'Autosaving...', false );

        // Tells tinyMCE to save the content of each XML Block back to their HMTL Input field
        tinyMCE.triggerSave();

        // Retreiving form posting info
        var form_method = qh_autosave_edit_form.attr('method').toLowerCase();
        var post_url = qh_autosave_edit_form.attr('action');

        // Preparing the content and setting the action to store as a draft
        var form_content = qh_autosave_edit_form.serialize() + '&StoreButton=Store+draft';

        // Only save if there are changes from the last autosave process
        if( form_content != qh_autosave_form_content ) {
            $[form_method](post_url, form_content, function(data){
                qhAutosaveNotify( 'Autosave done!' ); 
                qh_autosave_form_content = form_content;
            });
            return true;
        } else {
            if( qh_autosave_notification_method == 'label' )
                qhAutosaveNotify( 'No changes!' );
            return false;
        }
    }
}

// Notify of autosave process
function qhAutosaveNotify( message, hide_after ) {
        if( typeof hide_after == 'undefined' )
            hide_after = true;

        switch( qh_autosave_notification_method ) {
            case 'pulsing_bar': 
                $( '#qhautosavecontainer' ).animate( {opacity: 0.5}, {duration: 1500, complete: function() {
                    $( '#qhautosavecontainer' ).animate( {opacity: 1}, 1500 );
                }});
            break;

            case 'label':
                $( '#qhautosave_notify_by_label' ).html( message );
                $( '#qhautosavecontainer' ).css( 'opacity', 1 );
                if( hide_after ) setTimeout( "qhAutosaveHideMessage()", 1000 );
            break;
        }
}

// Hide the notification container
function qhAutosaveHideMessage() {
    $( '#qhautosavecontainer' ).animate({opacity: 0}, 400);
}
