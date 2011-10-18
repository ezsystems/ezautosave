<?php
//
// Definition of qhASServerFunctions class
//
// Created on: <18-Oct-2011 00:00:00>
//
// ## BEGIN COPYRIGHT, LICENSE AND WARRANTY NOTICE ##
// SOFTWARE NAME: QH AutoSave
// SOFTWARE RELEASE: 1.0
// COPYRIGHT NOTICE: Copyright (C) 2011-2012 NGUYEN DINH Quoc-Huy
// SOFTWARE LICENSE: GNU General Public License v2.0
// NOTICE: >
//   This program is free software; you can redistribute it and/or
//   modify it under the terms of version 2.0  of the GNU General
//   Public License as published by the Free Software Foundation.
//
//   This program is distributed in the hope that it will be useful,
//   but WITHOUT ANY WARRANTY; without even the implied warranty of
//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//   GNU General Public License for more details.
//
//   You should have received a copy of version 2.0 of the GNU General
//   Public License along with this program; if not, write to the Free
//   Software Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston,
//   MA 02110-1301, USA.
//
//
// ## END COPYRIGHT, LICENSE AND WARRANTY NOTICE ##
//

/*
 * ezjscServerFunctions for qhautosave
 */
class qhASServerFunctions extends ezjscServerFunctions
{
    /**
     * Load INI configuration for the autosave feature
     *
     * @return JSON 
     */
    public static function configload()
    {
        $ini = eZINI::instance( 'qhautosave.ini' );
	$qhAutosaveConfig = array();

	if( $ini->hasVariable( 'AutosaveSettings', 'AutosaveInterval' ) )
		$qhAutosaveConfig['autosave_interval'] = $ini->variable( 'AutosaveSettings', 'AutosaveInterval' );
		else $qhAutosaveConfig['autosave_interval'] = 15000;

	if( $ini->hasVariable( 'AutosaveSettings', 'WarnOnUnload' ) )
		$qhAutosaveConfig['warn_on_unload'] = ( $ini->variable( 'AutosaveSettings', 'WarnOnUnload' ) == 'enabled' ? true : false );
		else $qhAutosaveConfig['warn_on_unload'] = true;

	if( empty( $qhAutosaveConfig[ 'autosave_interval' ] ) )
		$qhAutosaveConfig[ 'autosave_interval' ] = 15000;

	if( !is_bool( $qhAutosaveConfig['warn_on_unload'] ) )
		$qhAutosaveConfig['warn_on_unload'] = true;
	
        $jsOutput = json_encode( $qhAutosaveConfig );

        return $jsOutput;
    }

}

?>
