var qhAutosaveFormContent = "";
var qhAutosaveEditForm = "";
var qhAutosaveInterval = 15000;
var qhAutosaveStop = false;

$(document).ready(function() {
    // If the user clicks on a button, then don't warn them of unsaved changes 
    $( 'input' ).each( function() {
        if( $(this).hasClass( 'button' ) ||
            $(this).hasClass( 'defaultbutton' )
          ) {
              // When a button is clicked
              $(this).click( function() {
                  // Do not autosave 
                  qhAutosaveStop = false;

                  // Do not warn of leaving the page
                  if( qhBeforeUnload ) $(window).unbind( 'beforeunload' );
              }); 
	} 
    });

    // If we are in an edit form
    if( $( '#editform' ).length > 0 ) {
	tinyMCE.triggerSave();

	qhAutosaveEditForm = $( '#editform' );

        // Inject the autosave status div
        $( '#page' ).prepend( '<div id="qhautosavecontainer"><div id="qhautosavemessage"></div></div>' );
        $( '#qhautosavecontainer' ).css( 'opacity', 0 );

        // Set the automatic saving feature
	setInterval( "qhAutosave()", qhAutosaveInterval );
    }
});

function qhAutosave() {
    if( !qhAutosaveStop ) {
        $( '#qhautosavemessage' ).html( 'Autosaving...' );
        $( '#qhautosavecontainer' ).css( 'opacity', 100 );

        // Tells tinyMCE to save the content of each XML Block back to their HMTL Input field
        tinyMCE.triggerSave();

        // Retreiving form posting info
        var formMethod = qhAutosaveEditForm.attr('method').toLowerCase();
        var postURL = qhAutosaveEditForm.attr('action');

        // Preparing the content and setting the action to store as a draft
        var formContent = qhAutosaveEditForm.serialize() + '&StoreButton=Store+draft';

        // Only save if there are changes from the last autosave process
        if( formContent != qhAutosaveFormContent ) {
            $[formMethod](postURL, formContent, function(data){
                $( '#qhautosavemessage' ).html( 'Autosave done!' );
                qhAutosaveFormContent = formContent;
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
