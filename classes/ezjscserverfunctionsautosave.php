<?php
/**
 * File containing the ezjscServerFunctionsAutosave class.
 *
 * @copyright Copyright (C) 1999-2011 eZ Systems AS. All rights reserved.
 * @license http://ez.no/licenses/gnu_gpl GNU GPL v2
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
        $result = array(
            'unvalidated-attributes' => array(),
            'stored-attributes' => array(),
            'valid' => true,
        );

        // workaround to the eZContentObjectEditHandler API that needs a Module
        $Module = false; 

        if ( count( $args ) != 3 )
        {
            throw new InvalidArgumentException(
                ezpI18n::tr(
                    'extension/ezjscore/autosave',
                    'This action requires 3 parameters'
                )
            );
        }
        if ( $_SERVER['REQUEST_METHOD'] !== 'POST' || count( $_POST ) === 0 )
        {
            throw new InvalidArgumentException(
                ezpI18n::tr(
                    'extension/ezjscore/autosave',
                    "No POST data found, it\'s probably because you tried to upload a too big file"
                )
            );
        }
        $contentObject = eZContentObject::fetch( (int)$args[0] );
        if ( !$contentObject instanceof eZContentObject )
        {
            throw new InvalidArgumentException(
                ezpI18n::tr(
                    'extension/ezjscore/autosave',
                    'Unable to load the content #%objectid',
                    null, array( '%objectid' => (int)$args[0] )
                )
            );
        }

        if ( $contentObject->attribute( 'status' ) == eZContentObject::STATUS_ARCHIVED )
        {
            throw new InvalidArgumentException(
                ezpI18n::tr(
                    'extension/ezjscore/autosave',
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
                    'extension/ezjscore/autosave',
                    'Unable to load version #%versionr of content #%objectid',
                    null, array(
                        '%versionnr' => (int)$args[1],
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
                    'extension/ezjscore/autosave',
                    "Version #%versionr of content #%objectid is not a draft",
                    null, array(
                        '%versionnr' => $version->attribute( 'version' ),
                        '%objectid' => $version->attribute( 'contentobject_id' )
                    )
                )
            );
        }
        if ( $version->attribute( 'creator_id' ) != eZUser::currentUserID() )
        {
            throw new RuntimeException(
                ezpI18n::tr(
                    'extension/ezjscore/autosave',
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
                    'extension/ezjscore/autosave',
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

        return $result;
    }
}
?>
