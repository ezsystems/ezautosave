var qhBeforeUnload = true;

$(document).ready(function() {
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
});
