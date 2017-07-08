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
            anchor_schema_map : {
                chat : {open: true, closed: true}
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
                            + '<div class="spa-shell-chat"></div>'
                            + '<div class="spa-shell-modal"></div>',
            chat_extend_time: 1000,
            chat_retract_time: 300,
            chat_extend_height: 450,
            chat_retract_height: 30,
            chat_extended_title: 'Click to retract',
            chat_retracted_title: 'Click to extend'
        },
        stateMap = {
            $container : null,
            anchor_map: {},
            is_chat_retracted: true
        },
        jqueryMap = {},

        copyAnchorMap, setJqueryMap, toggleChat, changeAnchorPart, onHashChange, onClickChat, initModule;

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
            $container: $container,
            $chat: $container.find('.spa-shell-chat')
        };
    };

    /* Function: toggleChat
     * Purpose: extends or retracts chat slider
     * params:
     *      - do_extend - if true, extends slider; if false retracts
     *      - callback - optional function to eecute at end of animation
     * state: sets stateMap.is_chat_retracted
     *      - true - slider is retracted
     *      - false - slider is extended
     * settings:
     *      - chat_extend/retract_time/height
     * returns: boolean
     *      - true - slider animation activated
     *      - false - slider animation not activated
     */
    toggleChat = function (do_extend, callback) {
        var
            px_chat_ht = jqueryMap.$chat.height(),
            is_open = px_chat_ht === configMap.chat_extend_height,
            is_closed = px_chat_ht === configMap.chat_retract_height,
            is_sliding = !is_open && !is_closed;

        // avoid race conditions
        if (is_sliding) {
            return false;
        }

        // begin extend chat slider
        if (do_extend) {
            jqueryMap.$chat.animate(
                {height: configMap.chat_extend_height},
                configMap.chat_extend_time,
                function () {
                    jqueryMap.$chat.attr('title', configMap.chat_extended_title);
                    stateMap.is_chat_retracted = false;
                    if (callback) {
                        callback(jqueryMap.$chat);
                    }
                }
            );
            return true;
        }

        //begin retract chat slider
        jqueryMap.$chat.animate(
            {height: configMap.chat_retract_height},
            configMap.chat_retract_time,
            function () {
                jqueryMap.$chat.attr('title', configMap.chat_retracted_title);
                stateMap.is_chat_retracted = true;
                if (callback) {
                    callback(jqueryMap.$chat);
                }
            }
        );
        return true;
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
     *      - adjust the application only where proposed state differs from existing
     */
    onHashChange = function (event) {
        var
            anchor_map_previous = copyAnchorMap(),
            anchor_map_proposed,
            _s_chat_previous, _s_chat_proposed, s_chat_proposed;

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
                case 'open':
                    toggleChat(true);
                    break;
                case 'closed':
                    toggleChat(false);
                    break;
                default:
                    toggleChat(false);
                    delete anchor_map_proposed.chat;
                    $.uriAnchor.setAnchor(anchor_map_proposed, null, true);
            }
        }

        return false;
    };

    onClickChat = function (event) {
        changeAnchorPart({ chat: (stateMap.is_chat_retracted ? 'open' : 'closed') });
        return false;
    };

    //-------------BEGIN PUBLIC METHODS---------------
    initModule = function ($container) {
        // load HTML and map jQuery collections
        stateMap.$container = $container;
        $container.html(configMap.main_html);
        setJqueryMap();

        // setup initial state and bind click event handler
        stateMap.is_chat_retracted = true;
        jqueryMap.$chat
            .attr('title', configMap.chat_retracted_title)
            .click(onClickChat);

        // configure uriAnchor to use our schema
        $.uriAnchor.configModule({ schema_map: configMap.anchor_schema_map });

        /* handle URI anchor change events.
         * this is done after all feature modules are configured
         * and initialized, otherwise the will not be ready to handle
         * the trigger event, which is used to ensure the anchor
         * is considered on-load
         */
        $(window)
            .bind('hashchange', onHashChange)
            .trigger('hashchange');
    };

    return {initModule: initModule};
}());