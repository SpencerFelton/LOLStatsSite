var key = '?api_key=';
const URL = 'https://euw1.api.riotgames.com';
var accDetails;
var matchHistory;
var recentMatches = [];

function nameRequest(callback){ //ajax request to the server which takes handleNameRequest as a callback, gets unique ID from summener name
  var name = document.forms["summonerName"]["summoner"].value;
  var type = "/lol/summoner/v4/summoners/by-name/"
  var request = URL+type+name+key;
  const Http = new XMLHttpRequest();
  Http.onreadystatechange = function (){
    if (this.readyState == 4 && this.status == 200) { // success
      callback(this);
    }
  }
  Http.open('GET', request);
  Http.send();
}

function handleNameRequest(xhttp){ // parse JSON response from server
  var existingSummonerID = checkSummonerDetailsExist();
  if (existingSummonerID) {
    removeSummonerDetails();
    accDetails = null
  }
  var jsonResponse = JSON.parse(xhttp.responseText)

  accDetails = jsonResponse;

  var textElement = document.createElement("h3");
  var text = "Your summoner ID is:" + jsonResponse.id
  var textNode = document.createTextNode(text);
  textElement.appendChild(textNode);

  var masteryChampImgDiv = document.createElement("div");
  masteryChampImgDiv.id = "mostPlayedChampion";
  document.getElementById("summonerDetails").insertBefore(masteryChampImgDiv, document.getElementById("matchHistory"));
  var previousMatchHistory = document.getElementById("matchHistory");
  if (previousMatchHistory == null) {
    var matchHistory = document.createElement("div");
    matchHistory.id = "matchHistory";
    document.getElementById("summonerDetails").appendChild(matchHistory);
  }
  idRequest(handleIDRequest);
  matchHistoryRequest(handleMatchHistoryRequest);
}

function checkSummonerDetailsExist(){
  var summonerID = document.getElementById("summonerID");
  if (accDetails == null) {
    return false
  }
  return true;
}

function removeSummonerDetails(){
  var summonerDetails = document.getElementById("summonerDetails");
  console.log("here");
  while(summonerDetails.firstChild){
    summonerDetails.removeChild(summonerDetails.firstChild);
  }
}

function idRequest(callback){
  var type = "/lol/champion-mastery/v4/champion-masteries/by-summoner/";
  var request = URL+type+accDetails.id+key;
  const Http = new XMLHttpRequest();
  Http.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      callback(this);
    }
  }
  Http.open('GET', request);
  Http.send();
}

function handleIDRequest(xhttp){
  var jsonResponse = JSON.parse(xhttp.responseText);
  var champID = jsonResponse[0].championId;
  var champName = champByID(champID);

  var textElement = document.createElement("h3");
  var text = "Most played champ is: " + champName;
  var textNode = document.createTextNode(text);
  textElement.appendChild(textNode);

  var imgElement = document.createElement("img");
  imgElement.setAttribute("src", "LeagueImages/img/champion/tiles/"+champName+"_0.jpg");

  imgElement.setAttribute("id", "mostPlayed");


  document.getElementById("summonerDetails").insertBefore(imgElement, document.getElementById("matchHistory"));
  document.getElementById("summonerDetails").insertBefore(textElement, document.getElementById("mostPlayedChampion"));
}

function matchHistoryRequest(callback){
  var type = "/lol/match/v4/matchlists/by-account/";
  var request = URL+type+accDetails.accountId+key;
  const Http = new XMLHttpRequest();
  Http.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      callback(this)
    }
  }
  Http.open('GET', request);
  Http.send();
}

function handleMatchHistoryRequest(xhttp){
  var jsonResponse = JSON.parse(xhttp.responseText);
  var textToAdd = "Region: " + jsonResponse.matches[0].platformId + " match ID: " + jsonResponse.matches[0].gameId;
  var recentMatches = [];
  matchHistory = jsonResponse;
  console.log(matchHistory);
  var previousMatches = checkForExistingMatchDetails();
  if (previousMatches) {
    removeExistingMatches();
  }
  for(var i = 0; i < 10; i++){
    var matchHistoryPlace = getMatchHistoryPlaceByMatchID(matchHistory.matches[i].gameId)
    requestMatchDetailsByMatchID(matchHistory.matches[i].gameId, matchHistoryPlace);
  }
}

function getMatchHistoryPlaceByMatchID(id){
  for(var j=0; j < 100; j++){
    if(matchHistory.matches[j].gameId == id){
      return j%10;
    }
  }
}

function requestMatchDetailsByMatchID(id){
  var type = "/lol/match/v4/matches/";
  var request = URL+type+id+key;
  const Http = new XMLHttpRequest();
  Http.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      var jsonResponse = JSON.parse(this.responseText);
      recentMatches.push(jsonResponse)
      if (recentMatches.length == 10) {
        var orderedMatches = orderMatchByTimestamp(recentMatches);
        for(var match = 0; match < 10; match++){
          handleMatchDetailsByMatchID(orderedMatches[match]);
        }
      }
    }
  }
  Http.open('GET', request);
  Http.send();
}

function orderMatchByTimestamp(matchArray){ // given an array of match JSON objects, order them by their gameCreation time (largest -> smallest)
  var starterValue; // initial value to compare gameCreation vs
  var orderedMatches = []; // array of ordered matches
  var matchWithStarterValue; // variable to hold the match JSON object with largest timestamp in this loop
  while (matchArray.length != 0) { // At the end of every loop through the array of matches, one will be removed, loop until all are gone
    for(var x = 0; x < 10; x++){ // loop 10 times, as there are 10 matches
      starterValue = 0; // initialise comparison value to 0 for each new loop over the matchArray
      matchWithStarterValue = null; // initialise to null for each iteration through the matchArray
      for(var i = matchArray.length-1; i >= 0; i--){ // for every match
        if (matchArray[i].gameCreation > starterValue) { // if the gameCreation value is larger (more recent) than the current value
          starterValue = matchArray[i].gameCreation; // reassign comparison value and JSON object
          matchWithStarterValue = matchArray[i];
        }
      }
      matchArray.splice(matchArray.indexOf(matchWithStarterValue), 1); // remove JSON obect with largest timestamp from matchArray
      orderedMatches.push(matchWithStarterValue); // push JSON object to orderedMatches array
    }
  }
  return orderedMatches;
}

function checkForExistingMatchDetails(){
  var matchHist = document.getElementById("matchHistory");
  if (matchHist == null) {
    return false;
  }
  if (matchHist.firstChild == null) {
    return false;
  }
  else {
    return true;
  }
}

function removeExistingMatches(){
  var matchHist = document.getElementById("matchHistory");
  while(matchHist.firstChild){
    matchHist.removeChild(matchHist.firstChild);
  }
}

function handleMatchDetailsByMatchID(xhttp){ //create a container for match details
  console.log(xhttp);

  var matchContainer = document.createElement("div"); // container for both team's players
  matchContainer.className = "matchContainer";

  var containerBlue = document.createElement("div"); // container for blue team's players

  var containerRed = document.createElement("div"); // container for red team's players

  var matchPlayers = xhttp.participantIdentities; // information about the player's accounts
  var matchPlayersGameDetails = xhttp.participants; // information about the players in this match

  var blueWin; // red or blue team win
  var redWin;
  var playerParticipantID = getPlayerParticipantIDFromSummonerName(accDetails.name, matchPlayers); // get the searched player's participantID for this match
  var victory = checkPlayerTeamWin(matchPlayersGameDetails, playerParticipantID); // return 0,1,2 or 3 to represent a red/blue side win/loss

  if (victory == 0) { // set class name for red and blue team containers for a win/loss
    containerBlue.className = "blueTeam win";
    containerRed.className = "redTeam lose";
  }
  if (victory == 1) {
    containerBlue.className = "blueTeam lose";
    containerRed.className = "redTeam win";
  }
  if (victory == 2) {
    containerRed.className = "redTeam win";
    containerBlue.className = "blueTeam lose";
  }
  if (victory == 3) {
    containerRed.className = "redTeam lose";
    containerBlue.className = "blueTeam win";
  }

  for(var i = 0; i<10; i++){ //for every player
    var summonerContainer = document.createElement("div"); // create a div to hold all details about the player
    summonerContainer.className = "summoner";

    var text = document.createElement("p"); // text element to hold a summoner name
    text.className = "summonerName";

    var textToAdd = "Summoner " + matchPlayers[i].participantId + ": " + matchPlayers[i].player.summonerName; // summoner name
    content = document.createTextNode(textToAdd);
    text.appendChild(content);

    summonerContainer.appendChild(text);

    // div container to hold images of items bought
    var itemsContainer = document.createElement("div");
    itemsContainer.className = "itemsContainer";
    var itemNames = getItemsByID(matchPlayersGameDetails[i]);
    var itemJsonObjectsArray = returnFullItemObjectArray(itemNames);
    console.log(itemJsonObjectsArray);
    for(item in itemJsonObjectsArray){
      var imgPath = itemJsonObjectsArray[item]["image"]["full"];
      var itemImgElement = document.createElement("IMG");
      var idItem = itemJsonObjectsArray[item].image.full.replace(".png","");
      itemImgElement.setAttribute("src","LeagueImages/10.1.1/img/item/"+imgPath);
      itemImgElement.id = idItem;
      itemImgElement.className = "item";
      itemsContainer.appendChild(itemImgElement);
    }
    summonerContainer.appendChild(itemsContainer);

    // image element to hold a jpeg of the champion played
    var imgElement = document.createElement("IMG");
    var championID = matchPlayersGameDetails[i].championId;
    var champName = champByID(championID);
    imgElement.setAttribute("src", "LeagueImages/img/champion/tiles/"+champName+"_0.jpg");
    imgElement.className = "champion";
    summonerContainer.appendChild(imgElement);

    var summonerSpellContainer = document.createElement("div");
    summonerSpellContainer.className = "summonerSpells";

    // image element to hold a jpeg of the first summoner spell used
    var summonerSpell1ImgElement = document.createElement("IMG");
    var summonerSpellID = matchPlayersGameDetails[i].spell1Id;
    var spellName = summonerSpellByID(summonerSpellID);
    summonerSpell1ImgElement.setAttribute("src", "LeagueImages/10.1.1/img/spell/"+spellName+".png");
    summonerSpell1ImgElement.className = "summonerSpell";
    summonerSpellContainer.appendChild(summonerSpell1ImgElement);

    // image element to hold a jpeg of the second summoner spell used
    var summonerSpell2ImgElement = document.createElement("IMG");
    var summonerSpellID = matchPlayersGameDetails[i].spell2Id;
    var spellName = summonerSpellByID(summonerSpellID);
    summonerSpell2ImgElement.setAttribute("src", "LeagueImages/10.1.1/img/spell/"+spellName+".png");
    summonerSpell2ImgElement.className = "summonerSpell";
    summonerSpellContainer.appendChild(summonerSpell2ImgElement);

    summonerContainer.appendChild(summonerSpellContainer);


    if (i < 5) { //blueTeam players
      containerBlue.appendChild(summonerContainer);
    }
    if (i >= 5) { //redTeam players
      containerRed.appendChild(summonerContainer);
    }

  }

  matchContainer.appendChild(containerBlue); // attach red and blue teams to the match containers
  matchContainer.appendChild(containerRed);
  document.getElementById('matchHistory').appendChild(matchContainer); // attach the match container to the overall match history
}
function getPlayerParticipantIDFromSummonerName(summonerName, participants){ // return the participantID of a player in a match by their summoner name
  for(player in participants){
    if (participants[player]["player"].summonerName == summonerName) {
      return participants[player].participantId;
    }
  }
}
function checkPlayerTeamWin(participants, participantID){ // given paticipants of the match, and the participant ID of this player in a match, return 0,1,2,3 corresponding to red and blue team victory/defeats
  var victory = participants[participantID-1]["stats"].win;

  var team;
  if (participantID < 5) {
    team = "blue";
  }
  if (participantID >= 5) {
    team = "red";
  }
  if (victory == true && team == "blue") {
    return 0;
  }
  if (victory == false && team == "blue") {
    return 1;
  }
  if (victory == true && team == "red") {
    return 2;
  }
  if (victory == false && team == "red") {
    return 3;
  }
}

function getSummonerData(){
  nameRequest(handleNameRequest);
}

function getItemsByID(participant){
  var items = [];
  if(participant['stats'].item0 != 0){
    items.push(participant['stats'].item0);
  }
  if(participant['stats'].item1 !=0){
    items.push(participant['stats'].item1);
  }
  if(participant['stats'].item2 != 0){
    items.push(participant['stats'].item2);
  }
  if(participant['stats'].item3 != 0){
    items.push(participant['stats'].item3);
  }
  if(participant['stats'].item4 != 0){
    items.push(participant['stats'].item4);
  }
  if(participant['stats'].item5 != 0){
    items.push(participant['stats'].item5);
  }
  return items;
}

function returnFullItemObjectByID(id){ // given an item ID, return a full json object of the item
  return itemJson[0]["data"][id];
}

function returnFullItemObjectArray(arrayOfItemIds){ // given an array of item IDs, return an array of json objects of those items
  var itemJsonObjects = [];
  for(var itemId in arrayOfItemIds){
    itemJsonObject = returnFullItemObjectByID(arrayOfItemIds[itemId]);
    itemJsonObjects.push(itemJsonObject);
  }
  return itemJsonObjects;
}

function summonerSpellByID(ID){ // return summoner spell name from spell ID
  for (var spells in summonerSpell[0]['data']){
    if (summonerSpell[0]['data'][spells].key == ID) {
      return spells;
    }
  }
}

function champByID(ID){ // returns champ name from champ ID
  for (var keys in champsJSON[0]['data']){
    if (champsJSON[0]['data'][keys].key == ID) {
      return keys;
    }
  }
}
