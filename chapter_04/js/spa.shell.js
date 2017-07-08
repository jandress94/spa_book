/*
 * spa.shell.js
 * shell module for SPA
 */

/*jslint
  browser : true, continue : true, devel : true, indent : 4, maxerr : 50, newcap : true, nomen : true, plusplus : true,
  regexp : true, sloppy : true, vars : true, white : true
*/
/*global $, spa */

spa.shell = (function () {
    //----------BEGIN MODULE SCOPE VARIABLES-------------
    var
        configMap = {
            resize_interval: 200,
            anchor_schema_map : {
                chat : {opened: true, closed: true}
            },
            main_html : String() 
                            + '<div class="spa-shell-head">'
                                + '<div class="spa-shell-head-logo"></div>'
                                + '<div class="spa-shell-head-acct"></div>'
                                + '<div class="spa-shell-head-search"></div>'
                            + '</div>'
                            + '<div class="spa-shell-main">'
                                + '<div class="spa-shell-main-nav"></div>'
                                + '<div class="spa-shell-main-content"></div>'
                            + '</div>'
                            + '<div class="spa-shell-foot"></div>'
                            + '<div class="spa-shell-modal"></div>'
        },
        stateMap = {
            $container: undefined,
            anchor_map: {},
            resize_idto: undefined
        },
        jqueryMap = {},

        copyAnchorMap, setJqueryMap, changeAnchorPart, onHashChange, onResize, setChatAnchor, initModule;

    //------------BEGIN UTILITY METHODS---------------
    copyAnchorMap = function () {
        return $.extend(true, {}, stateMap.anchor_map);
    };

    //------------BEGIN DOM METHODS-------------------
    /* Function: changeAnchorPart
     * purpose: changes part of the URI anchor component
     * params:
     *      - arg_map - the map describing what part of the URI anchor we want changed
     * returns: boolean
     *      - true - the anchor portion of the URI was updated
     *      - false - the anchor portion of the URI could not be updated
     * action: 
     *      The current anchor rep stored in stateMap.anchor_map.
     *      See uriAnchor for a discussion of encoding.
     *      This method
     *          - creates a copy of this map using copyAnchorMap()
     *          - modifies the key-values using arg_map
     *          - manages the distinction between independent and dependent values in the encoding
     *          - attempts to change the URI using uriAnchor
     *          - returns true on success and false on failure
     */
    changeAnchorPart = function (arg_map) {
        var
            anchor_map_revise = copyAnchorMap(),
            bool_return = true,
            key_name, key_name_dep;

        //begin merge changes into anchor map
        KEYVAL:
        for (key_name in arg_map) {
            if (arg_map.hasOwnProperty(key_name)) {
                // skip dependent keys during iteration
                if (key_name.indexOf('_') === 0) {
                    continue KEYVAL;
                }

                // update independent key value
                anchor_map_revise[key_name] = arg_map[key_name];

                // update matching dependent key
                key_name_dep = '_' + key_name;
                if (arg_map[key_name_dep]) {
                    anchor_map_revise[key_name_dep] = arg_map[key_name_dep];
                } else {
                    delete anchor_map_revise[key_name_dep];
                    delete anchor_map_revise['_s' + key_name_dep];
                }
            }
        }

        // begin attempt to update URI; revert if not successful
        try {
            $.uriAnchor.setAnchor(anchor_map_revise);
        } catch (error) {
            // replace URI with existing state
            $.uriAnchor.setAnchor(stateMap.anchor_map, null, true);
            bool_return = false;
        }

        return bool_return;
    };

    setJqueryMap = function () {
        var $container = stateMap.$container;
        jqueryMap = {
            $container: $container
        };
    };

    //-------------BEGIN EVENT HANDLERS---------------
    /* Function: onHashChange
     * purpose: handles the hashchange event
     * params:
     *      - event - jQuery event object
     * settings: none
     * returns: false
     * action:
     *      - parses the URI anchor component
     *      - compares proposed application state with current
     *      - adjust the application only where proposed state differs from existing and is allowed by anchor schema
     */
    onHashChange = function (event) {
        var
            _s_chat_previous, _s_chat_proposed, s_chat_proposed,
            anchor_map_proposed,
            is_ok = true,
            anchor_map_previous = copyAnchorMap();

        // attempt to parse anchor
        try {
            anchor_map_proposed = $.uriAnchor.makeAnchorMap();
        } catch (error) {
            $.uriAnchor.setAnchor(anchor_map_previous, null, true);
            return false;
        }
        stateMap.anchor_map = anchor_map_proposed;

        // convenience vars
        _s_chat_previous = anchor_map_previous._s_chat;
        _s_chat_proposed = anchor_map_proposed._s_chat;

        // begin adjust chat component if changed
        if (!anchor_map_previous || _s_chat_previous !== _s_chat_proposed) {
            s_chat_proposed = anchor_map_proposed.chat;
            switch (s_chat_proposed) {
                case 'opened':
                    is_ok = spa.chat.setSliderPosition('opened');
                    break;
                case 'closed':
                    is_ok = spa.chat.setSliderPosition('closed');
                    break;
                default:
                    spa.chat.setSliderPosition('closed');
                    delete anchor_map_proposed.chat;
                    $.uriAnchor.setAnchor(anchor_map_proposed, null, true);
            }
        }

        // begin revert anchor if slider change denied
        if (!is_ok) {
            if (anchor_map_previous) {
                $.uriAnchor.setAnchor(anchor_map_previous, null, true);
                stateMap.anchor_map = anchor_map_previous;
            } else {
                delete anchor_map_proposed.chat;
                $.uriAnchor.setAnchor(anchor_map_proposed, null, true);
            }
        }

        return false;
    };

    onResize = function () {
        if (stateMap.resize_idto) {
            return true;
        }

        spa.chat.handleResize();
        stateMap.resize_idto = setTimeout(
            function () { stateMap.resize_idto = undefined; },
            configMap.resize_interval
        );
        return true;
    };

    //-------------BEGIN CALLBACKS--------------------
    /* Function: setChatAnchor
     * example: setChatAnchor('closed');
     * purpose: change the chat component of the anchor
     * params:
     *      - position_type - may be 'closed' or 'opened'
     * actions:
     *      - changes the URI anchor parameter 'chat' to the requested value if possible
     * returns: boolean
     *      - true - requested anchor part was updated
     *      - false - requested anchor part was not updated
     * throws: none
     */
    setChatAnchor = function (position_type) {
        return changeAnchorPart({ chat: position_type });
    }

    //-------------BEGIN PUBLIC METHODS---------------
    /* Function: initModule
     * example spa.shell.initModule($('#app_div_id'));
     * purpose: directs the shell to offer its capability to the user
     * params:
     *      - $container - a jQuery collection that should represent a single DOM container
     * actions:
     *      - Populates $container with the shell of the UI and then configures and initializes feature modules.
     *      - The shell is also responsible for browser-wide issues such as URI anchor and cookie management.
     * returns: none
     * throws: none
     */
    initModule = function ($container) {
        // load HTML and map jQuery collections
        stateMap.$container = $container;
        $container.html(configMap.main_html);
        setJqueryMap();

        // configure uriAnchor to use our schema
        $.uriAnchor.configModule({ schema_map: configMap.anchor_schema_map });

        // configure and initialize feature modules
        spa.chat.configModule({
            set_chat_anchor: setChatAnchor,
            chat_model: spa.model.chat,
            people_model: spa.model.people
        });
        spa.chat.initModule(jqueryMap.$container);

        /* handle URI anchor change events.
         * this is done after all feature modules are configured
         * and initialized, otherwise the will not be ready to handle
         * the trigger event, which is used to ensure the anchor
         * is considered on-load
         */
        $(window)
            .bind('resize', onResize)
            .bind('hashchange', onHashChange)
            .trigger('hashchange');
    };

    return {initModule: initModule};
}());