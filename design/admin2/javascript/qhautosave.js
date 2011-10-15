var qhAutosaveFormContent = "";
var qhAutosaveEditForm = "";
var qhAutosaveInterval = 15000;

$(document).ready(function() {
    if( $( '#editform' ).length > 0 ) {
	tinyMCE.triggerSave();

	qhAutosaveEditForm = $( '#editform' );

        $( '#page' ).prepend( '<div id="qhautosavecontainer"><div id="qhautosavemessage"></div></div>' );
        $( '#qhautosavecontainer' ).css( 'opacity', 0 );

	if( qhAutosaveFormContent == "" ) setTimeout( "autosave()", 5000 ); 
	setInterval( "autosave()", qhAutosaveInterval );
    }
});

function autosave() {
    $( '#qhautosavemessage' ).html( 'Autosaving...' );
    $( '#qhautosavecontainer' ).css( 'opacity', 100 );

    tinyMCE.triggerSave();

    var formMethod = qhAutosaveEditForm.attr('method').toLowerCase();
    var postURL = qhAutosaveEditForm.attr('action');
    var formContent = qhAutosaveEditForm.serialize() + '&StoreButton=Store+draft';

    if( qhAutosaveFormContent == "" ) {
            $( '#qhautosavemessage' ).html( 'Initializing autosave...' );
	    qhAutosaveFormContent = qhAutosaveEditForm.serialize() + '&StoreButton=Store+draft';
            setTimeout( "destroyAutosaveMessage()", 1000 );
    } else if( formContent != qhAutosaveFormContent ) {
        $[formMethod](postURL, formContent, function(data){
            $( '#qhautosavemessage' ).html( 'Autosave done!' );
            qhAutosaveFormContent = formContent;
            setTimeout( "destroyAutosaveMessage()", 1000 ); 
        });
    } else {
	$( '#qhautosavemessage' ).html( 'No changes!' );
        setTimeout( "destroyAutosaveMessage()", 1000 );
    }
}

function destroyAutosaveMessage() {
    $( '#qhautosavecontainer' ).animate({opacity: 0}, 400);
}
