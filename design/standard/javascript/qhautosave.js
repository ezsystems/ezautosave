var qh_autosave_config = "";
var qh_autosave_interval = 15000;
var qh_warn_on_unload = true;

var qh_autosave_form_content = "";
var qh_autosave_edit_form = "";

var qh_autosave_stop = false;
var qh_autosave_config = {};

if (typeof jQuery != 'undefined') 
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

        // If qhjsiniloader has been activated and loaded
        if( typeof QHJSINILoader != 'undefined' ) {
            // Load custom settings
            QHJSINILoader.init( 'qhautosave', qhAutosaveInitialize );
        } else {
            qhAutosaveInitialize();
        }
    }
});

// Setup the process
function qhAutosaveInitialize( qhjsiniloader_config ) {
    // Save the config in a global variable
    qh_autosave_config = qhjsiniloader_config;

    // If not config data is returned from QHJSINILoader, use default values
    if( typeof qh_autosave_config == 'undefined' ) {
        qh_autosave_config = {autosave_interval: 15000, warn_on_unload: true};
    } else { 
        if( typeof parseInt( qh_autosave_config.autosave_interval ) == 'number' && qh_autosave_config.autosave_interval > 15000 )
            qh_autosave_interval = qh_autosave_config.autosave_interval;

        if( typeof qh_autosave_config.warn_on_unload == 'boolean' )
            qh_warn_on_unload = qh_autosave_config.warn_on_unload;
    }

    if( qh_warn_on_unload )
        qhAutosaveActivateWarnOnUnload();


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
        qhAutosaveNotify( qh_autosave_config.i18n.in_process );

        // Tells tinyMCE to save the content of each XML Block back to their HMTL Input field
        if( typeof tinyMCE != 'undefined' ) tinyMCE.triggerSave();

        // Retreiving form posting info
        var form_method = qh_autosave_edit_form.attr('method').toLowerCase();
        var post_url = qh_autosave_edit_form.attr('action');

        // Preparing the content and setting the action to store as a draft
        var form_content = qh_autosave_edit_form.serialize() + '&StoreButton=Store+draft';

        // Only save if there are changes from the last autosave process
        if( form_content != qh_autosave_form_content ) {
            $[form_method](post_url, form_content, function(data){
                setTimeout( "qhAutosaveNotify( 'Store draft' )", 500 ); 
                qh_autosave_form_content = form_content;
            });
            return true;
        } else {
            setTimeout( "qhAutosaveNotify( 'Store draft' )", 500 );
            return false;
        }
    }
}

// Notify of autosave process
function qhAutosaveNotify( message ) {
    var ezwt_editaction_buttons = $( '#ezwt-editaction input' );
    for( var i=0; i<ezwt_editaction_buttons.length; i++ ) {
        if( ezwt_editaction_buttons[i].name == 'StoreButton') {
            ezwt_editaction_buttons[i].value = message;
        }
    }
}
