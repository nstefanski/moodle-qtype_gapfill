// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * JavaScript code for the gapfill question type.
 *
 * @package    qtype_gapfill
 * @copyright  2017 Marcus Green
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
/* global $ */
/* jshint unused:false*/


/* The data is stored in a hidden field */
var settingsdata = ($("[name='itemsettings']").val());

var settings = [];
var gaps = [];
if (settingsdata > "") {
    var obj = JSON.parse(settingsdata);
    for (var o in obj) {
        settings.push(obj[o]);
    }
}

function Item(text, delimitchars) {
    this.questionid = $("input[name=id]").val();
    this.gaptext = text;
    this.delimitchars = delimitchars;
    /* The l and r is for left and right */
    this.l = delimitchars.substr(0, 1);
    this.r = delimitchars.substr(1, 1);
    this.len = this.gaptext.length;
    this.startchar = this.gaptext.substring(0, 1);
    /* For checking if the end char is the right delimiter */
    this.endchar = this.gaptext.substring(this.len - 1, this.len);
    this.gaptext_nodelim = '';
    this.feedback = {};
    this.instance = 0;
    this.feedback.correct = $("#id_corecteditable").html();
    this.feedback.incorrect = $("#id_incorrecteditable").html();
    Item.prototype.striptags = function(gaptext) {
        /* This is not a perfect way of stripping html but it may be good enough */
        if (gaptext === undefined) {
            return "";
        }
        var regex = /(<([^>]+)>)/ig;
        return gaptext.replace(regex, "");
    };
    this.stripdelim = function() {
        if (this.startchar === this.l) {
            this.gaptext_nodelim = this.gaptext.substring(1, this.len);
        }
        if (this.endchar === this.r) {
            var len = this.gaptext_nodelim.length;
            this.gaptext_nodelim = this.gaptext_nodelim.substring(0, len - 1);
        }
        return this.gaptext_nodelim;
    };
    var itemsettings = [];
    Item.prototype.get_itemsettings = function(target) {
        var itemid = target.id;
        var underscore = itemid.indexOf("_");
        /* The instance, normally 0 but incremented if a gap has the same text as another
         * instance is not currently used*/
        this.instance = itemid.substr(underscore + 1);
        for (var set in settings) {
            text = this.stripdelim();
            if (settings[set].gaptext === text) {
                itemsettings = settings[set];
            }
        }
        return itemsettings;
    };
    this.update_json = function(e) {
        var found = false;
        var id = e.target.id;
        for (var set in settings) {
            if (settings[set].gaptext === this.stripdelim()) {
                settings[set].correctfeedback = $("#id_correcteditable")[0].innerHTML;
                settings[set].incorrectfeedback = $("#id_incorrecteditable")[0].innerHTML;
                found = true;
            }
        }
        if (found === false) {
            /* If there is no record for this word add one */
            var itemsettings = {
                itemid: id,
                questionid: $("input[name=id]").val(),
                correctfeedback: $("#id_correcteditable").html(),
                incorrectfeedback: $("#id_incorrecteditable").html(),
                gaptext: this.stripdelim()
            };
            settings.push(itemsettings);
        }
        return JSON.stringify(settings);
    };
}


/* A click on the button */
$("#id_itemsettings_button").on("click", function() {
    var atto_islive = ($(".editor_atto")).length;
    /* Show error if Atto is not loaded. It might be because the page has not finished loading
     * or because plain text elements are being used or (perhaps less likely as time goes on)
     * the HTMLarea editor is being used. It might be possible to work with those other editors
     * but limiting to Atto keeps things straightforward and maintainable.
     */
    if (atto_islive < 1) {
        $("#id_error_itemsettings_button").css({'display': 'inline', 'color': 'red'});
        $("#id_error_itemsettings_button")[0].innerHTML = M.util.get_string("itemsettingserror", "qtype_gapfill");
        return;
    }
    $("#questiontext .atto_html_button").attr("disabled", 'true');
    if ($('#id_questiontexteditable').get(0).isContentEditable) {
        $("#id_questiontexteditable").attr('contenteditable', 'false');
        $("#fitem_id_questiontext").find('button').attr("disabled", 'true');
        var settingformheight = $("#id_questiontexteditable").css("height");
        var settingformwidth = $("#id_questiontexteditable").css("width");
        $("#id_questiontexteditable").css("display", 'none');
        /* Copy the styles from attos editable area so the canvas looks the same (except gray) */
        $('#id_itemsettings_canvas').css(copyStyles($("#id_questiontexteditable")));
        var ed = $("#id_questiontexteditable").closest(".editor_atto_content_wrap");
        $("#id_itemsettings_canvas").appendTo(ed).css("position", "relative");
        $("#id_itemsettings_canvas").css({
            "display": "block",
            "background": "lightgrey"
        });

        /* Copy the real html to the feedback editing html */
        $("#id_itemsettings_canvas").html($("#id_questiontexteditable").prop("innerHTML"));
        $("#id_itemsettings_canvas").css({height: settingformheight, width: settingformwidth});
        $("#id_itemsettings_canvas").css({height: "100%", width: "100%"});
        $("#id_itemsettings_button").html(M.util.get_string("editquestiontext", "qtype_gapfill"));
        /* Setting the height by hand gets around a quirk of MSIE */
        $('#id_itemsettings_canvas').height($("#id_questiontexteditable").height());
        /* Disable the buttons on questiontext but not on the feedback form */
        /* wrapContent should be the last on this block as it sometimes falls over with an error */
        wrapContent($("#id_itemsettings_canvas")[0]);

    } else {
        $("#id_questiontexteditable").css({display: "block", backgroundColor: "white"});
        $("#id_questiontexteditable").attr('contenteditable', 'true');
        $("#id_itemsettings_canvas").css("display", "none");
        $("#fitem_id_questiontext").find('button').removeAttr("disabled");
        $("#id_settings_popup").css("display", "none");
        $("#id_itemsettings_button").html(M.util.get_string("additemsettings", "qtype_gapfill"));
        $('[class^=atto_]').removeAttr("disabled");

    }
});

/* A click on the text */
$("#id_itemsettings_canvas").on("click", function(e) {
    /*
     * questiontext needs to be edditable and the target must start
     * with id followed by one or more digits and an underscore
     * */
    if (!$('#id_questiontexteditable').get(0).isContentEditable && (e.target.id.match(/^id[0-9]+_/))) {
        var delimitchars = $("#id_delimitchars").val();
        var item = new Item(e.target.innerHTML, delimitchars);
        var itemsettings = item.get_itemsettings(e.target);
        if (itemsettings === null || itemsettings.length === 0) {
            $("#id_correcteditable").html('');
            $("#id_incorrecteditable").html('');
        } else {
            $("#id_correcteditable").html(itemsettings.correctfeedback);
            $("#id_incorrecteditable").html(itemsettings.incorrectfeedback);
        }
        $("label[for*='id_correct']").text(M.util.get_string("correct", "qtype_gapfill"));
        $("label[for*='id_incorrect']").text(M.util.get_string("incorrect", "qtype_gapfill"));
        $('#id_itemsettings_popup .atto_image_button').attr("disabled", 'true');
        $('#id_itemsettings_popup .atto_media_button').attr("disabled", 'true');
        $('#id_itemsettings_popup .atto_managefiles_button').attr("disabled", 'true');
        var title = M.util.get_string("additemsettings", "qtype_gapfill");
        /* the html jquery call will turn any encoded entities such as &gt; to html, i.e. > */
        title += ': ' + $("<div/>").html(item.stripdelim()).text();
        require(['jquery', 'jqueryui'], function($, jqui) {
            $("#id_itemsettings_popup").dialog({
                position: {
                    my: 'right',
                    at: 'right',
                    of: "#id_itemsettings_canvas"
                },
                height: 500,
                width: "70%",
                modal: false,
                title: title,
                buttons: [
                    {
                        text: "OK",
                        click: function() {
                            var JSONstr = item.update_json(e);
                            $('[class^=atto_]').removeAttr("disabled");
                            $("[name='itemsettings']").val(JSONstr);
                            $(".ui-dialog-content").dialog("close");
                            /* Set editable to true as it is checked at the start of click */
                            $("#id_questiontexteditable").attr('contenteditable', 'true');
                            $("#id_itemsettings_button").click();
                        }
                }
                ]
            });
        });
    }
});

function toArray(obj) {
    var arr = [];
    for (var i = 0, iLen = obj.length; i < iLen; i++) {
        arr.push(obj[i]);
    }
    return arr;
}

// Wrap the words of an element and child elements in a span.
// Recurs over child elements, add an ID and class to the wrapping span.
// Does not affect elements with no content, or those to be excluded.
var wrapContent = (function() {
    return function(el) {
        var count = 0;
        gaps = [];
        // If element provided, start there, otherwise use the body.
        el = el && el.parentNode ? el : document.body;
        // Get all child nodes as a static array.
        var node, nodes = toArray(el.childNodes);
        if (el.id === "id_questiontextfeedback" && (count > 0)) {
            count = 0;
        }
        var frag, text;
        var delimitchars = $("#id_delimitchars").val();
        var l = delimitchars.substring(0, 1);
        var r = delimitchars.substring(1, 2);
        var regex = new RegExp("(\\" + l + ".*?\\" + r + ")", "g");
        var sp, span = document.createElement('span');
        // Tag names of elements to skip, there are more to add.
        var skip = {'script': '', 'button': '', 'input': '', 'select': '',
            'textarea': '', 'option': ''};
        // For each child node...
        for (var i = 0, iLen = nodes.length; i < iLen; i++) {
            node = nodes[i];
            // If it's an element, call wrapContent.
            if (node.nodeType === 1 && !(node.tagName.toLowerCase() in skip)) {
                wrapContent(node);
                // If it's a text node, wrap words.
            } else if (node.nodeType === 3) {
                var textsplit = new RegExp("(\\" + l + ".*?\\" + r + ")", "g");
                text = node.data.split(textsplit);
                if (text) {
                    // Create a fragment, handy suckers these.
                    frag = document.createDocumentFragment();
                    for (var j = 0, jLen = text.length; j < jLen; j++) {
                        // If not whitespace, wrap it and append to the fragment.
                        if (regex.test(text[j])) {
                            sp = span.cloneNode(false);
                            count++;
                            sp.className = 'item';
                            var item = new Item(text[j], $("#id_delimitchars").val());
                            if (item.gaptext > '') {
                                var instance = 0;
                                for (var k = 0; k < gaps.length; ++k) {
                                    if (gaps[k] === item.text) {
                                        instance++;
                                    }
                                }
                                item.id = 'id' + count + '_' + instance;
                                sp.id = item.id;
                                var is = item.get_itemsettings(item);
                                if (item.striptags(is.correctfeedback) > "") {
                                    sp.className = 'hascorrect';
                                }
                                if (item.striptags(is.incorrectfeedback) > "") {
                                    sp.className = sp.className + " " + 'hasnotcorrect';
                                }
                                gaps.push(item.gaptext);
                            }
                            sp.appendChild(document.createTextNode(text[j]));
                            frag.appendChild(sp);
                            // Otherwise, just append it to the fragment.
                        } else {
                            frag.appendChild(document.createTextNode(text[j]));
                        }
                    }
                }
                // Replace the original node with the fragment.
                node.parentNode.replaceChild(frag, node);
            }
        }
    };
}());
function copyStyles(source) {
    // The map to return with requested styles and values as KVP.
    var product = {};
    // The style object from the DOM element we need to iterate through.
    var style;
    // Recycle the name of the style attribute.
    var name;
    // Prevent from empty selector.
    if (source.length) {
        // Otherwise, we need to get everything.
        var dom = source.get(0);
        if (window.getComputedStyle) {
            // Convenience methods to turn css case ('background-image') to camel ('backgroundImage').
            var pattern = /\-([a-z])/g;
            var uc = function(a, b) {
                return b.toUpperCase();
            };
            var camelize = function(string) {
                return string.replace(pattern, uc);
            };
            // Make sure we're getting a good reference.
            if ((style = window.getComputedStyle(dom, null))) {
                var camel, value;
                for (var i = 0, l = style.length; i < l; i++) {
                        name = style[i];
                        camel = camelize(name);
                        value = style.getPropertyValue(name);
                        product[camel] = value;
                }
            } else if ((style = dom.currentStyle)) {
                for (name in style) {
                    product[name] = style[name];
                }
            } else if ((style = dom.style)) {
                for (name in style) {
                    if (typeof style[name] != 'function') {
                        product[name] = style[name];
                    }
                }
            }
            return product;
        }
    }
}
