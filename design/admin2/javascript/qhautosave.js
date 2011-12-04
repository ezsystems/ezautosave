// Main JS class that processes the autosave feature
// Note we are not using 'this' inside the class as it is called within a call back further down
var qhAutoSave = {
    default_interval: 15000,
    default_warn_on_unload: true,
    notifications: false,
    form_content: "",
    edit_form: "",
    stop: false,
    config: {},

    // Setup the process
    initialize: function( qhjsiniloader_config ) {
        // Save the config in a global variable
        qhAutoSave.config = qhjsiniloader_config;

        // If not config data is returned from QHJSINILoader, use default values
        if( typeof qhAutoSave.config == 'undefined' ) {
            qhAutoSave.config = {autosave_interval: 15000, warn_on_unload: true};
        } else {
            // Checking validity of the autosave interval config value
            if( typeof parseInt( qhAutoSave.config.autosave_interval ) != 'number' || parseInt( qhAutoSave.config.autosave_interval ) < 1000 ) {
                qhAutoSave.config.autosave_interval = qhAutoSave.default_interval;
            }

            if( typeof qhAutoSave.config.warn_on_unload != 'boolean' ) {
                qhAutoSave.config.warn_on_unload = qhAutoSave.default_warn_on_unload;
            }
        }

        if( qhAutoSave.config.warn_on_unload ) {
            qhAutoSave.activateWarnOnUnload();
        }

        qhAutoSave.notifications = new QHNotifications();

        // Start the automatic saving feature
        setInterval( "qhAutoSave.autosave()", qhAutoSave.config.autosave_interval );

        qhAutoSave.notify( qhAutoSave.config.i18n.active );

    },

    // Bind the beforeunload event to warn from leaving the page
    activateWarnOnUnload: function() {
        // Display a warning if the user leaves the page
        $(window).bind( "beforeunload", function( event ) {
            // Attempt to autosave
            var autosaved = qhAutoSave.autosave();

            // This might not work on all browsers as some are preventing
            // JS to continue running while displaying the message
            // The message returned might not be displayed with some browsers
            if( autosaved ) return "You have unsaved changes.";
                return "A draft will be left for this object.";
        });
    },

    // Autosave function
    autosave: function() {
        if( !qhAutoSave.stop ) {
            qhAutoSave.notify( qhAutoSave.config.i18n.in_progress );

            // Tells tinyMCE to save the content of each XML Block back to their HMTL Input field
            if( typeof tinyMCE != 'undefined' ) tinyMCE.triggerSave();

            // Retreiving form posting info
            var form_method = qhAutoSave.edit_form.attr('method').toLowerCase();
            var post_url = qhAutoSave.edit_form.attr('action');

            // Preparing the content and setting the action to store as a draft
            var form_content = qhAutoSave.edit_form.serialize() + '&StoreButton=Store+draft';

            // Only save if there are changes from the last autosave process
            if( form_content != qhAutoSave.form_content ) {
                $[form_method](post_url, form_content, function(data){
                    qhAutoSave.notify( qhAutoSave.config.i18n.done );
                    qhAutoSave.form_content = form_content;
                });
                return true;
            } else {
                qhAutoSave.notify( qhAutoSave.config.i18n.no_changes );
                return false;
            }
        }
    },

    // Notify of autosave process
    notify: function( message ) {
        qhAutoSave.notifications.setMessage( {notification_id: 'autosave_status', text: message, type: 'sticky'} );
        qhAutoSave.notifications.display();
    }

}

if (typeof jQuery != 'undefined') {
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
                      qhAutoSave.stop = false;

                      // Do not warn of leaving the page
                      if( qhAutoSave.config.warn_on_unload )
                          $(window).unbind( 'beforeunload' );
                  });
            }
        });

        // If we are in an edit form
        if( $( '#editform' ).length > 0 ) {
            qhAutoSave.edit_form = $( '#editform' );

            // If qhjsiniloader has been activated and loaded
            if( typeof QHJSINILoader != 'undefined' ) {
                // Load custom settings
                QHJSINILoader.init( 'qhautosave', qhAutoSave.initialize );
            } else {
                qhAutoSave.initialize();
            }
        }
    });
}
