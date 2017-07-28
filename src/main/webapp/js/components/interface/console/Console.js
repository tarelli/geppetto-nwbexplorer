define(function (require) {
    var React = require('react');
    var AbstractComponent = require('../../AComponent');
    var $ = require('jquery');
    require('jquery-ui-bundle');

    require('./SandboxConsole')(GEPPETTO);
    require('./console.less');
    require('./jsConsole.less');

    return class Console extends AbstractComponent {
        constructor(props) {
            super(props);

            // suggestions for auto-complete
            this.suggestions = [];
            // track visibility
            this.visible = false;

            var settings = {
                id: this.props.id + "_component"
            };

            this.state = {
                settings: $.extend(settings, this.props.settings)
            };
        }

        /**
         * Matches user input in console to terms in tags map, this to retrieve suggestions
         * for autocompletion.
         *
         * @param {String} request - User input
         * @param {Object} response - Object to give back response with suggestions to autocomplete
         */
        matches(request, response) {
            var path = request.term.split(".");
            var depth = path.length;
            var node = GEPPETTO.CommandController.availableTags();
            var avail = [];

            var nodePath = "";
            // descent into the path tree to get a list of suggestions
            for (var n = 1; n <= depth && typeof node !== "undefined"; n++) {
                var cur = path[n - 1];
                if (node[cur] != null || node[cur] != undefined) {
                    node = node[cur];
                    nodePath = nodePath.concat(cur) + ".";
                }
            }

            if (nodePath == "") {
                nodePath = nodePath.substring(0, nodePath.length - 1);
            }

            if (avail.length == 0 && nodePath == (request.term + ".")) {
                avail.push(nodePath.substring(0, nodePath.length - 1));
            }


            // build a regex with the last directory entry being typed
            var last = path.pop();
            try {
                var re = new RegExp("^" + last + ".*", "i");

                // filter suggestions by matching with the regex
                for (var k in node) {
                    if (k.match(re)) avail.push(nodePath + k);
                }

                //save suggestions for request term
                this.suggestions = avail;
            }
            catch (e) {

            }

            // delegate back to autocomplete, but extract the last term
            response($.ui.autocomplete.filter(avail, last));
        }

        // Handles autocomplete functionality for the console
        autoComplete() {
            var that = this;
            var autocompleteOn = true;
            GEPPETTO.CommandController.populateDefaultTags();

            var commandInputAreaEl = $("#" + this.props.id + "_component #commandInputArea");
            //bind console input area to autocomplete event
            commandInputAreaEl.bind("keydown", function (event) {
                if (event.keyCode === $.ui.keyCode.TAB &&
                    $(this).data("ui-autocomplete").menu.active) {
                    event.preventDefault();
                }
                if (event.keyCode === $.ui.keyCode.BACKSPACE) {
                    autocompleteOn = false;
                }
            })
                .autocomplete({
                    minLength: 0,
                    delay: 0,
                    source: that.matches.bind(that),
                    focus: function () {
                        // prevent value inserted on focus
                        return false;
                    },
                    open: function (event, ui) {
                        if (autocompleteOn) {
                            var suggestions = $(this).data("uiAutocomplete").menu.element[0].children
                                , firstElement = suggestions[0]
                                , inpt = commandInputAreaEl
                                , original = inpt.val()
                                , firstElementText = $(firstElement).text()
                                , suggestionsSize = suggestions.length;
                            /*
                             here we want to make sure that we're not matching something that doesn't start
                             with what was typed in
                             */
                            if (firstElementText.toLowerCase().indexOf(original.toLowerCase()) === 0) {

                                //only one suggestion
                                if (suggestionsSize == 1) {
                                    if (inpt.val() !== firstElementText) {
                                        inpt.val(firstElementText); //change the input to the first match

                                        inpt[0].selectionStart = original.length; //highlight from beginning of input
                                        inpt[0].selectionEnd = firstElementText.length;//highlight to the end
                                    }
                                }
                                //match multiple suggestions
                                else {
                                    if (inpt.val() !== "") {

                                        var elementsText = [];
                                        for (var i = 0; i < suggestionsSize; i++) {
                                            elementsText[i] = $(suggestions[i]).text();
                                        }
                                        var A = elementsText.slice(0).sort(),
                                            word1 = A[0], word2 = A[A.length - 1],
                                            i = 0;
                                        if (word1 != word2) {
                                            while (word1.charAt(i) == word2.charAt(i))++i;
                                            //match up most common part
                                            mostCommon = word1.substring(0, i);
                                        }
                                        else {
                                            mostCommon = word1;
                                        }

                                        if (inpt.val().indexOf(mostCommon) == -1) {
                                            inpt.val(mostCommon);//change the input to the first match

                                            inpt[0].selectionStart = original.length; //highlight from end of input
                                            inpt[0].selectionEnd = mostCommon.length;//highlight to the end
                                        }
                                    }
                                }
                            }
                        } else {
                            autocompleteOn = true;
                        }
                    }
                });
        }

        /**
         * Global help functions with all commands in global objects.
         *
         * @returns {String} - Message with help notes.
         */
        help () {
            var map = GEPPETTO.CommandController.getHelpObjectsMap();

            var helpMsg = "";

            for (var g in map) {
                helpMsg += '\n\n' + map[g];
            }

            return helpMsg;
        }

        toggleImplicitCommands () {
            var cur = this.getConsole().showImplicitCommands;
            this.getConsole().showImplicitCommands = !cur;
            return "showImplicitCommands = " + !cur;
        }

        /**
         * Creates Javascript Console
         */
        createConsole () {
            var consoleElement = $("#" + this.props.id + "_component #" +  this.props.id + "_console");
            var inputCmdElSelector = "#" + this.props.id + "_component #commandInputArea";
            // Create the sandbox console:
            var that = this;
            this.console = new GEPPETTO.SandboxConsole.View({
                el: consoleElement,
                model: new GEPPETTO.SandboxConsole.Model(),
                resultPrefix: "  => ",
                tabCharacter: "\t",
                placeholder: "// type a javascript command and hit enter (help() for info)",
                inputCommandAreaElSelector: inputCmdElSelector,
                consoleComponent: that
            });

            this.autoComplete();

            //remove drop down menu that comes automatically with autocomplete
            $("#" + this.props.id + "_component #commandInputArea").focus(function () {
                $('.ui-menu').remove();
            });

            var sendMessage = setInterval(function () {
                if (GEPPETTO.MessageSocket.isReady() == 1) {
                    GEPPETTO.MessageSocket.send("geppetto_version", null);
                    clearInterval(sendMessage);
                }
            }, 100);

            return console;
        }

        consoleHistory () {
            return this.getConsole().model.get('history');
        }

        getConsole () {
            return this.console;
        }

        isConsoleVisible () {
            return this.visible;
        }

        /**
         * Log debug messages to Geppetto's console if debug mode is on
         */
        debugLog (message) {
            if (GEPPETTO.G.isDebugOn()) {
                this.getConsole().debugLog(message);
            }
        }

        /**
         * Logs messages to console without need for debug mode to be on
         */
        log (message) {
            this.getConsole().showMessage(message);
        }

        /**
         * Executes commands to console. Implicit commands only
         * shown in debug mode, or if showImplicitCommands true.
         */
        executeCommand (command, isImplicit = false) {
            this.getConsole().executeCommand(command, isImplicit);
            var justCommand = command.substring(0, command.indexOf("("));
            var commandParams = command.substring(command.indexOf("(") + 1, command.lastIndexOf(")"));
            GEPPETTO.trackActivity(this.getId(), justCommand, commandParams);
        }

        executeImplicitCommand (command) {
            this.executeCommand(command, true);
        }

        /**
         * Gets available suggestions already narrowed down from list of tags
         */
        availableSuggestions () {
            return this.suggestions;
        }

        /**
         * Gets available commands
         * @returns {*|Array}
         */
        avaialbleCommands () {
            return GEPPETTO.CommandController.availableCommands();
        }

        componentDidUpdate() {
            // NOTE: nothing here for now as we are not using react render flow
        }

        componentDidMount() {
            this.createConsole();
        }

        render() {
            return (
                <div key={this.props.id + "_component"} id={this.props.id + "_component"} className="consoleContainer">
                    <div id={this.props.id + "_console"} className="consoleElement"></div>
                </div>
            )
        }
    };
});
