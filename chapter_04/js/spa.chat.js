/*jslint
  browser : true, continue : true, devel : true, indent : 4, maxerr : 50, newcap : true, nomen : true, plusplus : true,
  regexp : true, sloppy : true, vars : true, white : true
*/
/*global $, spa */

spa.chat = (function () {
    var
        configMap = {
            main_html: String()
                            + '<div style="padding:1em; color:#fff;">'
                            + '    Say hello to chat'
                            + '</div>',
            settable_map: {}
        },
        stateMap = {$container: null},
        jqueryMap = {},

        setJqueryMap, configModule, initModule;

    //---------------BEGIN DOM METHODS--------------------
    setJqueryMap = function () {
        var $container = stateMap.$container;
        jqueryMap = {$container: $container};
    };

    //---------------BEGIN PUBLIC METHODS------------------
    /* Function: configModule
     * purpose: adjust configuration of allowed keys
     * params:
     *      - color_name - color to use
     * settings:
     *      - configMap.settable_map declares allowed keys
     * returns: true
     * throws: none
     */
    configModule = function (input_map) {
        spa.util.setConfigMap({
            input_map: input_map,
            settable_map: configMap.settable_map,
            config_map: configMap
        });
        return true;
    };

    /* Function: initModule
     * purpose: initializes module
     * params:
     *      - $container - the jquery element used by this feature
     * returns: true
     * throws: none
     */
    initModule = function ($container) {
        $container.html(configMap.main_html);
        stateMap.$container = $container;
        setJqueryMap();
        return true;
    };

    // return public methods
    return {
        configModule: configModule,
        initModule: initModule
    };
}());