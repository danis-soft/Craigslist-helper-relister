/*REM - This file is part of Craigslist submitter*/
var DEBUG = true;

const MAXIMUM_LINES_LOG = 50;

/*
too fast posting error:
You are posting too rapidly.
Craig can't type them in this fast.
Please try again in a little while.
Edit Again
<div class="submit_button">
    <button type="submit" name="go" value="Edit Again" class="go">Edit Again</button>
</div>
*/
var TOO_FAST_ERROR_DELAY_SECS = "110"; //in seconds
var TOO_FAST_ERROR_DELAY_SEC_LIMIT = "360";//in seconds

var oCommonDefs = require("./common_defs.js");
var oCommonStorage = require("./common_storage.js");

var outputDebugLog = oCommonDefs.outputDebugLog;

  
//var sContent = "abc";
console.log("Craigslist_helper: + running_content_script");
  



  //alert("my content script was loaded");

  window.onload = function() {
    if (window.jQuery) {
        // jQuery is loaded
      //  alert("Yeah!");
    } else {
        // jQuery is not loaded
      //  alert("Doesn't Work");
    }
  } 

 // var dictModes = {first: "accounts.craigslist.org/login/home", second: "post.craigslist.org"};
 var appModesRegMatches = {
   first: /accounts.craigslist.org\/login\/home/, 
   second:  /post.craigslist.org\/.*?s=edit$/,
   third: /post.craigslist.org\/.*?s=preview$/,
   fourth: /post.craigslist.org\/k\/.*/,//confirmation page
   toofast: /post.craigslist.org\/k\/.*s=postcount$/,
   undelete: /post.craigslist.org\/manage\/\d+$/
};

const UI = Object.freeze({
  ERRORS: {TOO_FAST:"you are posting too rapidly"}
})
  
String.prototype.isMatched = function(regEx)
{
    if( this.search(regEx) > -1)
      return true;

    return false;

}

console.log(appModesRegMatches.first);

//determine the page and mode we are in

  var sDocURL = document.URL.trim();
  var gDict = new Object();
  var g_oExpiredOnly = {};
  var g_oExpiredAndDeleted = {};
  
  var POSTING_STATUS_TYPE = {
    ACTIVE : "active",
    EXPIRED: "expired",
    DELETED: "deleted"
  };
  

 

  async function  ExecuteProgram()
  {


    console.log("Detected document is ready.  Attempting to determine the mode according to the document URL");
    console.log("Document URL: " + sDocURL);
  
  

    if(sDocURL.isMatched(appModesRegMatches.first))
    {
      // await  chrome.storage.local.clear(()=>{
      //   console.log("storage cleared");
      // });

      // //var value = {'testing': "value"};
      // var value = {};
      // value[key] = "value";
      // var jsonObj = JSON.stringify(value);

      // //{ sKey: oValue }
      // await chrome.storage.local.set(value, ()=>
      // {
      //   console.log("Value saved for key: " + key);
      // });

      mapActivePosts = firstMode();
   //   await tooFastError();

    }
    else if(sDocURL.isMatched(appModesRegMatches.second))
    {
      // let val = await chrome.storage.local.get(key, (result)=>
      // {
      //   console.log(result);
      // });
      secondMode();
  
    }else if (sDocURL.isMatched(appModesRegMatches.third) )
    {
      // let val = await chrome.storage.local.get(key, (result)=>
      // {
      //   console.log(result);
      // });
      thirdMode();
    }
    else if( sDocURL.isMatched(appModesRegMatches.toofast))//we are posting too fast, so got an error page
    {

      console.log("Detected posting too fast link");

     // var sText = $(".picker:contains('activities'B)").text().trim().toLowerCase();
      var sText = $(".body").text().trim().toLowerCase();

      if( sText.length > 0 && sText.search(UI.ERRORS.TOO_FAST) >= 0 )
      {
        console.log("Detected and confirmed " + UI.ERRORS.TOO_FAST + " text");

        let msg = "Starting to wait.  Current time is: " + new Date().toLocaleString();
        console.log(msg);
        persistDebugLog(msg);

        tooFastError();
      }
     
    }//fourth mode has to be checked first because the URL's is similar to too fast, 
    //but more generic https://post.craigslist.org/k/5MC9lDQE7BGhRKXvmlxeQg/CS6uc
    else if (sDocURL.isMatched(appModesRegMatches.fourth) )
    {
      console.log("Detected fourth mode by URL.");
      
      if(DEBUG)
        console.log("Trying to make sure by detecting the text");
  //    /*Thanks for posting! We really appreciate it!
//View your post at sfbay.craigslist.org/sby/hab/d/san-jose-elderly-disabled-walker-with/7098895568.html
//Manage your post
//Return to your account page/**/ */
        var sText = $("h4:contains('Thanks for posting!')").text().trim().toLowerCase();

        if( sText.length > 0 && sText.search("we really appreciate it") >= 0 )
        {
          if(DEBUG)
            console.log("Found the text.  Detected the fourth mode for sure.");

          fourthMode();

         

        }

        
    }//else
    

  }//ExecuteProgram function

  async function tooFastError()
  {
    // sleep( TOO_FAST_ERROR_DELAY_SECS*1000).then(function(){
    //   $("form#postingForm").submit();
    // });

    outputDebugLog("Entering tooFastError function");
    
    let iDelaySecs = 1;

    oCommonStorage.SyncStorage.get(oCommonDefs.STORAGE_KEYS.KEY_LAST_ERROR_DELAY_USED).then((result)=>{
      //var iDelay = await getTooFastErrorDelay();

      if( isVariableNull(result) 
        || typeof(result) != 'number'
        || Number.isNaN(result))
      {
        result = TOO_FAST_ERROR_DELAY_SECS;
      }
      else
      {
        result = (result + (TOO_FAST_ERROR_DELAY_SECS / 2)) % TOO_FAST_ERROR_DELAY_SEC_LIMIT;
      }

      iDelaySecs = Math.floor(result);

      return oCommonStorage.SyncStorage.save(oCommonDefs.STORAGE_KEYS.KEY_LAST_ERROR_DELAY_USED, iDelaySecs);


    }).then((result)=>
    {
      let msg = "Current time: " + new Date().toLocaleString() + " delay time: " + iDelaySecs  + " secs";      

      console.log(msg);
      persistDebugLog(msg);

      return sleep((iDelaySecs % TOO_FAST_ERROR_DELAY_SEC_LIMIT) * 1000);

    }).then(()=>{

      let msg = "Sleep expired => Current time: + " + new Date().toLocaleString();
      outputDebugLog(msg)
      persistDebugLog(msg);
      
     // alert("The timer has sucessfuly expired");
      $("form#postingForm").submit();
  
    });


  
  }
  
  function getTooFastErrorDelay()
  {
    // return oCommonStorage.SyncStorage.get(oCommonDefs.STORAGE_KEYS.KEY_LAST_ERROR_DELAY_USED).then((iDelay)=>{
    //   if( isVariableNotNull(iDelay))
        
    // });
  }

$(document).ready(()=>
{
    ExecuteProgram(); 
});

//we are on the first (acccount) page of craigslist.  We have to decide whether we are parsing the listings or we are continuing 
//with the craigslist relisting
async function firstMode()
{

  //check if we have  var KEY_ALL_LISTINGS var KEY_CURRENT_LISTING
  let oAllListings = null;
  let oCurrentListing = null;
  
  oAllListings = await getAllListings();
  oCurrentListing = await getCurrentlyProcessingListing();

  if( isVariableNotNull(oAllListings) && isVariableNotNull(oCurrentListing))
  {

    if(DEBUG)
    {
      console.log("Detected oAllListings && oCurrentListing were defined and not null");
      console.log("oCurrentListing.index: " + oCurrentListing.index + " | oAllListings.data.length: " + oAllListings.data.length );
      console.log("oAllListings.data[oCurrentListing.index].repost_url: " + oAllListings.data[oCurrentListing.index].repost_url + " == " +  oCurrentListing.data.repost_url);
    }

      //make sure we haven't ran out of things to post
    if(oCurrentListing.index < oAllListings.data.length &&
       oAllListings.data[oCurrentListing.index].repost_url == oCurrentListing.data.repost_url)
    {
      if( DEBUG )
        console.log("Detected from storage that we have other outstanding listing to post.");
      
        renewListings(oAllListings, oCurrentListing);
      
    }
    else
    {
      if(DEBUG)
      {
        console.log("ERROR: Either current listing is out of bounds or current listing data does not match all listing data.");
        console.log("oCurrentListing.index: " + oCurrentListing.index + " | Repost URLS: " +  oAllListings.data[oCurrentListing.index].repost_url + " == " +  oCurrentListing.data.repost_url);
      }

      cleanupListings();
    }
  }
  else//we are in the parse mode
  {
   
    var oCompletedPosting = null;
    
    oCompletedPosting = await oCommonStorage.SyncStorage.get(oCommonDefs.STORAGE_KEYS.KEY_COMPLETED_POSTING);

    if( isVariableNotNull(oCompletedPosting))
    {

      await oCommonStorage.SyncStorage.remove(oCommonDefs.STORAGE_KEYS.KEY_COMPLETED_POSTING);


      bootbox.alert("The posting of all the listings has been completed.  You might need to refresh the page to see the posted listings.");

    }

    console.log("No other listing detected in storage.  Parsing listings");
    parseListings();
  }
}

function cleanupListings()
{

  console.log("Deleting KEY_ALL_LISTINGS and KEY_CURRENT_LISTING");
 // alert("Cleaning up listings");
  // if( DEBUG)
  //   debugger;

  Promise.allSettled([oCommonStorage.SyncStorage.remove(oCommonDefs.STORAGE_KEYS.KEY_ALL_LISTINGS), oCommonStorage.SyncStorage.remove(oCommonDefs.STORAGE_KEYS.KEY_CURRENT_LISTING)]);

}

function isVariableNull(val)
{
  return !isVariableNotNull(val);
}

function isVariableNotNull(val)
{
  if (typeof val !== 'undefined' && val) 
  {
    return true;
  }

  return false;
}

// function parseListings()
// {
//   // SyncStorage.get(KEY_NEVERSHOW_LISTINGS).then((oData)=>
//   // {

//   //   var aNeverShowURLS = new Array();

//   //   // { dateCreated: Date.now(), dateAccessed: Date.now(), data: request.value.payload.nevershow};
//   //   if( isVariableNotNull(oData) )
//   //     aNeverShowURLS = oData.data;

//   //   parseListings(aNeverShowURLS);
//   // });
// }


function parseListingsInternal(aNeverShowURLS, bIncludeDeleted )
{
  var mapActivePosts = new Map();
  var mapDeletedPosts = new Map();
  var mapExpired = new Map();
 // var mapTempExpired = new Map();


  var sParamValue = null;

  console.log("Craigslist_helper: " + "adding parameters to dictionary");

  var sText = "",
      sParsedText = "",
      sKeyText = "",
      sTitleText = "",
      sURL = "",
      sPostingStatus = "",
      sDictKey = "";
  var iLastIndex = -1;
  const E_DELETED_TYPE = {
    REPOST: "repost",
    UNDELETE: "undelete"
  } 

  let eDeletedType = E_DELETED_TYPE.REPOST;


  $("tr.posting-row").each(function(){

    iLastIndex = -1;

    sText = $(this).children("td.title").text().trim();

    sParsedText = sText.replace(/[\r\n]/gm,"").replace(/[ ]{2,}/g, " ");//remove newline characters and extra white spaces
    
    iLastIndex = sParsedText.lastIndexOf("-");

    //let's try to see if the - is followed by a valid price.  If not then ignore the - character
    if( iLastIndex > 0 //we found '-' character
      && sParsedText.substr(iLastIndex, sParsedText.length).isMatched(/-[ ]*\$[ ]*\d{1,6}$/))//we found price after -
    {
      sKeyText = sParsedText.substr(0, iLastIndex);
    }
    else
      sKeyText = sParsedText;

    sTitle = sKeyText;

    //added new line
    sKeyText = escapeQuote(sKeyText);

  //  sKeyText = (iLastIndex > 0) ? sParsedText.substr(0, iLastIndex) :  sParsedText;//remove price
    
    console.log("parsed text: " + sParsedText);
    outputDebugLog("key text: " + sKeyText);
    

    outputDebugLog("" + $(this).children("td.status").text().trim().toLowerCase().search("active"));
    sPostingStatus =  $(this).children("td.status").text().trim().toLowerCase();//.search("active")

    if(sPostingStatus.isMatched(POSTING_STATUS_TYPE.ACTIVE) )
    {
      //console.log
     // sParsedText = sText.replace(/[\r\n]/gm,"").replace(/[ ]{2,}/g, " ");//remove newline characters and extra white spaces
      
      if( mapActivePosts.has(sKeyText) == false)
        mapActivePosts.set(sKeyText, sParsedText);
    }
    else if(sPostingStatus.isMatched(POSTING_STATUS_TYPE.DELETED)  )
    {
      sURL = $(this).children("td.buttons").find("form.manage.repost").attr("action");


      /*
      Your posting can be seen at sfbay.craigslist.org/sby/for/d/san-jose-hamster-ball-75-inches/7402360637.html.


      */
      // if (isVariableNull(sURL) ||  sURL.length == 0)
      // {
      //   sURL = $(this).children("td.buttons").find("form.manage.undelete").attr("action");
      //   var sCrypt = $(this).children("td.buttons").find("form.manage.undelete").children("input[name='crypt']").attr("value");
      //   sURL+= "?action=undelete&crypt=" + sCrypt;

      //   eDeletedType = E_DELETED_TYPE.UNDELETE;
      // }
      // else
       {
         eDeletedType = E_DELETED_TYPE.REPOST;
         sURL+= "?action=repost";
       }

      outputDebugLog("Found deleted");
      outputDebugLog("raw text: " + sText);
      outputDebugLog($(this).children("td.postingID.deleted").innerText);
      outputDebugLog("URL: " + sURL);

      if( sURL.length > 0 && mapDeletedPosts.has(sKeyText) == false)
        mapDeletedPosts.set(sKeyText, {title: sParsedText, repost_url: sURL, title_no_price: sTitle, type:eDeletedType});
    }
    else if(sPostingStatus.isMatched(POSTING_STATUS_TYPE.EXPIRED)  )
    {
      //sText = $(this).children("td.title.expired").text().trim();
      sURL = $(this).children("td.buttons.expired").find("form.manage.display").attr("action");
      sURL+= "?action=repost";

      outputDebugLog("Found expired");
      outputDebugLog("raw text: " + sText);

      outputDebugLog("URL: " + sURL);

      
      outputDebugLog("==============================================");
      outputDebugLog("");
    
      sDictKey = escapeQuote(sParsedText);
    
     // if( mapActivePosts.has(sKeyText) == false )
        // && mapDeletedPosts.has(sKeyText) == false
        // && !(sDictKey in gDict) )
      {
  
          if(  sURL.length > 0 && NeverShowURLS == null || aNeverShowURLS.find(data=>(data.repost_url === sURL || data.title_no_price === sTitle)) === undefined) 
            mapExpired.set(sKeyText, {title: sParsedText, repost_url: sURL, title_no_price: sTitle});
       //     gDict[sDictKey] = {"title": sParsedText, "repost_url":sURL, "title_no_price": sKeyText};
      }

    }
    
  });//for each table row $("tr.posting-row").each

  mapDeletedPosts.forEach((value, key)=>{
    if( !mapActivePosts.has(key))
      g_oExpiredAndDeleted[key] = value;
  });

  mapExpired.forEach((value, key)=>{
    if( !mapActivePosts.has(key))
    {
      g_oExpiredAndDeleted[key] = value;
      g_oExpiredOnly[key] = value;
    }
  });


  console.log("");
  console.log("Printing out mapExpired");
  console.log(mapExpired);


  console.log("Printing out mapDeletedPosts");
  console.log(mapDeletedPosts);
  console.log("Printing out mapActive");
  console.log(mapActivePosts);


  return mapExpired;
}//parseListings function


function persistDebugLog(msg)
{
  if (!oCommonDefs.isProduction()) 
  {

    oCommonStorage.SyncStorage.get(oCommonDefs.STORAGE_KEYS.LOG_ROLLING).then((data)=>
    {
      if( isVariableNotNull(data) 
        && isVariableNotNull(data.log) 
        && data.log.length > MAXIMUM_LINES_LOG  )
        data.log.shift();

      
      if( isVariableNull(data))
      {
        data = {log:[]};
      }

      data.log.push(msg);

      oCommonStorage.SyncStorage.save(oCommonDefs.STORAGE_KEYS.LOG_ROLLING, data).then((result)=>{
        console.log("Saving to persistent storage under the key of " + oCommonDefs.STORAGE_KEYS.LOG_ROLLING);
        console.log(result);
      });


    });
  }//is debug environment

  outputDebugLog(msg);
}

async function parseListings(bIncludeDeleted = false)
{

  var mapActivePosts = new Map();
  var mapDeletedPosts = new Map();
  var mapPostsToShow = new Map();

  console.log("Detected dictModes.first mode");

  var aNeverShowURLS = null;

  var oData = await getNeverShowListings();

  if( isVariableNotNull(oData) )
      aNeverShowURLS = oData.data;

  parseListingsInternal(aNeverShowURLS, bIncludeDeleted);




  //gDict = mapPostsToShow;
  
  console.log(document.URL);

  console.log("================================");
  console.log("================================");

  console.log("================================");
  console.log("================================");
  return gDict;

}



// async function parseListings()
// {
//   var mapActivePosts = new Map();
//   var mapDeletedPosts = new Map();
//   console.log("Detected dictModes.first mode");


//   var aNeverShowURLS = null;

//   var oData = await getNeverShowListings();

//   if( isVariableNotNull(oData) )
//       aNeverShowURLS = oData.data;

//   if( sContent != null )
//   {

//     var bFound = false;


//     /*https://www.expedia.com/Hotel-Search?packageType=fh&c=ee60d470-ee37-4ce7-a390-037744e15422&ttla=CUN&ftla=SFO&tripType=ROUND_TRIP&origin=San+Francisco,+CA,+United+States+of+America+(SFO-San+Francisco+Intl.)&destination=Riviera+Maya&startDate=7/3/2019&endDate=7/11/2019&checkInDate=7/3/2019&checkOutDate=7/11/2019&adults=2&children=1_5&infantsInSeats=0&cabinClass=e&regionId=602901&hotelName=barcelo&lodging=allInclusive&sort=recommended*/
//     // var sDocumentURL = document.URL;
//     // var url = new URL(document.URL)
//     // var oSearchParams = url.searchParams;

//     // var arParams = ["startDate", "endDate", "hotelName", "lodging"];
//     //var arParams
//     var sParamValue = null;

//     console.log("Craigslist_helper: " + "adding parameters to dictionary");

//     var sText = "";
//    // var mapExpired = new Map();
//     // gDict = mapExpired;
//     var sParsedText = "";
//     var sKeyText = "";
//     var sURL = "";
//     var sPostingStatus = "";

//     var sDictKey = "";

//     var iLastIndex = -1;

// /*
// $("tr.posting-row").each(function(){
// console.log("==================");
// console.log("" + $(this).children("td.status").hasClass("active"))
//   console.log("" + $(this).children("td.status").text().trim());
// console.log("" + $(this).children("td.status").text().trim().toLowerCase().search("active"));

// console.log("==================");
// });
// */
//   $("tr.posting-row").each(function(){

//     iLastIndex = -1;

//     sText = $(this).children("td.title").text().trim();

//     sParsedText = sText.replace(/[\r\n]/gm,"").replace(/[ ]{2,}/g, " ");//remove newline characters and extra white spaces
    
//     iLastIndex = sParsedText.lastIndexOf("-");

//     //let's try to see if the - is followed by a valid price.  If not then ignore the - character
//     if( iLastIndex > 0 //we found '-' character
//       && sParsedText.substr(iLastIndex, sParsedText.length).isMatched(/-[ ]*\$[ ]*\d{1,6}$/))//we found price after -
//     {
//       sKeyText = sParsedText.substr(0, iLastIndex);
//     }
//     else
//       sKeyText = sParsedText;

//   //  sKeyText = (iLastIndex > 0) ? sParsedText.substr(0, iLastIndex) :  sParsedText;//remove price
    
//     console.log("parsed text: " + sParsedText);
//     console.log("key text: " + sKeyText);
    

//     console.log("" + $(this).children("td.status").text().trim().toLowerCase().search("active"));
//     sPostingStatus =  $(this).children("td.status").text().trim().toLowerCase();//.search("active")

//     if(sPostingStatus.isMatched(POSTING_STATUS_TYPE.ACTIVE) )
//     {
//       //console.log
//      // sParsedText = sText.replace(/[\r\n]/gm,"").replace(/[ ]{2,}/g, " ");//remove newline characters and extra white spaces
      
//       if( mapActivePosts.has(sKeyText) == false)
//         mapActivePosts.set(sKeyText, sParsedText);
//     }
//     else if(sPostingStatus.isMatched(POSTING_STATUS_TYPE.DELETED)  )
//     {
//       if( mapDeletedPosts.has(sKeyText) == false)
//         mapDeletedPosts.set(sKeyText, sParsedText);
//     }
//     else if(sPostingStatus.isMatched(POSTING_STATUS_TYPE.EXPIRED)  )
//     {
//       //sText = $(this).children("td.title.expired").text().trim();
//       sURL = $(this).children("td.buttons.expired").find("form.manage.display").attr("action");
//       sURL+= "?action=repost";


      
//       //sText = $(this).text().text().trim();
//       console.log("raw text: " + sText);
//       console.log("URL: " + sURL);

      
      
      
      
//       console.log("==============================================");
//       console.log("");
    
//     }

//     sDictKey = escapeQuote(sParsedText);
    
//     if( mapActivePosts.has(sKeyText) == false
//       && mapDeletedPosts.has(sKeyText) == false
//       && !(sDictKey in gDict) )
//     {

//         if( aNeverShowURLS == null || aNeverShowURLS.find(data=>(data.repost_url === sURL || data.title_no_price === sKeyText)) === undefined) 
//           gDict[sDictKey] = {"title": sParsedText, "repost_url":sURL, "title_no_price": sKeyText};
//     }

    
    
//   });

//     console.log("");
//    // console.log("Printing out mapExpired");
//     //console.log(mapExpired);
//     //gDict = mapExpired;
//     console.log(gDict);

//     console.log("Printing out mapDeletedPosts");
//     console.log(mapDeletedPosts);
//     console.log("Printing out mapActive");
//     console.log(mapActivePosts);
//     console.log(document.URL);



//     console.log("================================");
//     console.log("================================");

//     console.log("================================");
//     console.log("================================");


//     return mapActivePosts;
//   }
// }

function secondMode()
{
  isContinueRepost($("input#PostingTitle").val()).then((bPost)=>
  {
    if( bPost )
      // submit a form
      $("form#postingForm").submit();
  });
}


function thirdMode()
{

  isContinueRepost($("#titletextonly").html()).then((bPost)=>
  {
    if( bPost )
    {
      sleep(getRepostTimeDelay())
        .then($("form#publish_top").submit());
    }
  });
}
async function undeleteSuccess()
{
  let oAllListings = null;
  let oCurrentListing = null;
  
  
  oAllListings = await getAllListings();
  oCurrentListing = await getCurrentlyProcessingListing();


}

//final mode - going to the account main page after this
async function fourthMode()
{

  let oAllListings = null;
  let oCurrentListing = null;
  
  
  oAllListings = await getAllListings();
  oCurrentListing = await getCurrentlyProcessingListing();


  var bNotFound = true;
  //await SyncStorage.remove(KEY_CURRENT_LISTING);

  //remove last error delay used
  await oCommonStorage.SyncStorage.remove(oCommonDefs.STORAGE_KEYS.KEY_LAST_ERROR_DELAY_USED);

  if(   isVariableNotNull(oAllListings) 
        && isVariableNotNull(oCurrentListing))
    {


      oCurrentListing.index++;

      if( oCurrentListing.index < oAllListings.data.length) 
      {

        bNotFound = false;

        oCurrentListing.data = oAllListings.data[oCurrentListing.index];

        console.log("Saving KEY_CURRENT_LISTING entry");

        await oCommonStorage.SyncStorage.save(oCommonDefs.STORAGE_KEYS.KEY_CURRENT_LISTING, oCurrentListing);
      }
      else
      {
        oCurrentListing.index--;
        await oCommonStorage.SyncStorage.save(oCommonDefs.STORAGE_KEYS.KEY_COMPLETED_POSTING, oCurrentListing);

      }
    
   }//if oAllListings && oCurrentListing exist


  if( bNotFound)
  {

    // if( DEBUG )
    //   debugger;

    console.log("--------------------------------------");
    console.log("ERROR: Fourth mode error. Printing additional data:");
    console.log(" Current index: " + oCurrentListing.index + " |  All listings length: " + oAllListings.data.length);
    console.log(oCurrentListing);

    console.log("--------------------------------------");
    cleanupListings();
  }

  await sleep(3000);
  changeURL("https://accounts.craigslist.org/login/home");

}

async function getRepostTimeDelay()
{
  var oData = await getCurrentlyProcessingListing();

  var iMills = 2000;//3 seconds by default
  var MAX_MILLS = 20000;
  var START_DELAY_MILLS = 10000;//msec
  var numberOfRepostTries = 1;

  numberOfRepostTries = oData.numberOfRepostTries++;
 

  if( isValidListing(oData.dateCreated) )
  { 
      //scale the number of tries by 10/100.  

    if( numberOfRepostTries > 1 )
    {

      /*first delay between 10-16 seconds)

      */
     // (Math.random() * MAX_MILLS*numberOfRepostTries*0.5) + (START_DELAY_MILLS * numberOfRepostTries *0.5)
      iMills = Math.floor(Math.random() *
       (MAX_MILLS * (numberOfRepostTries*0.1))); 
    }

    await oCommonStorage.SyncStorage.save(oCommonDefs.STORAGE_KEYS.KEY_CURRENT_LISTING, oData);
  }



  return iMills;
}

// async function getRepostTimeDelay()
// {
//   var oData = await getCurrentlyProcessingListing();

//   var iMills = 1000;//3 seconds by default
//   var MAX_MILLS = 20000;
//   var numberOfRepostTries = 1;

//   numberOfRepostTries = oData.numberOfRepostTries++;
 

//   if( isValidListing(oData.dateCreated) )
//   { 
//       //scale the number of tries by 10/100.  

//       iMills = Math.floor(Math.random() *
//        (MAX_MILLS * (numberOfRepostTries*0.1))); 

//        SyncStorage.save(KEY_CURRENT_LISTING, oData);
//   }



//   return iMills;
// }

function sleepPromise(mills)
{
  return new Promise(resolve=>setTimeout(resolve, mills));

}

function sleep(mills)
{
  return sleepPromise(mills);
}
// async function sleep(mills)
// {
//   await sleepPromise(mills);
// }

async function getCurrentlyProcessingListing()
{
  var oData = null;

  oData = await oCommonStorage.SyncStorage.get(oCommonDefs.STORAGE_KEYS.KEY_CURRENT_LISTING);

  return oData;

}

async function getAllListings()
{
  var oData = null;

  oData = await oCommonStorage.SyncStorage.get(oCommonDefs.STORAGE_KEYS.KEY_ALL_LISTINGS);
 //oData = await getStoragePromise("craigslist_relister_renew_listings");

  return oData;

}

async function getNeverShowListings()
{
    var oData = null;
  
    oData = await oCommonStorage.SyncStorage.get(oCommonDefs.STORAGE_KEYS.KEY_NEVERSHOW_LISTINGS);
  
    return oData;
}


async function isContinueRepost(sStringSource)
{
 
  var oData = await getCurrentlyProcessingListing();

  if(DEBUG )
  {
    if(isVariableNotNull(oData))
      console.log("func isContinueRepost | oData.dateCreated: " + oData.dateCreated + " | stringSource=" + sStringSource +  ", title_no_price = " + oData.data.title_no_price);
  }

  if( isVariableNotNull(oData) && isValidListing(oData.dateCreated) &&
      compareStrings(sStringSource, oData.data.title_no_price))
  {
    console.log("Going along with reposting");
    return true;

  }

  console.log("WARNING: Reposting failed either due to dateCreated or string match fail.");

  return false;

}

function compareStrings(str1, str2)
{
  if(isVariableNotNull(str1)
     && isVariableNotNull(str2) 
    && str1.trim().toLowerCase() == str2.trim().toLowerCase())
    return true;

  return false;
}


  // Listen for messages from the popup
chrome.runtime.onMessage.addListener(function (msg, sender, response) {
  console.log("Received message");

  var res = {params: {}, listings:{}};

  // First, validate the message's structure
  if (msg.from ===  oCommonDefs.message_origin.POPUP 
    && msg.to === oCommonDefs.message_destination.CONTENT)
    {
    
    console.log("Received message from popup");

    if( msg.type === oCommonDefs.message_type.INITIAL_POPUP_LISTINGS)
    {
      oCommonStorage.SyncStorage.get(oCommonDefs.STORAGE_KEYS.KEY_PARAMS).then((data)=>
      {
        if( isVariableNull(data))
        {
          data = {};
          data[oCommonDefs.SAVED_PARAMS.SHOW_DELETED_LISTINGS] = false;
        }

        if( data[oCommonDefs.SAVED_PARAMS.SHOW_DELETED_LISTINGS])
        {
          res.params[oCommonDefs.SAVED_PARAMS.SHOW_DELETED_LISTINGS] = true;
          res.listings  = g_oExpiredAndDeleted;
        }
        else
        {
          res.params[oCommonDefs.SAVED_PARAMS.SHOW_DELETED_LISTINGS] = false;
          res.listings  = g_oExpiredOnly;
        }
        
        response(res);
      });
    }
    else if(msg.type === oCommonDefs.message_type.GET_LISTINGS )
    {
      // Directly respond to the sender (popup),
      // through the specified callback */
    // response(mapExpired);
      console.log("Received request or data from popup.  Sending in data");
      console.log(gDict);
     
      oCommonStorage.SyncStorage.save(oCommonDefs.STORAGE_KEYS.KEY_PARAMS, msg.value).then((message)=>{
        res.params = msg.value;
        res.listings  = g_oExpiredOnly;

        outputDebugLog(message);
        response(res);
      });
    

    }
    if(msg.type === oCommonDefs.message_type.GET_ALL_LISTINGS )
    {
      // Directly respond to the sender (popup),
      // through the specified callback */

      // parseListings(true).then((data)=>{
      //   console.log("Received request or data from popup.  Sending in data");
      //   console.log(data);
      //   response(data);
      // });
      oCommonStorage.SyncStorage.save(oCommonDefs.STORAGE_KEYS.KEY_PARAMS, msg.value).then((message)=>{
        res.params = msg.value;
        res.listings  = g_oExpiredAndDeleted;
        response(res);
      });

    }
    else if( msg.type === oCommonDefs.message_type.RENEW)
    {
        renewListings();
    }
    else if( msg.type === oCommonDefs.message_type.REPROCESS_LISTINGS)
    {
      //parseListings();
      reprocessListings(msg.payload);
      //parse out never to show listings or reload page??
    }
  }
  else if( msg.from == oCommonDefs.message_origin.BACKGROUND)
  {
    if( msg.type === oCommonDefs.message_type.RENEW)
    {
        renewListings(msg.payload);
    }
  }

    return true;
});

function reprocessListings(payload)
{
  if( isVariableNull(gDict) &&  gDict.length <  1)
    return;
    
  if( isVariableNotNull(payload) && isVariableNotNull(payload.aNeverShowURLS) && payload.aNeverShowURLS.length > 0)
  {
   
      payload.aNeverShowURLS.foreach((el)=>{
      
        if(DEBUG == true)
          console.log("Deleting from gDict by key: " + el);

        //gdict is keyed by URL's
        delete gDict[el];
      });
  }
}

function isValidListing(iMills)
{
  let dateCurr = null;
  let hoursElapsed = null;

  dateCurr = Date.now();
  hoursElapsed =  Math.floor((dateCurr - iMills)/1000)/3600;
  

  if( hoursElapsed <= 3)
    return true;

  return false;


}

async function renewListings(oAllListings = null, oCurrentListing = null)
{
  console.log("Function invoked: renewListings()");

  //check if there are available listings to go through
  //check the start time stamp
  //check the latest timestamp
  //check if the start timestamp is within 3-4 hours
  //if not then clear all
  //if it is then proceed through renewing the listing
  //let oAllListings = null;
  //let oCurrentListing = null;
  
  // await chrome.storage.local.get(storage_key, (response)=>{
  // });

  if( oAllListings == null)
    oAllListings = await getAllListings();
  
  
  
  if( oCurrentListing == null)
    oCurrentListing = await getCurrentlyProcessingListing();


  // let dateCurr = null;
  // let hoursElapsed = null;

  // dateCurr = Date.now();
  // hoursElapsed =  Math.floor((dateCurr - oData.dateCreated)/1000)/3600;
  

  if( isVariableNotNull(oAllListings) &&
    isValidListing(oAllListings.dateCreated) == false
   )
  {
    console.log("ERROR: function renewListings. Either oAllListings is null or dateCreated = false" );
    cleanupListings();
    // await chrome.storage.local.remove(storage_key, ()=>{
    //   console.log("Cleared storage from local storage");
    // });
  }
  else
  {
    
    let iIndex = 0;

    await oCommonStorage.SyncStorage.remove(oCommonDefs.STORAGE_KEYS.KEY_LAST_ERROR_DELAY_USED);

    //if oCurrentListing does not exist
    if( isVariableNotNull(oCurrentListing)== false)
    {
      console.log("Detected current listing does not exist.  Creating new current listing with index 0");
      oCurrentListing = {dateCreated: Date.now(), dateLastUpdated: Date.now(), numberOfRepostTries: 0, index: iIndex, data:  oAllListings.data[iIndex]}
    }

     if( isVariableNotNull(oAllListings.data[oCurrentListing.index]) 
        && isVariableNotNull(oCurrentListing.data) 
        && oCurrentListing.data.repost_url.length > 0
        && oAllListings.data[oCurrentListing.index].repost_url == oCurrentListing.data.repost_url)
      //var el = oData.data.pop();
     // oData.data.forEach((el)=>
      {
        let sRepostURL = oCurrentListing.data.repost_url;
        console.log("element title: " + oCurrentListing.data.title);
        console.log("trying to go to URL: " + oCurrentListing.data.repost_url);
    

        console.log("Saving KEY_CURRENT_LISTING entry");
        
        // if(DEBUG )
        //   debugger;

        await oCommonStorage.SyncStorage.save(oCommonDefs.STORAGE_KEYS.KEY_CURRENT_LISTING, oCurrentListing);

       // alert("About to change URL.  Index is : " + oCurrentListing.index);
        changeURL(sRepostURL);
    
      }//if URLS match
      else
      {
        console.log("Error:  URLS do not match.  Cleaning out the Keys for current listing and all the listings");
        cleanupListings();
        //debugger;
      }
  }
}


function escapeQuote(sString)
{
  var regex = /(['"])/g;
  //var sReplace = "\\" + "\1";
  var sReplace = "";

  return sString.replace(regex, sReplace);
}

function changeURL(sURL)
{
  window.location.href = sURL;

}

/**
 * JS Implementation of MurmurHash3 (r136) (as of May 20, 2011)
 * 
 * @author <a href="mailto:gary.court@gmail.com">Gary Court</a>
 * @see http://github.com/garycourt/murmurhash-js
 * @author <a href="mailto:aappleby@gmail.com">Austin Appleby</a>
 * @see http://sites.google.com/site/murmurhash/
 * 
 * @param {string} key ASCII only
 * @param {number} seed Positive integer only
 * @return {number} 32-bit positive integer hash 
 */

function murmurhash3_32_gc(key, seed) {
	var remainder, bytes, h1, h1b, c1, c1b, c2, c2b, k1, i;
	
	remainder = key.length & 3; // key.length % 4
	bytes = key.length - remainder;
	h1 = seed;
	c1 = 0xcc9e2d51;
	c2 = 0x1b873593;
	i = 0;
	
	while (i < bytes) {
	  	k1 = 
	  	  ((key.charCodeAt(i) & 0xff)) |
	  	  ((key.charCodeAt(++i) & 0xff) << 8) |
	  	  ((key.charCodeAt(++i) & 0xff) << 16) |
	  	  ((key.charCodeAt(++i) & 0xff) << 24);
		++i;
		
		k1 = ((((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16))) & 0xffffffff;
		k1 = (k1 << 15) | (k1 >>> 17);
		k1 = ((((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16))) & 0xffffffff;

		h1 ^= k1;
        h1 = (h1 << 13) | (h1 >>> 19);
		h1b = ((((h1 & 0xffff) * 5) + ((((h1 >>> 16) * 5) & 0xffff) << 16))) & 0xffffffff;
		h1 = (((h1b & 0xffff) + 0x6b64) + ((((h1b >>> 16) + 0xe654) & 0xffff) << 16));
	}
	
	k1 = 0;
	
	switch (remainder) {
		case 3: k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
		case 2: k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
		case 1: k1 ^= (key.charCodeAt(i) & 0xff);
		
		k1 = (((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
		k1 = (k1 << 15) | (k1 >>> 17);
		k1 = (((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;
		h1 ^= k1;
	}
	
	h1 ^= key.length;

	h1 ^= h1 >>> 16;
	h1 = (((h1 & 0xffff) * 0x85ebca6b) + ((((h1 >>> 16) * 0x85ebca6b) & 0xffff) << 16)) & 0xffffffff;
	h1 ^= h1 >>> 13;
	h1 = ((((h1 & 0xffff) * 0xc2b2ae35) + ((((h1 >>> 16) * 0xc2b2ae35) & 0xffff) << 16))) & 0xffffffff;
	h1 ^= h1 >>> 16;

	return h1 >>> 0;
}
// // // Inform the background page that
// // // this tab should have a page-action
// // chrome.runtime.sendMessage({
// //   from: 'content',
// //   subject: 'showPageAction'
// // });
