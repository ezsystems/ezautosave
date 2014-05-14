<?php /*

[AutosaveSettings]
# Number of seconds to wait between two automatic save attempts
Interval=180

# whether to save the draft when the user leaves a form field
# and has made some changes
# if disabled, the autosave will only occur at regular interval
TrackUserInput=enabled

# whether to hide the Store draft button
HideStoreDraftButton=enabled

# whether to hide the preview link
HidePreviewLink=disabled

[BrowserWorkarounds]
# Disable autosave in IE (11 for now) when the form has a password field.
# This is because by default IE 11 is not able to post a form to an iframe
# when giving the focus to a password field...
# It's possible to change this behaviour by unchecking the "Enable Protected
# Mode" options in the security settings of IE11 or by putting the eZ Publish
# website in a zone where this option is disabled.
# See https://jira.ez.no/browse/EZP-22813
IEDisableWithPassword[]
IEDisableWithPassword[]=11

*/ ?>
