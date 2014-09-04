---
---
#
Distance = (unit, factor, longName) ->
  @unit = unit
  @factor = factor
  @longName = longName
  return

Time = (hours, minutes, seconds) ->
  @timeInSeconds = 3600 * hours + 60 * minutes + 1 * seconds
  return

Pace = (unit, factor, distancePerTime) ->
  @unit = unit
  @factor = factor
  @distancePerTime = distancePerTime
  return

SplitTime = (splitTimeInSeconds, splitNo, distanceUnit) ->
  @splitTimeInSeconds = splitTimeInSeconds
  @splitNo = splitNo
  @distanceUnit = distanceUnit
  return

clearAllInputFields = ->
  info "Clearing all input fields"
  $("#theForm input").each (index, element) ->
    debug "Clearing input field " + element.id

    #Not working in IE 7 and IE 8! element.value = null;
    element.value = ""
    return
  return

initDistanceSelections = ->
  info "Initializing distances..."
  i = 0
  while i < distances.length
    distance = distances[i]
    debug "Distance: " + distance.unit + "/" + distance.longName + " = " + distance.factor + " m"
    appendedDistanceOption = $("<option value='" + distance.unit + "'>" + distance.longName + "</option>").appendTo("#distanceUnit")
    # Set default distance.
    appendedDistanceOption.attr "selected", "selected"  if distance.unit is "km"
    appendedSplitDistanceOption = $("<option value='" + distance.unit + "'>" + distance.longName + "</option>").appendTo("#splitDistanceUnit")
    # Set default distance.
    appendedSplitDistanceOption.attr "selected", "selected"  if SET_DEFAULT_FOR_SPLIT_DISTANCE and distance.unit is "km"
    i++
  return

initPaceSelections = ->
  info "Initializing paces..."
  i = 0
  while i < paces.length
    pace = paces[i]
    debug "Pace: " + pace.unit + ", factor = " + pace.factor + " distance per time = " + pace.distancePerTime
    appendedPaceOption = $("<option value='" + pace.unit + "'>" + pace.unit + "</option>").appendTo("#paceUnit")
    # Set default pace.
    appendedPaceOption.attr "selected", "selected"  if pace.unit is "/km"
    i++
  showCorrectPaceFieldsForUser()
  return

initEventSelections = ->
  info "Initializing events..."
  i = 0
  while i < events.length
    event = events[i]
    debug "Event: "
    appendEventOption = $("<option value'" + event.unit +"'>'" + pace.name + "</option>").appendTo("#pickEvent")
    i++
  showEventFieldsForUser()
  return

getDistanceDTO = (distanceUnit) ->
  info "Get distance DTO matching " + distanceUnit
  i = 0
  while i < distances.length
    distance = distances[i]
    if distance.unit is distanceUnit
      debug "Found distance DTO matching " + distanceUnit
      return distance
    i++
  null

getPaceDTO = (paceUnit) ->
  info "Get pace DTO matching " + paceUnit
  i = 0
  while i < paces.length
    pace = paces[i]
    if pace.unit is paceUnit
      debug "Found pace DTO matching " + paceUnit
      return pace
    i++
  null

isDistancePerTime = (paceUnit) ->
  getPaceDTO(paceUnit).distancePerTime

init = ->
  info "Initializing..."
  $(".version").each (index, element) ->
    $(this).text VERSION
    return

  $("#logStatus").text "#### LOGGING IS ON #####"  if DEBUG or INFO
  $(".releaseDate").each (index, element) ->
    $(this).text RELEASE_DATE
    return

  $(".revisedDate").each (index, element) ->
    $(this).text REVISED_DATE
    return

  $(".currentYear").each (index, element) ->
    $(this).text new Date().getFullYear()
    return

  $(".contactEmail").each (index, element) ->
    $(this).append "anders<span>at</span>nemonisimors<span>dot</span>com"
    return

  $("#paceUnit").change((event) ->
    showCorrectPaceFieldsForUser()
    return
  ).keyup (event) ->
    showCorrectPaceFieldsForUser()
    return

  $(".calculate").change((event) ->
    calculate()
    return
  ).keyup (event) ->
    calculate()
    return

  $("#clear").click (event) ->
    clearResult()
    return

  $("#menu div").click (event) ->
    info "Clicking on event " + event.target.id
    info "Clicking on event " + event.target
    target = event.target
    showCorrectMenuTab target
    return

  clearMessages()
  hideResultInformation()
  showCorrectMenuTab $("#" + DEFAULT_MENU).get(0) # TODO Finns bÃ¤ttre sÃ¤tt???
  initDistanceSelections()
  initPaceSelections()
  clearAllInputFields()  if CLEAR_ALL_FIELDS_WHEN_RELOAD
  $("#buttonBlock").hide()  unless SHOW_CLEAR_FIELDS_BUTTON
  calculate()  unless CLEAR_ALL_FIELDS_WHEN_RELOAD

  # I have started to implement the next version 2012-10-07, which will have Configuration.
  #verifyStoragePossibility();
  logVisitor()
  $("#jsContent").show() # Show the page for JavaScript users.
  return

logVisitor = ->
  if LOG_VISITORS
    debug "Logging visitor..."
    $.get "/logVisitorsVersionJS.php"
  return

verifyStoragePossibility = ->
  if typeof (Storage) isnt "undefined"
    info "Can store user defined values"
  else
    info "Can NOT store user defined values"
  return

doIt = ->

#    validateUserInput();
#    showerrors
#    calculate
#    convert
#    showresult
context = new Object()

calculate = ->
  info "Calculating..."

  clearMessages()
  hideResultInformation()
  validateUserInput()

  distanceInMeters = undefined
  timeInSeconds = undefined
  paceInMetersPerSecond = undefined

  printErrorMessages = (element, index, array) ->
    errMsg = $("<div class='error'>" + element + "</div>").appendTo("#messages")
    return

  decideDistanceInMeters = ->
    distanceInMeters = context.distanceFromUser * context.distance.factor
    return

  decideTimeInSeconds = ->
    timeInSeconds = 3600 * context.hoursFromUser + 60 * context.minutesFromUser + 1 * context.secondsFromUser
    return

  # BUG: This is failing for some reason.
  decidePaceInMetersPerSecond = ->
    info "Deciding pace in m/s for " + context.pace.unit + "..."
    if isDistancePerTime(context.pace.unit)
      debug "Pace from user is distance per time, pace = " + context.paceFromUser + ", factor = " + context.pace.factor + " * m/s"
      paceInMetersPerSecond = context.paceFromUser * context.pace.factor
    else
      debug "Pace from user is time per distance, mm = " + context.paceMinutesFromUser + ", ss = " + context.paceSecondsFromUser + ", factor = " + context.pace.factor + " * s/m"
      paceInMetersPerSecond = context.pace.factor / (60 * context.paceMinutesFromUser + context.paceSecondsFromUser)
    debug "Decided pace to " + paceInMetersPerSecond + " m/s"
    return

  calculatePace = ->
    info "Calculating pace (v=s/t)..."
    decideDistanceInMeters()
    decideTimeInSeconds()
    paceInMetersPerSecond = distanceInMeters / timeInSeconds
    return

  calculateTime = ->
    info "Calculating time (t=s/v)..."
    decideDistanceInMeters()
    decidePaceInMetersPerSecond()
    timeInSeconds = distanceInMeters / paceInMetersPerSecond
    return

  calculateDistance = ->
    info "Calculating distance (s=v*t)..."
    decideTimeInSeconds()
    decidePaceInMetersPerSecond()
    distanceInMeters = paceInMetersPerSecond * timeInSeconds
    return

  calculateSplitTimes = ->
    info "Calculating split times..."
    splitTimes = new Array()
    secondsPerUnit = context.splitDistance.factor / paceInMetersPerSecond
    debug "secondsPerUnit = " + secondsPerUnit
    noOfSplits = Math.floor(timeInSeconds / secondsPerUnit)
    if noOfSplits > MAX_SPLITS
      context.errors.push "Too many splits, " + noOfSplits + ", so split times will not be shown (max number of splits is " + MAX_SPLITS + ")"
      return
    i = 1

    while i <= noOfSplits
      splitTimeInSeconds = i * secondsPerUnit
      splitTimes.push new SplitTime(splitTimeInSeconds, i, context.splitDistance)
      debug "i = " + i + ", x = " + splitTimeInSeconds + ", s = " + timeInSeconds
      if i is noOfSplits and splitTimeInSeconds + 0.000000001 < timeInSeconds
        debug "Adding an extra split"

        #splitTimes.push(new SplitTime(timeInSeconds, distanceInMeters/context.splitDistance.factor, context.splitDistance));
        splitTimes.push new SplitTime(timeInSeconds, round(distanceInMeters / context.splitDistance.factor, 3), context.splitDistance)
      i++
    addSplitTimesTable splitTimes
    showSplitTimes()
    return

  clearResult()

  if context.errors.length is 0
    if context.canCalculate
      info "Can calculate..."
      if context.distanceDefined and context.timeDefined
        calculatePace()
        convertDistances distanceInMeters, context.distance
        convertPaces paceInMetersPerSecond, null
        convertTimes timeInSeconds, true
      else if context.distanceDefined and context.paceDefined
        calculateTime()
        convertDistances distanceInMeters, context.distance
        convertPaces paceInMetersPerSecond, context.pace
        convertTimes timeInSeconds, false
      else if context.timeDefined and context.paceDefined
        calculateDistance()
        convertDistances distanceInMeters, null
        convertPaces paceInMetersPerSecond, context.pace
        convertTimes timeInSeconds, true
      else if context.distanceDefined
        info "Converting distances..."
        decideDistanceInMeters()
        convertDistances distanceInMeters, context.distance
      else if context.paceDefined
        info "Converting paces..."
        decidePaceInMetersPerSecond()
        convertPaces paceInMetersPerSecond, context.pace
      else if context.timeDefined
        info "Converting times..."
        decideTimeInSeconds()
        convertTimes timeInSeconds, true
      calculateSplitTimes()  if context.splitDistance? and distanceInMeters > 0 and timeInSeconds > 0 and paceInMetersPerSecond > 0
      debug "Calculated values: " + distanceInMeters + " m, " + timeInSeconds + " s, " + paceInMetersPerSecond + " m/s"

      #$("#times").html(toHMS(hours, minutes, seconds));
      #$("#times").html(toHMS(timeInSeconds));
      easterEggs distanceInMeters, timeInSeconds, paceInMetersPerSecond
      showResults()

  if context.errors.length > 0 # TODO
    info "Errors found: " + context.errors
    context.errors.forEach printErrorMessages
    showMessages()
  info " "
  return

easterEggs = (distanceInMeters, timeInSeconds, paceInMetersPerSecond) ->
  addMessage = (msg) ->
    msgElement = $("<div>" + msg + "</div>").appendTo("#messages")
    return
  msgElement = null
  if distanceInMeters is 42195
    if timeInSeconds is 7403
      addMessage "This is the marathon world record (held by Wilson Kipsang)"
    else if timeInSeconds is 7897
      addMessage "This is the course record in Stockholm Marathon (held by Hugh Jones)"
    else if timeInSeconds is 8125
      addMessage "This is the marathon world record (held by Paula Radcliffe)"
    else addMessage "This is the course record in Stockholm Marathon (held by Grete Waitz)"  if timeInSeconds is 8904
  else if distanceInMeters is 10000
    addMessage "This is the world record in 10000 meters (held by Kenenisa Bekele)"  if timeInSeconds is 1577.53
  else if distanceInMeters is 100
    addMessage "This is the world record in 100 meters (held by Usain Bolt)"  if timeInSeconds is 9.58
  else addMessage "This is the world record in 800 meters (held by David Rudisha)"  if timeInSeconds is 100.91  if distanceInMeters is 800
  showMessages()  if msgElement?
  return

validateUserInput = ->
  addError = (errMsg) ->
    debug "Adding error: " + errMsg
    context.errors.push errMsg
    return
  info "Validating user input..."
  context.errors = new Array()
  context.distanceFromUser = Number($("#distance").val())
  context.distance = getDistanceDTO($("#distanceUnit").val())
  context.splitDistance = getDistanceDTO($("#splitDistanceUnit").val())
  context.hoursFromUser = Number($("#hours").val())
  context.minutesFromUser = Number($("#minutes").val())
  context.secondsFromUser = Number($("#seconds").val())
  context.paceFromUser = Number($("#pace").val())
  context.paceMinutesFromUser = Number($("#paceMinutes").val())
  context.paceSecondsFromUser = Number($("#paceSeconds").val())
  context.pace = getPaceDTO($("#paceUnit").val())
  context.distanceDefined = context.distanceFromUser > 0 and context.distance?
  context.timeDefined = context.hoursFromUser > 0 or context.minutesFromUser > 0 or context.secondsFromUser > 0
  context.paceDefined = ((context.paceMinutesFromUser > 0 or context.paceSecondsFromUser > 0) and not context.pace.distancePerTime) or (context.paceFromUser > 0 and context.pace.distancePerTime)
  allUserValuesAreValid = validateValues()
  thingsDefined = ((if context.distanceDefined then 1 else 0)) + ((if context.timeDefined then 1 else 0)) + ((if context.paceDefined then 1 else 0))
  context.canCalculate = allUserValuesAreValid and 0 < thingsDefined and thingsDefined < 3
  debug "thingsDefined = " + thingsDefined
  addError "Some input values are invalid"  unless allUserValuesAreValid
  addError "At most two of distance, time and pace can be defined"  if thingsDefined is 3
  if context.timeDefined
    debug "h = " + context.hoursFromUser + ", m = " + context.minutesFromUser + ", s = " + context.secondsFromUser
    context.time = new Time(context.hoursFromUser, context.minutesFromUser, context.secondsFromUser)
  addError "Invalid time defined. Seconds must be less than 60 when also defining hours and/or minutes."  if context.secondsFromUser >= 60 and (context.hoursFromUser > 0 or context.minutesFromUser > 0)
  addError "Invalid time defined. Minutes must be less than 60 when also defining hours."  if context.minutesFromUser >= 60 and context.hoursFromUser > 0
  addError "Invalid pace time defined. Seconds must be less than 60 when also defining minutes."  if context.paceSecondsFromUser >= 60 and context.paceMinutesFromUser > 0
  return

validateValues = ->
  isValid = true
  isValid &= validate(context.distanceFromUser)
  isValid &= validate(context.hoursFromUser)
  isValid &= validate(context.minutesFromUser)
  isValid &= validate(context.secondsFromUser)
  isValid &= validate(context.paceFromUser)
  isValid &= validate(context.paceMinutesFromUser)
  isValid &= validate(context.paceSecondsFromUser)
  isValid

validate = (number) ->
  return false  if number? and number < 0
  return false  if isNaN(number)
  true

clearResult = ->
  info "Clearing result..."
  $("#distances").empty()
  $("#distances").hide()
  $("#times").empty()
  $("#times").hide()
  $("#paces").empty()
  $("#paces").hide()
  return

clearMessages = ->
  info "Clearing messages..."
  $("#messages").empty()
  return

showMessages = ->
  info "Showing messages..."
  $("#messageWrapper").show()
  return

showResults = ->
  info "Showing results..."
  $("#resultWrapper").show()
  return

showSplitTimes = ->
  info "Showing split times..."
  $("#splitTimeWrapper").show()
  return

addSplitTimesTable = (splitTimes) ->
  totalNumberOfElements = splitTimes.length
  rowsPerColumn = (Math.floor((totalNumberOfElements - 1) / (MAX_SPLIT_COLUMNS * SPLIT_INTERVAL)) + 1) * SPLIT_INTERVAL
  noOfColumns = Math.min(MAX_SPLIT_COLUMNS, Math.ceil(totalNumberOfElements / SPLIT_INTERVAL))
  rowCounter = 0
  table = "<table>"
  table += "<tr>"
  row = 1

  while row <= rowsPerColumn
    column = 0 # Create the columns for the current row.

    while column < noOfColumns
      i = row - 1 + column * rowsPerColumn
      splitTime = splitTimes[i]
      if splitTime?
        specialCSS = (if i + 1 is totalNumberOfElements or row % 5 is 0 then " special" else "")
        table += "<td class='splitDistanceUnit" + specialCSS + "'>"
        table += splitTime.splitNo + " " + splitTime.distanceUnit.unit # TODO Avrunda.
        table += "</td>"
        table += "<td class='splitTime" + specialCSS + "'>"
        table += toHMS(splitTime.splitTimeInSeconds, "mm:ss")
        table += "</td>"
      column++
    table += "</tr><tr>"  if row < rowsPerColumn
    row++
  table += "</tr>"
  table += "</table>"

  #    var table = "<table>";
  #    table += "<tr>";
  #    for (var i = 1; i <= splitTimes.length; i++) {
  #        var splitTime = splitTimes[i - 1];
  #
  #        table += "<td class='splitDistanceUnit'>";
  #        //table += i + " " + splitDistanceUnit;
  #        table += splitTime.splitNo + " " + splitTime.distanceUnit.unit;
  #        table += "</td>";
  #
  #        table += "<td class='splitTime'>";
  #        table += toHMS(splitTime.splitTimeInSeconds, "mm:ss");
  #        table += "</td>";
  #
  #        if (i % 5 == 0 && i < splitTimes.length) {
  #            table += "</tr><tr>";
  #        }
  #    }
  #    table += "</tr>";
  #    table += "</table>";
  $("#splitTimes").html table
  return

hideResultInformation = ->
  info "Hiding result information..."
  $("#messageWrapper").hide()
  $("#resultWrapper").hide()
  $("#splitTimeWrapper").hide()
  return

toHMS = (timeInSeconds, format) ->
  debug "Converting " + timeInSeconds + " s to " + format + "..."
  timeInSeconds = Math.round(timeInSeconds)
  hours = Math.floor(timeInSeconds / 3600)
  timeInSeconds = timeInSeconds % 3600
  minutes = Math.floor(timeInSeconds / 60)
  timeInSeconds = timeInSeconds % 60
  seconds = timeInSeconds
  hms = ""
  hms += hours + ":"  if hours > 0 or format is "hh:mm:ss"
  if hours > 0 or minutes > 0 or (format is "hh:mm:ss" or format is "mm:ss")
    hms += "0"  if minutes < 10 and (hours > 0 or format is "hh:mm:ss")
    hms += minutes + ":"
  hms += "0"  if (hours > 0 or minutes > 0 or (format is "hh:mm:ss" or format is "mm:ss")) and seconds < 10
  hms += Math.round(seconds)
  debug "HMS = " + hms
  hms

convertTimes = (timeInSeconds, isTimeDefinedByUser) ->
  info "Converting times in result"
  $("#times").append "<div class='header'>Time</div>"
  timeHMS = $("<div><span class='resultValue'>" + toHMS(Math.round(timeInSeconds), "hh:mm:ss") + "</span></div>").appendTo("#times")
  timeSeconds = $("<div><span class='resultValue'>" + Math.round(timeInSeconds) + "</span><span class='resultUnit'>s</span></div>").appendTo("#times")
  if isTimeDefinedByUser
    if context.secondsFromUser >= 60
      timeSeconds.addClass "definedUnit"
    else
      timeHMS.addClass "definedUnit"
  $("#times").show()
  return

convertDistances = (distanceInMeters, definedDistance) ->
  info "Converting distances in result"
  $("#distances").append "<div class='header'>Distance</div>"
  i = 0
  while i < distances.length
    distance = distances[i]
    distanceUnit = distance.unit
    distanceFactor = distance.factor
    distanceUnitLong = distance.longName
    convertedDistance = distanceInMeters / distanceFactor
    convertedDistance = round(convertedDistance, 3)
    appendedDistance = $("<div><span class='resultValue'>" + convertedDistance + "</span><span class='resultUnit'>" + distanceUnitLong + "</span></div>").appendTo("#distances")
    if definedDistance?
      debug "Comparing " + definedDistance.unit + " with " + distanceUnit
      appendedDistance.addClass "definedUnit"  if definedDistance.unit is distanceUnit
    i++
  $("#distances").show()
  return

convertPaces = (paceInMetersPerSecond, definedPace) ->
  info "Converting paces in result"
  $("#paces").append "<div class='header'>Pace</div>"
  i = 0
  while i < paces.length
    pace = paces[i]
    paceUnit = pace.unit
    paceFactor = pace.factor
    isDistancePerTime = pace.distancePerTime
    convertedPace = (if isDistancePerTime then paceInMetersPerSecond / paceFactor else paceFactor / paceInMetersPerSecond)
    convertedPace = (if isDistancePerTime then round(convertedPace, 2) else toHMS(Math.round(convertedPace), "mm:ss"))
    appendedPace = $("<div><span class='resultValue'>" + convertedPace + "</span><span class='resultUnit'>" + paceUnit + "</span></div>").appendTo("#paces")
    if definedPace?
      debug "Comparing " + definedPace.unit + " with " + paceUnit
      appendedPace.addClass "definedUnit"  if definedPace.unit is paceUnit
    i++
  $("#paces").show()
  return

round = (value, decimals) ->
  roundedValue = undefined
  if value < 10
    roundedValue = value.toFixed(Math.max(decimals, 0))
  else if value < 100
    roundedValue = value.toFixed(Math.max(decimals - 1, 0))
  else if value < 1000
    roundedValue = value.toFixed(Math.max(decimals - 2, 0))
  else
    roundedValue = value.toFixed(0)
  roundedValue

showCorrectPaceFieldsForUser = ->
  selectedPaceUnit = $("#paceUnit").val()
  debug "PaceUnit = " + selectedPaceUnit
  distancePerTime = isDistancePerTime(selectedPaceUnit)
  if distancePerTime
    debug "Pace " + selectedPaceUnit + " is defined as distance per time"
    $("#distancePerTime").show()
    $("#timePerDistance").hide()

  #        $("#pace").show();
  #        $("#paceMinutes").hide();
  #        $("#paceSeconds").hide();
  #        $("#pace").removeAttr("disabled");
  #        $("#paceMinutes").attr("disabled", "disabled");
  #        $("#paceSeconds").attr("disabled", "disabled");
  else
    debug "Pace " + selectedPaceUnit + " is defined as time per distance"
    $("#distancePerTime").hide()
    $("#timePerDistance").show()
  return

#        $("#pace").hide();
#        $("#paceMinutes").show();
#        $("#paceSeconds").show();
#        $("#pace").attr("disabled", "disabled");
#        $("#paceMinutes").removeAttr("disabled");
#        $("#paceSeconds").removeAttr("disabled");

showCorrectMenuTab = (target) ->
  $("#menu div").each (index, element) ->
    info "Handling menu " + element.id
    if element.id is target.id
      $(this).addClass "current"
    else
      $(this).removeClass "current"
    return

  $("#sections div.section").each (index, element) ->
    debug "Handling section " + element.id
    if element.id is target.id + "Section"
      $(this).show()

    #$(this).addClass("current");
    else
      $(this).hide()
    return

  return

#$(this).removeClass("current");

debug = (message) ->
  console.log "[DEBUG] " + message  if DEBUG and message isnt ""
  return
info = (message) ->
  console.log "[INFO]  " + message  if INFO and message isnt ""
  return

DEBUG = true
INFO = true
DEFAULT_MENU = "calculator"
CLEAR_ALL_FIELDS_WHEN_RELOAD = true
SHOW_CLEAR_FIELDS_BUTTON = false
SET_DEFAULT_FOR_SPLIT_DISTANCE = false
LOG_VISITORS = false
VERSION = "1.2"
RELEASE_DATE = "2013-09-30"
REVISED_DATE = "2014-01-18"
MAX_SPLIT_COLUMNS = 5
SPLIT_INTERVAL = 10
MAX_SPLITS = 200
if INFO
  info "DEBUG: " + DEBUG
  info "CLEAR_ALL_FIELDS_WHEN_RELOAD: " + CLEAR_ALL_FIELDS_WHEN_RELOAD
  info "MAX_SPLIT_COLUMNS: " + MAX_SPLIT_COLUMNS
  info "SPLIT_INTERVAL: " + SPLIT_INTERVAL
distances = [
  new Distance("in", 0.0254, "inches")
  new Distance("ft", 0.3048, "feet")
  new Distance("yd", 0.9144, "yards")
  new Distance("m", 1, "meters")
  new Distance("100m", 100, "100 m splits")
  new Distance("200m", 200, "200 m laps")
  new Distance("400m", 400, "400 m laps")
  new Distance("500m", 500, "500 m splits")
  new Distance("km", 1000, "kilometers")
  new Distance("mi", 1609.344, "miles")
  new Distance("nmi", 1852, "nautical miles")
]

paces = [
  new Pace("/100m", 100, false)
  new Pace("/200m", 200, false)
  new Pace("/400m", 400, false)
  new Pace("/500m", 500, false)
  new Pace("/km", 1000, false)
  new Pace("/mi", 1609.344, false)
  new Pace("/nmi", 1852, false)
  new Pace("ft/s", 0.3048 / 1, true)
  new Pace("m/s", 1 / 1, true)
  new Pace("km/h", 1000 / 3600, true)
  new Pace("mph", 1609.344 / 3600, true)
  new Pace("knots", 1852 / 3600, true)
]

events = [
  new Event(42.195, "Marathon")
  new Event(21.0975, "Half Marathon")
  new Event(30, "30K")
  new Event(25, "25K")
  new Event(32.187, "20M")
  new Event(24.140, "15M")
  new Event(20, "20K")
  new Event(16.093, "10M")
  new Event(15, "15K")
  new Event(10, "10K")
  new Event(8, "8K")
  new Event(8.047, "5M")
  new Event(5, "5K")
]

$(document).ready ->
  init()
  return
