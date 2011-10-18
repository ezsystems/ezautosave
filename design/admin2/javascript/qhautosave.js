var qh_autosave_config = "";
var qh_autosave_interval = 15000;
var qh_warn_on_unload = true;

var qh_autosave_form_content = "";
var qh_autosave_edit_form = "";

var qh_autosave_stop = false;

// Wait for the DOM to be ready
$(document).ready(function() {

    // Load the config from qhautosave.ini via ezjscore in JSON format
    $.ez( 'qhautosave::configload', '', function( ezp_data ) {

    // If any error
    if ( ezp_data.error_text ) {
        console.log( 'ezjscore ajax error, using default setting values' );
    } else {
        qh_autosave_config = jQuery.parseJSON( ezp_data.content );

        if( typeof qh_autosave_config.autosave_interval == 'number' && qh_autosave_config.autosave_interval > 1000 ) {
            qh_autosave_interval = qh_autosave_config.autosave_interval;
        }

        if( typeof qh_autosave_config.warn_on_unload == 'boolean' ) {
            qh_warn_on_unload = qh_autosave_config.warn_on_unload;
            }
    }

    // Start the automatic saving feature
        setInterval( "qhAutosave()", qh_autosave_interval );

    if( qh_warn_on_unload ) {
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
    });

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
    tinyMCE.triggerSave();

    qh_autosave_edit_form = $( '#editform' );

        // Inject the autosave status div
        $( '#page' ).prepend( '<div id="qhautosavecontainer"><div id="qhautosavemessage"></div></div>' );
        $( '#qhautosavecontainer' ).css( 'opacity', 0 );

    }
});

function qhAutosave() {
    if( !qh_autosave_stop ) {
        $( '#qhautosavemessage' ).html( 'Autosaving...' );
        $( '#qhautosavecontainer' ).css( 'opacity', 100 );

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
                $( '#qhautosavemessage' ).html( 'Autosave done!' );
                qh_autosave_form_content = form_content;
                setTimeout( "qhAutosaveHideMessage()", 1000 ); 
            });
            return true;
        } else {
        $( '#qhautosavemessage' ).html( 'No changes!' );
            setTimeout( "qhAutosaveHideMessage()", 1000 );
            return false;
        }
    }
}

function qhAutosaveHideMessage() {
    $( '#qhautosavecontainer' ).animate({opacity: 0}, 400);
}
