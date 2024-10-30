<?php
/*
Plugin Name: LFE online courses
Plugin URI: http://lfe.com
Description: Create online courses and sell directly from your website.
Version: 1.0.0
Author: LFE.com
Author URI: http://lfe.com
License: GPL2
*/

/*  Copyright 2014  LFE team  (email : support@lfe.com)

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License, version 2, as 
    published by the Free Software Foundation.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program; if not, write to the Free Software
    Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

/*GUID generation*/
function gen_uuid() {
    return sprintf( '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        // 32 bits for "time_low"
        mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff ),

        // 16 bits for "time_mid"
        mt_rand( 0, 0xffff ),

        // 16 bits for "time_hi_and_version",
        // four most significant bits holds version number 4
        mt_rand( 0, 0x0fff ) | 0x4000,

        // 16 bits, 8 bits for "clk_seq_hi_res",
        // 8 bits for "clk_seq_low",
        // two most significant bits holds zero and one for variant DCE1.1
        mt_rand( 0, 0x3fff ) | 0x8000,

        // 48 bits for "node"
        mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff )
    );
}

/*Adding plugin and buttons to TinyMCE*/
function lfew_addbuttons() {
    // Only do this stuff when the current user has permissions and we are in Rich Editor mode
    if ( ( current_user_can('edit_posts') || current_user_can('edit_pages') ) && get_user_option('rich_editing') ) {
        add_filter("mce_external_plugins", "lfew_register_plugin");
        add_filter('mce_buttons', 'lfew_register_button');
    }
}

function lfew_register_button($buttons)
{
    array_push($buttons, "separator", "lfewidget");
    return $buttons;
}

function lfew_register_plugin($plugin_array)
{
    $plugin_array['lfewidget'] = plugins_url("tinymce-plugin/lfe.widget.js" ,__FILE__);
    return $plugin_array;
}

add_action('init', 'lfew_addbuttons');

/*Activate/deactivate the addon*/
function deactivate_addon()
{
    $guid_option_name = "lfeguid";
    $base_url = get_option('base_url');

    //file_get_contents
    wp_remote_get($base_url.'/WidgetEndPoint/Plugin/UnInstall?'.http_build_query(array(
            'uid' => get_option($guid_option_name)
        )));
    delete_option("lfeguid");
}

register_deactivation_hook( __FILE__, 'deactivate_addon' );

function activate_addon()
{
    $guid_option_name = "lfeguid";
    $base_url_option_name = "base_url";

    if (!get_option($guid_option_name)) {
        add_option($guid_option_name, gen_uuid());
    }

    $base_url = 'http://apps.lfe.com';
    if(get_option($base_url_option_name)) {
        update_option($base_url_option_name, $base_url);
    } else {
        add_option($base_url_option_name, $base_url);
    }

    //file_get_contents
    wp_remote_get($base_url.'/WidgetEndPoint/Plugin/Install?'.http_build_query(array(
            'uid' => get_option($guid_option_name),
            'domain' => get_site_url(),
            'type' => 3,
            'version' => get_bloginfo('version'),
            'pluginVersion' => "1.0.0"
        )));
}

/*Pass option to JS*/
register_activation_hook( __FILE__, 'activate_addon' );

function my_admin_head() {
    $guid = get_option("lfeguid");
    $base_url = get_option("base_url");
    ?>

    <script type='text/javascript'>
        var lfe = {
            'guid': '<?php echo $guid; ?>',
            'base_url': '<?php echo $base_url; ?>',
            'options_url': '<?php echo admin_url('admin.php?page=lfe-widget-options'); ?>'
        };
    </script>
<?php
}

foreach ( array('post.php','post-new.php') as $hook ) {
    add_action( "admin_head-$hook", 'my_admin_head' );
}

/*Adding options button to the admin menu*/
add_action( 'admin_menu', 'my_plugin_menu' );

function my_plugin_menu() {
    add_menu_page( 'LFE Widget Options', 'LFE Widget', 'manage_options',
        'lfe-widget-options', 'lfe_widget_options', plugin_dir_url( __FILE__ ).'tinymce-plugin/images/icon.png' );
}

function lfe_widget_options() {
    if ( !current_user_can( 'manage_options' ) )  {
        wp_die( __( 'You do not have sufficient permissions to access this page.' ) );
    }
    echo '<div class="wrap">';
    echo '<iframe style="width: 100%;height: 1100px;" src="'.get_option("base_url")
        ."/WidgetEndPoint/".get_option("lfeguid").'" ></iframe>';
    echo '</div>';
}

?>