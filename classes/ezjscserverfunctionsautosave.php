<?php
/**
 * File containing the ezjscServerFunctionsAutosave class.
 *
 * @copyright Copyright (C) eZ Systems AS. All rights reserved.
 * @license For full copyright and license information view LICENSE file distributed with this source code.
 * @version //autogentag//
 * @package ezautosave
 */

/**
 * This class handles AJAX calls for the autosave feature
 * @package ezautosave
 */
class ezjscServerFunctionsAutosave extends ezjscServerFunctions
{

    /**
     * Save the draft with the provided POST fields like a click on the Store
     * draft button except that a validation issue on an attribute does not
     * prevent the others attributes to be stored.
     *
     * @param array $args array( content object id, version number, locale code )
     * @return array
     */
    static public function saveDraft( $args )
    {
        // force text/plain to make IE happy...
        header( 'Content-Type: text/plain', true );

        $result = array(
            'unvalidated-attributes' => array(),
            'stored-attributes' => array(),
            'valid' => true,
        );
        $http = eZHTTPTool::instance();

        // workaround to the eZContentObjectEditHandler API that needs a Module
        $Module = false;

        if ( count( $args ) != 3 )
        {
            throw new InvalidArgumentException(
                ezpI18n::tr(
                    'extension/ezautosave/autosave',
                    'This action requires 3 parameters'
                )
            );
        }
        if ( $_SERVER['REQUEST_METHOD'] !== 'POST' )
        {
            throw new InvalidArgumentException(
                ezpI18n::tr(
                    'extension/ezautosave/autosave',
                    "A POST request is expected"
                )
            );
        }
        if ( count( $_POST ) === 0 )
        {
            throw new InvalidArgumentException(
                ezpI18n::tr(
                    'extension/ezautosave/autosave',
                    "No POST data found, it's probably because you tried to upload a too big file"
                )
            );
        }
        $contentObject = eZContentObject::fetch( (int)$args[0] );
        if ( !$contentObject instanceof eZContentObject )
        {
            throw new InvalidArgumentException(
                ezpI18n::tr(
                    'extension/ezautosave/autosave',
                    'Unable to load the content #%objectid',
                    null, array( '%objectid' => (int)$args[0] )
                )
            );
        }

        if ( $contentObject->attribute( 'status' ) == eZContentObject::STATUS_ARCHIVED )
        {
            throw new InvalidArgumentException(
                ezpI18n::tr(
                    'extension/ezautosave/autosave',
                    'The content #%objectid is archived',
                    null, array(
                        '%objectid' => $contentObject->attribute( 'id' )
                    )
                )
            );
        }

        $version = $contentObject->version( (int)$args[1] );
        if  ( !$version instanceof eZContentObjectVersion )
        {
            throw new InvalidArgumentException(
                ezpI18n::tr(
                    'extension/ezautosave/autosave',
                    'Unable to load version #%versionr of content #%objectid',
                    null, array(
                        '%versionr' => (int)$args[1],
                        '%objectid' => $contentObject->attribute( 'id' )
                    )
                )
            );
        }
        if ( $version->attribute( 'status' ) != eZContentObjectVersion::STATUS_DRAFT
                && $version->attribute( 'status' ) != eZContentObjectVersion::STATUS_INTERNAL_DRAFT )
        {
            throw new RuntimeException(
                ezpI18n::tr(
                    'extension/ezautosave/autosave',
                    "Version #%versionr of content #%objectid is not a draft",
                    null, array(
                        '%versionr' => $version->attribute( 'version' ),
                        '%objectid' => $version->attribute( 'contentobject_id' )
                    )
                )
            );
        }
        if ( $version->attribute( 'creator_id' ) != eZUser::currentUserID() )
        {
            throw new RuntimeException(
                ezpI18n::tr(
                    'extension/ezautosave/autosave',
                    "You're not allowed to store a version that is not yours"
                )
            );
        }

        $editLanguage = $args[2];
        $language = eZContentLanguage::fetchByLocale( $editLanguage );
        if ( !$language instanceof eZContentLanguage )
        {
            throw new InvalidArgumentException(
                ezpI18n::tr(
                    'extension/ezautosave/autosave',
                    "Unable to load the language '%localeCode'",
                    null, array( '%localeCode' => $editLanguage )
                )
            );
        }

        $class = eZContentClass::fetch( $contentObject->attribute( 'contentclass_id' ) );

        $contentObjectAttributes = $version->contentObjectAttributes( $editLanguage );

        $validationParameters = array( 'skip-isRequired' => true );
        $attributeDataBaseName = 'ContentObjectAttribute';
        $validationResult = $contentObject->validateInput(
            $contentObjectAttributes, $attributeDataBaseName,
            false, $validationParameters
        );

        if ( $validationResult['require-fixup'] )
        {
            $contentObject->fixupInput(
                $contentObjectAttributes, $attributeDataBaseName
            );
        }

        $customValidationResult = eZContentObjectEditHandler::validateInputHandlers(
            $Module, $class, $contentObject, $version,
            $contentObjectAttributes, $version->attribute( 'version' ),
            $editLanguage, false, $validationParameters
        );

        $result['valid'] = ( $validationResult['input-validated']
                                && $customValidationResult['validated'] );

        $invalidAttributeIds = array();
        foreach( $validationResult['unvalidated-attributes'] as $info )
        {
            $invalidAttributeIds[$info['id']] = true;
            $result['unvalidated-attributes'][] = $info;
        }

        eZContentObjectEditHandler::executeInputHandlers(
            $Module, $class, $contentObject, $version, $contentObjectAttributes,
            $version->attribute( 'version' ), $editLanguage, false
        );

        $customActionAttributeArray = array();
        $fetchResult = $contentObject->fetchInput(
            $contentObjectAttributes, $attributeDataBaseName,
            $customActionAttributeArray, array()
        );

        $version->setAttribute( 'modified', time() );

        // Do not use internal draft since it simulates the saving action
        $version->setAttribute( 'status', eZContentObjectVersion::STATUS_DRAFT );

        $attributesToStore = array();
        foreach( $fetchResult['attribute-input-map'] as $id => $value )
        {
            if ( !isset( $invalidAttributeIds[$id] ) )
            {
                $result['stored-attributes'][$id] = $id;
                $attributesToStore[$id] = true;
            }
        }

        $db = eZDB::instance();
        $db->begin();
        $version->store();
        $contentObject->storeInput( $contentObjectAttributes, $attributesToStore );
        $contentObject->setName(
            $class->contentObjectName(
                $contentObject, $version->attribute( 'version' ), $editLanguage
            ),
            $version->attribute( 'version' ), $editLanguage
        );

        $db->commit();
        ezpEvent::getInstance()->notify(
            'content/cache/version',
            array( $contentObject->attribute( 'id' ), $version->attribute( 'version' ) )
        );

        $time = eZLocale::instance()->formatShortTime(
            $version->attribute( 'modified' )
        );
        $result['message_success'] = ezpI18n::tr(
            'extension/ezautosave',
            "Draft saved at %time",
            null, array( '%time' => $time )
        );
        $result['message_ago'] = ezpI18n::tr(
            'extension/ezautosave',
            "(%min minutes ago)",
            null, array( '%min' => 0 )
        );

        $result['timestamp'] = $version->attribute( 'modified' );

        return $result;
    }

    /**
     * Saves the draft and generates the preview of this draft.
     * @see self::saveDraft()
     *
     * @param array $args array( content object id, version number, locale code )
     * @return array
     */
    static public function saveDraftPreview( $args )
    {
        $result = self::saveDraft( $args );
        $object = eZContentObject::fetch( (int)$args[0] );
        $tpl = eZTemplate::factory();
        $tpl->setVariable( 'object', $object );
        $tpl->setVariable( 'version', $object->version( (int)$args[1] ) );
        $tpl->setVariable( 'locale', eZLocale::instance( $args[2] ) );
        $siteaccessList = self::getSiteaccessList( $args[2], $object );
        if ( empty( $siteaccessList ) )
        {
            $siteaccessList = array(
                eZINI::instance( 'site.ini' )->variable(
                    'SiteSettings', 'DefaultAccess'
                )
            );
        }
        $tpl->setVariable( 'default_siteaccess', current( $siteaccessList ) );
        $tpl->setVariable( 'siteaccess_list', $siteaccessList );

        $result['preview'] = $tpl->fetch( 'design:content/ajax_preview.tpl' );
        return $result;
    }

    /**
     * Returns a siteaccess list where the content object can be viewed. This
     * list is based on the locale settings and/or on the always available
     * flag of the content object.
     *
     * @param mixed $locale
     * @param eZContentObject $object
     * @return array( siteaccessName1 => siteaccessName1, ... )
     */
    protected static function getSiteaccessList( $locale, eZContentObject $object )
    {
        $ini = eZINI::instance( 'site.ini' );
        $availableSA = array_unique(
            $ini->variable( 'SiteAccessSettings', 'RelatedSiteAccessList' )
        );
        $alwaysAvailable = $object->attribute( 'always_available' );

        $dedicatedSA = array();
        $canShowSA = array();
        $showAllSA = array();
        foreach ( $availableSA as $sa )
        {
            $saINI = eZSiteAccess::getIni( $sa, 'site.ini' );
            $saLanguagesList = $saINI->variable( 'RegionalSettings', 'SiteLanguageList' );
            if ( $locale === $saINI->variable( 'RegionalSettings', 'ContentObjectLocale' )
                    || ( is_array( $saLanguagesList ) && $saLanguagesList[0] === $locale )
               )
            {
                $dedicatedSA[$sa] = $sa;
            }
            else if ( in_array( $locale, $saINI->variable( 'RegionalSettings', 'SiteLanguageList' ) ) )
            {
                $canShowSA[$sa] = $sa;
            }
            else if ( $saINI->variable( 'RegionalSettings', 'ShowUntranslatedObjects' ) === 'enabled'
                    || $alwaysAvailable
                )
            {
                $showAllSA[$sa] = $sa;
            }
        }
        return $dedicatedSA + $canShowSA + $showAllSA;
    }
}
?>
