<div class="preview-header">
    <h1 class="context-title">
        <a href="#" class="close">&laquo;&nbsp;{'Back to the edit form'|i18n( 'design/admin2/content/ajax_preview' )}</a>
        {$object.content_class.identifier|class_icon( normal, $node.class_name )}
        {'Preview of &lt;%name&gt; in siteaccess'|i18n( 'design/admin2/content/ajax_preview', '', hash( '%name', $version.name ) )}
        <select class="no-autosave">
        {foreach $siteaccess_list as $sa}
            <option value="{$sa|wash()}"{cond( $sa|eq( $default_siteaccess ), ' selected="selected"', '' )}>{$sa|wash()}</option>
        {/foreach}
        </select>
        <img src={'as-loader.gif'|ezimage} alt="Loading..." style="display:none" id="iframe-loader" />
    </h1>
    <div class="context-information">
        <p class="left preview-warning">
            {'<strong>Warning:</strong> <em>following links from the preview will take you to the live version of the website</em>'|i18n( 'design/admin2/content/ajax_preview' )}
        </p>
        <p class="right translation">
            {$locale.intl_language_name|wash}&nbsp;<img src="{$locale.locale_code|flag_icon}" width="18" height="12" style="vertical-align: middle;" alt="{$locale.locale_code}" />
        </p>
        <div class="break"></div>
    </div>
</div>
<iframe src={concat( 'content/versionview/', $object.id, '/', $version.version, '/', $locale.locale_code, "/site_access/", $default_siteaccess )|ezurl}></iframe>
