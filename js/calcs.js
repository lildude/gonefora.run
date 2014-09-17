/*
 NNM Pace Calculator JS.
 Copyright Anders Gustafson (http://www.nemonisimors.com). All rights reserved.
 */

var DEBUG = false;
var INFO = false;
var CLEAR_ALL_FIELDS_WHEN_RELOAD = true;
var SHOW_CLEAR_FIELDS_BUTTON = false;
var SET_DEFAULT_FOR_SPLIT_DISTANCE = false;

var MAX_SPLIT_COLUMNS = 5; // TODO Named MAX_SPLIT_ROWS in original NNM Pace Calculator.
var SPLIT_INTERVAL = 10;
var MAX_SPLITS = 200;

if (INFO) {
    info("DEBUG: " + DEBUG);
    info("CLEAR_ALL_FIELDS_WHEN_RELOAD: " + CLEAR_ALL_FIELDS_WHEN_RELOAD);
    info("MAX_SPLIT_COLUMNS: " + MAX_SPLIT_COLUMNS);
    info("SPLIT_INTERVAL: " + SPLIT_INTERVAL);
}

var distances = [
    //new Distance("in", 0.0254, "inches"),
    //new Distance("ft", 0.3048, "feet"),
    //new Distance("yd", 0.9144, "yards"),
    new Distance("m", 1, "meters"),
    new Distance("100m", 100, "100 m splits"),
    new Distance("200m", 200, "200 m laps"),
    new Distance("400m", 400, "400 m laps"),
    new Distance("500m", 500, "500 m splits"),
    new Distance("km", 1000, "kilometers"),
    new Distance("mi", 1609.344, "miles"),
    //new Distance("nmi", 1852, "nautical miles")
    //new Distance("au", 149597870700, "astronomical units"),
];

var paces = [
    new Pace("/100m", 100, false),
    new Pace("/200m", 200, false),
    new Pace("/400m", 400, false),
    new Pace("/500m", 500, false),
    new Pace("/km", 1000, false),
    new Pace("/mi", 1609.344, false),
    //new Pace("/nmi", 1852, false),
    //new Pace("ft/s", 0.3048 / 1, true),
    //new Pace("m/s", 1 / 1, true),
    new Pace("km/h", 1000 / 3600, true),
    new Pace("mph", 1609.344 / 3600, true),
    //new Pace("knots", 1852 / 3600, true)
];

function Distance(unit, factor, longName) {
    this.unit = unit;
    this.factor = factor;
    this.longName = longName;
}

function Time(hours, minutes, seconds) {
    this.timeInSeconds = 3600 * hours + 60 * minutes + 1 * seconds;
}

function Pace(unit, factor, distancePerTime) {
    this.unit = unit;
    this.factor = factor;
    this.distancePerTime = distancePerTime;
}

function SplitTime(splitTimeInSeconds, splitNo, distanceUnit) {
    this.splitTimeInSeconds = splitTimeInSeconds;
    this.splitNo = splitNo;
    this.distanceUnit = distanceUnit;
}

function clearAllInputFields() {
    info("Clearing all input fields");
    $("#theForm input").each(function (index, element) {
        debug("Clearing input field " + element.id);
        //Not working in IE 7 and IE 8! element.value = null;
        element.value = "";
    });
}

function initDistanceSelections() {
    info("Initializing distances...");
    for (i = 0; i < distances.length; i++) {
        var distance = distances[i];
        debug("Distance: " + distance.unit + "/" + distance.longName + " = " + distance.factor + " m");

        var appendedDistanceOption = $("<option value='" + distance.unit + "'>" + distance.longName + "</option>").appendTo("#distanceUnit");
        if (distance.unit == "km") { // Set default distance.
            appendedDistanceOption.attr("selected", "selected");
        }

        var appendedSplitDistanceOption = $("<option value='" + distance.unit + "'>" + distance.longName + "</option>").appendTo("#splitDistanceUnit");
        if (SET_DEFAULT_FOR_SPLIT_DISTANCE && distance.unit == "km") { // Set default distance.
            appendedSplitDistanceOption.attr("selected", "selected");
        }
    }
}

function initPaceSelections() {
    info("Initializing paces...");
    for (i = 0; i < paces.length; i++) {
        var pace = paces[i];
        debug("Pace: " + pace.unit + ", factor = " + pace.factor + " distance per time = " + pace.distancePerTime);

        var appendedPaceOption = $("<option value='" + pace.unit + "'>" + pace.unit + "</option>").appendTo("#paceUnit");
        if (pace.unit == "/km") { // Set default pace.
            appendedPaceOption.attr("selected", "selected");
        }
    }
    showCorrectPaceFieldsForUser();
}

function getDistanceDTO(distanceUnit) {
    info("Get distance DTO matching " + distanceUnit);
    for (i = 0; i < distances.length; i++) {
        var distance = distances[i];
        if (distance.unit == distanceUnit) {
            debug("Found distance DTO matching " + distanceUnit);
            return distance;
        }
    }
    return null;
}

function getPaceDTO(paceUnit) {
    info("Get pace DTO matching " + paceUnit);
    for (i = 0; i < paces.length; i++) {
        var pace = paces[i];
        if (pace.unit == paceUnit) {
            debug("Found pace DTO matching " + paceUnit);
            return pace;
        }
    }
    return null;
}

function isDistancePerTime(paceUnit) {
    return getPaceDTO(paceUnit).distancePerTime;
}

function init() {
    info("Initializing...");

    if (DEBUG || INFO) {
        $("#logStatus").text("#### LOGGING IS ON #####");
    }

    $(".currentYear").each(function (index, element) {
        $(this).text(new Date().getFullYear());
    });

    $("#paceUnit").change(function (event) {
        showCorrectPaceFieldsForUser();

    }).keyup(function (event) {
            showCorrectPaceFieldsForUser();
        });

    $(".calculate").change(function (event) {
        calculate();

    }).keyup(function (event) {
            calculate();

        });

    $("#clear").click(function (event) {
        clearResult();
    });


    clearMessages();
    hideResultInformation();
    initDistanceSelections();
    initPaceSelections();
    if (CLEAR_ALL_FIELDS_WHEN_RELOAD) {
        clearAllInputFields();
    }
    if (!SHOW_CLEAR_FIELDS_BUTTON) {
        $("#buttonBlock").hide();
    }

    if (!CLEAR_ALL_FIELDS_WHEN_RELOAD) {
        calculate();
    }

    $("#jsContent").show(); // Show the page for JavaScript users.
}

function verifyStoragePossibility() {
    if (typeof(Storage) !== "undefined") {
        info("Can store user defined values");
    } else {
        info("Can NOT store user defined values");
    }
}

function doIt() {
//    validateUserInput();
//    showerrors
//    calculate
//    convert
//    showresult
}

var context = new Object();

function calculate() {
    info("Calculating...");

    clearMessages();
    hideResultInformation();

    validateUserInput();

    function printErrorMessages(element, index, array) {
        var errMsg = $("<div class='error'>" + element + "</div>").appendTo(".messages");
    }

    var distanceInMeters;
    var timeInSeconds;
    var paceInMetersPerSecond;

    function decideDistanceInMeters() {
        distanceInMeters = context.distanceFromUser * context.distance.factor;
    }

    function decideTimeInSeconds() {
        timeInSeconds = 3600 * context.hoursFromUser + 60 * context.minutesFromUser + 1 * context.secondsFromUser;
    }

    function decidePaceInMetersPerSecond() {
        info("Deciding pace in m/s for " + context.pace.unit + "...");
        if (isDistancePerTime(context.pace.unit)) {
            debug("Pace from user is distance per time, pace = " + context.paceFromUser + ", factor = " + context.pace.factor + " * m/s");
            paceInMetersPerSecond = context.paceFromUser * context.pace.factor;
        } else {
            debug("Pace from user is time per distance, mm = " + context.paceMinutesFromUser + ", ss = " + context.paceSecondsFromUser + ", factor = " + context.pace.factor + " * s/m");
            paceInMetersPerSecond = context.pace.factor / ( 60 * context.paceMinutesFromUser + context.paceSecondsFromUser );
        }
        debug("Decided pace to " + paceInMetersPerSecond + " m/s")
    }


    function calculatePace() {
        info("Calculating pace (v=s/t)...");
        decideDistanceInMeters();
        decideTimeInSeconds();

        paceInMetersPerSecond = distanceInMeters / timeInSeconds;
    }

    function calculateTime() {
        info("Calculating time (t=s/v)...");
        decideDistanceInMeters();
        decidePaceInMetersPerSecond();

        timeInSeconds = distanceInMeters / paceInMetersPerSecond;
    }

    function calculateDistance() {
        info("Calculating distance (s=v*t)...");
        decideTimeInSeconds();
        decidePaceInMetersPerSecond();

        distanceInMeters = paceInMetersPerSecond * timeInSeconds;
    }

    function calculateSplitTimes() {
        info("Calculating split times...");

        var splitTimes = new Array();

        var secondsPerUnit = context.splitDistance.factor / paceInMetersPerSecond;
        debug("secondsPerUnit = " + secondsPerUnit);
        var noOfSplits = Math.floor(timeInSeconds / secondsPerUnit);

        if (noOfSplits > MAX_SPLITS) {
            context.errors.push("Too many splits, " + noOfSplits + ", so split times will not be shown (max number of splits is " + MAX_SPLITS + ")");
            return;
        }

        for (var i = 1; i <= noOfSplits; i++) {
            var splitTimeInSeconds = i * secondsPerUnit;
            splitTimes.push(new SplitTime(splitTimeInSeconds, i, context.splitDistance));

            debug("i = " + i + ", x = " + splitTimeInSeconds + ", s = " + timeInSeconds);
            if (i == noOfSplits && splitTimeInSeconds + 0.000000001 < timeInSeconds) {
                debug("Adding an extra split");
                //splitTimes.push(new SplitTime(timeInSeconds, distanceInMeters/context.splitDistance.factor, context.splitDistance));
                splitTimes.push(new SplitTime(timeInSeconds, round(distanceInMeters / context.splitDistance.factor, 3), context.splitDistance));
            }
        }

        addSplitTimesTable(splitTimes);

        showSplitTimes();
    }

    clearResult();

    if (context.errors.length == 0) {
        if (context.canCalculate) {
            info("Can calculate...");

            if (context.distanceDefined && context.timeDefined) {
                calculatePace();
                convertDistances(distanceInMeters, context.distance);
                convertPaces(paceInMetersPerSecond, null);
                convertTimes(timeInSeconds, true);
            }
            else if (context.distanceDefined && context.paceDefined) {
                calculateTime();
                convertDistances(distanceInMeters, context.distance);
                convertPaces(paceInMetersPerSecond, context.pace);
                convertTimes(timeInSeconds, false);
            }
            else if (context.timeDefined && context.paceDefined) {
                calculateDistance();
                convertDistances(distanceInMeters, null);
                convertPaces(paceInMetersPerSecond, context.pace);
                convertTimes(timeInSeconds, true);
            }
            else if (context.distanceDefined) {
                info("Converting distances...");
                decideDistanceInMeters();
                convertDistances(distanceInMeters, context.distance);
            }
            else if (context.paceDefined) {
                info("Converting paces...");
                decidePaceInMetersPerSecond();
                convertPaces(paceInMetersPerSecond, context.pace);
            }
            else if (context.timeDefined) {
                info("Converting times...");
                decideTimeInSeconds();
                convertTimes(timeInSeconds, true);
            }

            if (context.splitDistance != null && distanceInMeters > 0 && timeInSeconds > 0 && paceInMetersPerSecond > 0) {
                calculateSplitTimes();
            }

            debug("Calculated values: " + distanceInMeters + " m, " + timeInSeconds + " s, " + paceInMetersPerSecond + " m/s");
            //$("#times").html(toHMS(hours, minutes, seconds));
            //$("#times").html(toHMS(timeInSeconds));

            easterEggs(distanceInMeters, timeInSeconds, paceInMetersPerSecond);

            showResults();
        }
    }

    if (context.errors.length > 0) { // TODO
        info("Errors found: " + context.errors);

        context.errors.forEach(printErrorMessages);
        showMessages();
    }

    info(" ");
}

function easterEggs(distanceInMeters, timeInSeconds, paceInMetersPerSecond) {

    var msgElement = null;
    if (distanceInMeters == 42195) {
        if (timeInSeconds == 7403) {
            addMessage("This is the marathon world record (held by Wilson Kipsang)");
        }
        else if (timeInSeconds == 7897) {
            addMessage("This is the course record in Stockholm Marathon (held by Hugh Jones)");
        }
        else if (timeInSeconds == 8125) {
            addMessage("This is the marathon world record (held by Paula Radcliffe)");
        }
        else if (timeInSeconds == 8904) {
            addMessage("This is the course record in Stockholm Marathon (held by Grete Waitz)");
        }
    } else if (distanceInMeters == 10000) {
        if (timeInSeconds == 1577.53) {
            addMessage("This is the world record in 10000 meters (held by Kenenisa Bekele)");
        }
    } else if (distanceInMeters == 100) {
        if (timeInSeconds == 9.58) {
            addMessage("This is the world record in 100 meters (held by Usain Bolt)");
        }
    } else if (distanceInMeters == 800) {
        if (timeInSeconds == 100.91) {
            addMessage("This is the world record in 800 meters (held by David Rudisha)");
        }
    }

    if (msgElement != null) {
        showMessages();
    }

    function addMessage(msg) {
        msgElement = $("<div>" + msg + "</div>").appendTo(".messages");
    }
}

function validateUserInput() {
    info("Validating user input...");

    context.errors = new Array();

    context.distanceFromUser = Number($("#distance").val());
    context.distance = getDistanceDTO($("#distanceUnit").val());

    context.splitDistance = getDistanceDTO($("#splitDistanceUnit").val());

    context.hoursFromUser = Number($("#hours").val());
    context.minutesFromUser = Number($("#minutes").val());
    context.secondsFromUser = Number($("#seconds").val());

    context.paceFromUser = Number($("#pace").val());
    context.paceMinutesFromUser = Number($("#paceMinutes").val());
    context.paceSecondsFromUser = Number($("#paceSeconds").val());
    context.pace = getPaceDTO($("#paceUnit").val());

    context.distanceDefined = context.distanceFromUser > 0 && context.distance != null;

    context.timeDefined = context.hoursFromUser > 0 || context.minutesFromUser > 0 || context.secondsFromUser > 0;

    context.paceDefined = ((context.paceMinutesFromUser > 0 || context.paceSecondsFromUser > 0) && !context.pace.distancePerTime)
        || (context.paceFromUser > 0 && context.pace.distancePerTime);

    var allUserValuesAreValid = validateValues();

    var thingsDefined = (context.distanceDefined ? 1 : 0) + (context.timeDefined ? 1 : 0) + (context.paceDefined ? 1 : 0);
    context.canCalculate = allUserValuesAreValid && 0 < thingsDefined && thingsDefined < 3;
    debug("thingsDefined = " + thingsDefined);

    if (!allUserValuesAreValid) {
        addError("Some input values are invalid");
    }
    if (thingsDefined == 3) {
        addError("At most two of distance, time and pace can be defined");
    }

    if (context.timeDefined) {
        debug("h = " + context.hoursFromUser + ", m = " + context.minutesFromUser + ", s = " + context.secondsFromUser);
        context.time = new Time(context.hoursFromUser, context.minutesFromUser, context.secondsFromUser);
    }

    if (context.secondsFromUser >= 60 && (context.hoursFromUser > 0 || context.minutesFromUser > 0)) {
        addError("Invalid time defined. Seconds must be less than 60 when also defining hours and/or minutes.");
    }

    if (context.minutesFromUser >= 60 && context.hoursFromUser > 0) {
        addError("Invalid time defined. Minutes must be less than 60 when also defining hours.");
    }

    if (context.paceSecondsFromUser >= 60 && context.paceMinutesFromUser > 0) {
        addError("Invalid pace time defined. Seconds must be less than 60 when also defining minutes.");
    }

    function addError(errMsg) {
        debug("Adding error: " + errMsg);
        context.errors.push(errMsg);
    }
}


function validateValues() {
    var isValid = true;

    isValid &= validate(context.distanceFromUser);
    isValid &= validate(context.hoursFromUser);
    isValid &= validate(context.minutesFromUser);
    isValid &= validate(context.secondsFromUser);
    isValid &= validate(context.paceFromUser);
    isValid &= validate(context.paceMinutesFromUser);
    isValid &= validate(context.paceSecondsFromUser);

    return isValid;
}

function validate(number) {
    if (number != null && number < 0) {
        return false;
    }
    if (isNaN(number)) {
        return false;
    }
    return true;

}

function clearResult() {
    info("Clearing result...");
    $("#distances").empty();
    $("#distances").hide();
    $("#times").empty();
    $("#times").hide();
    $("#paces").empty();
    $("#paces").hide();
}


function clearMessages() {
    info("Clearing messages...");
    $(".messages").empty();
}

function showMessages() {
    info("Showing messages...");
    $(".messageWrapper").show();
}

function showResults() {
    info("Showing results...");
    $(".resultWrapper").show();
}

function showSplitTimes() {
    info("Showing split times...");
    $(".splitTimeWrapper").show();
}

function addSplitTimesTable(splitTimes) {

    var totalNumberOfElements = splitTimes.length;
    var rowsPerColumn = (Math.floor((totalNumberOfElements - 1) / (MAX_SPLIT_COLUMNS * SPLIT_INTERVAL)) + 1) * SPLIT_INTERVAL;
    var noOfColumns = Math.min(MAX_SPLIT_COLUMNS, Math.ceil(totalNumberOfElements / SPLIT_INTERVAL));
    var rowCounter = 0;

    var table = "<table>";
    table += "<tr>";
    for (var row = 1; row <= rowsPerColumn; row++) {

        for (var column = 0; column < noOfColumns; column++) { // Create the columns for the current row.
            var i = row - 1 + column * rowsPerColumn;
            var splitTime = splitTimes[i];

            if (splitTime != null) {
                var specialCSS = i + 1 == totalNumberOfElements || row % 5 == 0 ? " special" : "";
                table += "<td class='splitDistanceUnit" + specialCSS + "'>";
                table += splitTime.splitNo + " " + splitTime.distanceUnit.unit; // TODO Avrunda.
                table += "</td>";

                table += "<td class='splitTime" + specialCSS + "'>";
                table += toHMS(splitTime.splitTimeInSeconds, "mm:ss");
                table += "</td>";
            }
        }

        if (row < rowsPerColumn) {
            table += "</tr><tr>";
        }
    }
    table += "</tr>";
    table += "</table>";

//    var table = "<table>";
//    table += "<tr>";
//    for (var i = 1; i <= splitTimes.length; i++) {
//        var splitTime = splitTimes[i - 1];
//
//        table += "<td class='splitDistanceUnit'>";
//        //table += i + " " + splitDistanceUnit;
//        table += splitTime.splitNo + " " + splitTime.distanceUnit.unit;
//        table += "</td>";
//
//        table += "<td class='splitTime'>";
//        table += toHMS(splitTime.splitTimeInSeconds, "mm:ss");
//        table += "</td>";
//
//        if (i % 5 == 0 && i < splitTimes.length) {
//            table += "</tr><tr>";
//        }
//    }
//    table += "</tr>";
//    table += "</table>";

    $(".splitTimes").html(table);
}

function hideResultInformation() {
    info("Hiding result information...");
    $(".messageWrapper").hide();
    $(".resultWrapper").hide();
    $(".splitTimeWrapper").hide();
}

function toHMS(timeInSeconds, format) {
    debug("Converting " + timeInSeconds + " s to " + format + "...");

    timeInSeconds = Math.round(timeInSeconds);

    var hours = Math.floor(timeInSeconds / 3600);
    timeInSeconds = timeInSeconds % 3600;
    var minutes = Math.floor(timeInSeconds / 60);
    timeInSeconds = timeInSeconds % 60;
    var seconds = timeInSeconds;

    var hms = "";
    if (hours > 0 || format == "hh:mm:ss") {
        hms += hours + ":";
    }
    if (hours > 0 || minutes > 0 || ( format == "hh:mm:ss" || format == "mm:ss" )) {
        if (minutes < 10 && (hours > 0 || format == "hh:mm:ss")) {
            hms += "0";
        }
        hms += minutes + ":";
    }
    if ((hours > 0 || minutes > 0 || ( format == "hh:mm:ss" || format == "mm:ss" )) && seconds < 10) {
        hms += "0";
    }
    hms += Math.round(seconds);

    debug("HMS = " + hms);
    return hms;
}

function convertTimes(timeInSeconds, isTimeDefinedByUser) {
    info("Converting times in result");

    //$("#times").append("<div class='header'>Time</div>");
    $("#times").append("<tr><th>Time</th></tr>");
    //var timeHMS = $("<div><span class='resultValue'>" + toHMS(Math.round(timeInSeconds), "hh:mm:ss") + "</span></div>").appendTo("#times");
    var timeHMS = $("<tr><td>" + toHMS(Math.round(timeInSeconds), "hh:mm:ss") + "</td></tr>").appendTo("#times");
    //var timeSeconds = $("<div><span class='resultValue'>" + Math.round(timeInSeconds) + "</span><span class='resultUnit'>s</span></div>").appendTo("#times");

    // If time is defined by the user, don't show it.
    //if (isTimeDefinedByUser) {
        //if (context.secondsFromUser >= 60) {
        //    timeSeconds.addClass("definedUnit");
        //} else {
    //        timeHMS.addClass("definedUnit");
        //}
    //}
    if (! isTimeDefinedByUser) {
      $("#times").show();
    }
}

function convertDistances(distanceInMeters, definedDistance) {
    info("Converting distances in result");

    //$("#distances").append("<div class='header'>Distance</div>");
    $("#distances").append("<tr><th colspan=2>Distance</th></tr>");
    for (i = 0; i < distances.length; i++) {
        var distance = distances[i];
        var distanceUnit = distance.unit;
        var distanceFactor = distance.factor;
        var distanceUnitLong = distance.longName;

        var convertedDistance = distanceInMeters / distanceFactor;
        convertedDistance = round(convertedDistance, 3);

        //var appendedDistance = $("<div><span class='resultValue'>" + convertedDistance + "</span><span class='resultUnit'>" + distanceUnitLong + "</span></div>").appendTo("#distances");
        var appendedDistance = $("<tr><td>" + convertedDistance + "</td><td>" + distanceUnitLong + "</td></tr>").appendTo("#distances");
        if (definedDistance != null) {
            debug("Comparing " + definedDistance.unit + " with " + distanceUnit);
            if (definedDistance.unit == distanceUnit) {
                appendedDistance.addClass("definedUnit");
            }
        }
    }
    $("#distances").show();
}

function convertPaces(paceInMetersPerSecond, definedPace) {
    info("Converting paces in result");

    //$("#paces").append("<div class='header'>Pace</div>");
    $("#paces").append("<tr><th colspan=2>Pace</th></tr>");
    for (i = 0; i < paces.length; i++) {
        var pace = paces[i];
        var paceUnit = pace.unit;
        var paceFactor = pace.factor;
        var isDistancePerTime = pace.distancePerTime;

        var convertedPace = isDistancePerTime ? paceInMetersPerSecond / paceFactor : paceFactor / paceInMetersPerSecond;
        convertedPace = isDistancePerTime ? round(convertedPace, 2) : toHMS(Math.round(convertedPace), "mm:ss");

        //var appendedPace = $("<div><span class='resultValue'>" + convertedPace + "</span><span class='resultUnit'>" + paceUnit + "</span></div>").appendTo("#paces");
        var appendedPace = $("<tr><td>" + convertedPace + "</td><td>" + paceUnit + "</td></tr>").appendTo("#paces");
        if (definedPace != null) {
            debug("Comparing " + definedPace.unit + " with " + paceUnit);
            if (definedPace.unit == paceUnit) {
                appendedPace.addClass("definedUnit");
            }
        }
    }
    $("#paces").show();
}

function round(value, decimals) {
    var roundedValue;
    if (value < 10) {
        roundedValue = value.toFixed(Math.max(decimals, 0));
    }
    else if (value < 100) {
        roundedValue = value.toFixed(Math.max(decimals - 1, 0));
    }
    else if (value < 1000) {
        roundedValue = value.toFixed(Math.max(decimals - 2, 0));
    }
    else {
        roundedValue = value.toFixed(0);
    }
    return roundedValue;
}

function showCorrectPaceFieldsForUser() {
    var selectedPaceUnit = $("#paceUnit").val();
    debug("PaceUnit = " + selectedPaceUnit);
    var distancePerTime = isDistancePerTime(selectedPaceUnit);

    if (distancePerTime) {
        debug("Pace " + selectedPaceUnit + " is defined as distance per time");
        $("#distancePerTime").show();
        $("#timePerDistance").hide();
//        $("#pace").show();
//        $("#paceMinutes").hide();
//        $("#paceSeconds").hide();
//        $("#pace").removeAttr("disabled");
//        $("#paceMinutes").attr("disabled", "disabled");
//        $("#paceSeconds").attr("disabled", "disabled");

    } else {
        debug("Pace " + selectedPaceUnit + " is defined as time per distance");
        $("#distancePerTime").hide();
        $("#timePerDistance").show();
//        $("#pace").hide();
//        $("#paceMinutes").show();
//        $("#paceSeconds").show();
//        $("#pace").attr("disabled", "disabled");
//        $("#paceMinutes").removeAttr("disabled");
//        $("#paceSeconds").removeAttr("disabled");
    }
}

function debug(message) {
    if (DEBUG && message != "") {
        console.log("[DEBUG] " + message);
    }
}

function info(message) {
    if (INFO && message != "") {
        console.log("[INFO]  " + message);
    }
}

$(document).ready(function () {
    init();
});
