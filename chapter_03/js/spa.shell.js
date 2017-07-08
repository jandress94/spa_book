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
            is_chat_retracted: true
        },
        jqueryMap = {},

        setJqueryMap, toggleChat, onClickChat, initModule;

    //------------BEGIN DOM METHODS-------------------
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
    onClickChat = function (event) {
        toggleChat(stateMap.is_chat_retracted);
        return false;
    };

    //-------------BEGIN PUBLIC METHODS---------------
    initModule = function ($container) {
        // load HTML and map jQuery collections
        stateMap.$container = $container;
        $container.html(configMap.main_html);
        setJqueryMap();

        // test toggle chat slider
        stateMap.is_chat_retracted = true;
        jqueryMap.$chat
            .attr('title', configMap.chat_retracted_title)
            .click(onClickChat);
    };

    return {initModule: initModule};
}());