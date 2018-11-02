/*
 NNM Pace Calculator JS.
 Copyright Anders Gustafson (http://www.nemonisimors.com). All rights reserved.
 */

var DEBUG = false;
var INFO = false;
var CLEAR_ALL_FIELDS_WHEN_RELOAD = true;

var MAX_SPLIT_COLUMNS = 5;
var SPLIT_INTERVAL = 10;
var MAX_SPLITS = 200;

if (INFO) {
    info("DEBUG: " + DEBUG);
    info("CLEAR_ALL_FIELDS_WHEN_RELOAD: " + CLEAR_ALL_FIELDS_WHEN_RELOAD);
    info("MAX_SPLIT_COLUMNS: " + MAX_SPLIT_COLUMNS);
    info("SPLIT_INTERVAL: " + SPLIT_INTERVAL);
}

var distances = [
    new Distance("m", 1, "meters"),
    new Distance("100m", 100, "100 m splits"),
    new Distance("200m", 200, "200 m laps"),
    new Distance("400m", 400, "400 m laps"),
    new Distance("500m", 500, "500 m splits"),
    new Distance("km", 1000, "kilometers"),
    new Distance("mi", 1609.344, "miles"),
];

var paces = [
    new Pace("/100m", 100, false),
    new Pace("/200m", 200, false),
    new Pace("/400m", 400, false),
    new Pace("/500m", 500, false),
    new Pace("/km", 1000, false),
    new Pace("/mi", 1609.344, false),
    new Pace("km/h", 1000 / 3600, true),
    new Pace("mph", 1609.344 / 3600, true),
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
        document.getElementById('logStatus').textContent = "#### LOGGING IS ON #####";
    }

    var paceUnit = document.getElementById("paceUnit")
    paceUnit.addEventListener('change', function(event) {
        showCorrectPaceFieldsForUser()
    });
    paceUnit.addEventListener('keyup', function(event) {
        showCorrectPaceFieldsForUser()
    });

    var calcFields = document.querySelectorAll(".calculate");
    Array.prototype.forEach.call(calcFields, function(el, i){
        el.addEventListener('change', function(event) {
            calculate()
        });
        el.addEventListener('keyup', function(event) {
            calculate()
        });
    });

    clearMessages();
    hideResultInformation();
}

function verifyStoragePossibility() {
    if (typeof(Storage) !== "undefined") {
        info("Can store user defined values");
    } else {
        info("Can NOT store user defined values");
    }
}

var context = new Object();

function calculate() {
    info("Calculating...");

    clearMessages();
    hideResultInformation();

    validateUserInput();

    function printErrorMessages(element, index, array) {
        var div = document.createElement('div');
        div.innerHTML = element;
        div.className = 'error'
        document.getElementById('messages').appendChild(div);
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
        if (timeInSeconds == 7299) {
            addMessage("This is the marathon world record (held by 🇰🇪 Eliud Kipchoge)");
        }
        else if (timeInSeconds == 8125) {
            addMessage("This is the marathon world record (held by 🇬🇧 Paula Radcliffe)");
        }
        else if (timeInSeconds == 9586) {
            addMessage("This is my personal best for the marathon 🎉");
        }
    } else if (distanceInMeters == 10000) {
        if (timeInSeconds == 1577.53) {
            addMessage("This is the world record in 10000 meters (held by 🇪🇹 Kenenisa Bekele)");
        }
    } else if (distanceInMeters == 100) {
        if (timeInSeconds == 9.58) {
            addMessage("This is the world record in 100 meters (held by 🇯🇲 Usain Bolt)");
        }
    } else if (distanceInMeters == 800) {
        if (timeInSeconds == 100.91) {
            addMessage("This is the world record in 800 meters (held by 🇰🇪 David Rudisha)");
        }
    }

    if (msgElement != null) {
        showMessages();
    }

    function addMessage(msg) {
        msgElement = document.createElement('div');
        msgElement.innerHTML = "DID YOU KNOW: " + msg;
        msgElement.className = 'info';
        document.getElementById('messages').appendChild(msgElement);
    }
}

function validateUserInput() {
    info("Validating user input...");

    context.errors = new Array();
    context.distanceFromUser = Number(document.getElementById('distance').value);
    context.distance = getDistanceDTO(document.getElementById('distanceUnit').value);
    context.splitDistance = getDistanceDTO(document.getElementById('splitDistanceUnit').value);
    context.hoursFromUser = Number(document.getElementById('hours').value);
    context.minutesFromUser = Number(document.getElementById('minutes').value);
    context.secondsFromUser = Number(document.getElementById('seconds').value);
    //context.paceFromUser = Number(document.getElementById('pace').value);
    context.paceMinutesFromUser = Number(document.getElementById('paceMinutes').value);
    context.paceSecondsFromUser = Number(document.getElementById('paceSeconds').value);
    context.pace = getPaceDTO(document.getElementById('paceUnit').value);

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
    //isValid &= validate(context.paceFromUser);
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
    document.getElementById('distances').style.display = 'none';
    document.getElementById('distances').innerHTML = '';
    document.getElementById('times').style.display = 'none';
    document.getElementById('times').innerHTML = '';
    document.getElementById('paces').style.display = 'none';
    document.getElementById('paces').innerHTML = '';
}


function clearMessages() {
    info("Clearing messages...");
    document.getElementById('messages').innerHTML = '';
}

function showMessages() {
    info("Showing messages...");
    document.getElementById('messageWrapper').style.display = '';
}

function showResults() {
    info("Showing results...");
    document.getElementById('resultWrapper').style.display = '';
}

function showSplitTimes() {
    info("Showing split times...");
    document.getElementById('splitTimeWrapper').style.display = '';
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

    document.getElementById('splitTimes').innerHTML = table;
}

function hideResultInformation() {
    info("Hiding result information...");
    document.getElementById('messageWrapper').style.display = 'none';
    document.getElementById('resultWrapper').style.display = 'none';
    document.getElementById('splitTimeWrapper').style.display = 'none';
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

    var tr = document.createElement('tr');
        tr.innerHTML = "<th>Time</th>";
        document.getElementById('times').appendChild(tr);

    var timeHMS = document.createElement('tr');
        timeHMS.innerHTML = "<td>" + toHMS(Math.round(timeInSeconds), "hh:mm:ss") + "</td>";
        document.getElementById('times').appendChild(timeHMS);
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
        document.getElementById('times').style.display = '';
    }
}

function convertDistances(distanceInMeters, definedDistance) {
    info("Converting distances in result");

    var tr = document.createElement('tr');
        tr.innerHTML = "<th colspan=2>Distance</th>";
        document.getElementById('distances').appendChild(tr);

    for (i = 0; i < distances.length; i++) {
        var distance = distances[i];
        var distanceUnit = distance.unit;
        var distanceFactor = distance.factor;
        var distanceUnitLong = distance.longName;

        var convertedDistance = distanceInMeters / distanceFactor;
        convertedDistance = round(convertedDistance, 3);

        var appendedDistance = document.createElement('tr');
        appendedDistance.innerHTML = "<td>" + convertedDistance + "</td><td>" + distanceUnitLong + "</td>";
        document.getElementById('distances').appendChild(appendedDistance);

        if (definedDistance != null) {
            debug("Comparing " + definedDistance.unit + " with " + distanceUnit);
            if (definedDistance.unit == distanceUnit) {
                appendedDistance.className = "definedUnit";
            }
        }
    }
    document.getElementById('distances').style.display = '';
}

function convertPaces(paceInMetersPerSecond, definedPace) {
    info("Converting paces in result");
    var tr = document.createElement('tr');
        tr.innerHTML = "<th colspan=2>Pace</th>";
        document.getElementById('paces').appendChild(tr);

    for (i = 0; i < paces.length; i++) {
        var pace = paces[i];
        var paceUnit = pace.unit;
        var paceFactor = pace.factor;
        var isDistancePerTime = pace.distancePerTime;

        var convertedPace = isDistancePerTime ? paceInMetersPerSecond / paceFactor : paceFactor / paceInMetersPerSecond;
        convertedPace = isDistancePerTime ? round(convertedPace, 2) : toHMS(Math.round(convertedPace), "mm:ss");

        var appendedPace = document.createElement('tr');
        appendedPace.innerHTML = "<td>" + convertedPace + "</td><td>" + paceUnit + "</td>";
        document.getElementById('paces').appendChild(appendedPace);

        if (definedPace != null) {
            debug("Comparing " + definedPace.unit + " with " + paceUnit);
            if (definedPace.unit == paceUnit) {
                appendedPace.className = "definedUnit";
            }
        }
    }
    document.getElementById('paces').style.display = '';
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
    var selectedPaceUnit = document.getElementById('paceUnit').value;
    debug("PaceUnit = " + selectedPaceUnit);
    var distancePerTime = isDistancePerTime(selectedPaceUnit);

    if (distancePerTime) {
        debug("Pace " + selectedPaceUnit + " is defined as distance per time");
        document.getElementById('timePerDistance').style.display = 'none';
    } else {
        debug("Pace " + selectedPaceUnit + " is defined as time per distance");
        document.getElementById('timePerDistance').style.display = '';
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

document.addEventListener("DOMContentLoaded", function() {
    init()
});