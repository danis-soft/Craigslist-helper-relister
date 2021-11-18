/*REM - This file is part of Craigslist submitter*/
var DEBUG = true;


var oCommonDefs = require("./js/common_defs.js");
var oCommonStorage = require("./js/common_storage.js");


function checkURLAndDisable(tabId, changeInfo, tab)
{

  var sTargetPage = /((http)(s)?:\/\/)?(accounts|post).craigslist.org\/.*/;



  chrome.tabs.query({
    active: true,
    currentWindow: true
  }, function(tabs) {

    var tab = tabs[0];

    if( isVariableNotNull(tab))
    {
        var url = tab.url;

        if( url.search(sTargetPage) > -1)
        {
          chrome.browserAction.setIcon({path:"icon.png"});
        }
        else
          chrome.browserAction.setIcon({path:"icon_greyed_out.png"});


      }// isVariableNotNull(tab))
      else
        chrome.browserAction.setIcon({path:"icon_greyed_out.png"});
    });//chrome.tab.query
}


function isVariableNotNull(val)
{
  if (typeof val !== 'undefined' && val) 
  {
    return true;
  }

  return false;
}

function isVariableNull(val)
{
  return !isVariableNotNull(val);
}

function checkForValidUrl(tabId, changeInfo, tab) {
    //var sTargetPage = /((http)(s)?:\/\/)?(accounts|post).craigslist.org\/login\/home/;
    var sTargetPage = /((http)(s)?:\/\/)?(accounts|post).craigslist.org\/.*/;
   //var sTargetPage = /((http)(s)?:\/\/)?.*craigslist\.org\/.*/;

  // https://accounts.craigslist.org/login/home

//accounts.craigslist.org/login/home
    var sURL = tab.url;

    console.log("function checkForValidUrl()");
    console.log("printing from tab.url:")
    console.log(sURL);


   chrome.tabs.query({
    active: true,
    currentWindow: true
  }, function(tabs) {

    var tab = tabs[0];

    if( tab !== undefined)
    {
        var url = tab.url;

        if( url.search(sTargetPage) > -1)
        {
            console.log("successful URL match checkForValidUrl");
            console.log("injecting content script into page");

            chrome.pageAction.show(tabId);
            chrome.tabs.executeScript(tab.id, {file: "jquery-2.1.1.min.js"});

            chrome.tabs.executeScript(tab.id, {file: "content_script.js"});
        }

        console.log("printing from chrome.tabs.query:")
        console.log(url);
    }
 });

};


function sendMessageToActiveTab(tabsId, eMsgType, eMsgOrigin, eMsgDest, sParam, funcCallback)
{
        chrome.tabs.sendMessage(
                tabsId,
                { from: eMsgOrigin, to: eMsgDest, type: eMsgType, value: sParam},
                /* ...also specifying a callback to be called
                 *    from the receiving end (content script) */
                funcCallback);
        //sendMessage(message_origin.POPUP, eMsgDest, sSubject, sParam, funcCallback); 
}

chrome.runtime.onMessage.addListener(
  async function(request, sender, sendResponse) {

    console.log("get some message in the background");

    if( request.to === oCommonDefs.message_destination.BACKGROUND )
    {
      console.log(sender.tab ?
                  "from a content script:" + sender.tab.url :
                  "from the extension");


      if( request.from === oCommonDefs.message_origin.POPUP)
      {
        if(request.type  === oCommonDefs.message_type.CLEAR_NEVER_SHOW_LISTINGS )
        {
            oCommonStorage.SyncStorage.remove(oCommonDefs.STORAGE_KEYS.KEY_NEVERSHOW_LISTINGS);
        }
        else if( request.type === oCommonDefs.message_type.RESET_AND_INTERRUPT_POSTER){
          interruptPostingProcess();
        }
        else if( request.type  === oCommonDefs.message_type.REPROCESS_LISTINGS )
        {
          if( isVariableNotNull(request.value.payload.nevershow) &&  request.value.payload.nevershow.length > 0)
          {
            await saveNeverShowData(request.value.payload.nevershow);
          }

        }
        else if( request.type  === oCommonDefs.message_type.RENEW )
        {
          if( isVariableNull(request.value.payload) )
          {
            console.log("No payload information detected");
            return;
          }

          var iActiveTab = request.value.active_tab;

          /*
          payload: {renew: aRenewURLS, nevershow: aNeverShowURLS}
          */

          //iActiveTab = request.payload.active_tab;
          console.log("received message from POPUP");
          console.log(request.value.payload);
          chrome.storage.local.clear(()=>{});

         

          oRenewData = { dateCreated: Date.now(), dateAccessed: Date.now(), data: request.value.payload.renew};
        
          await saveNeverShowData(request.value.payload.nevershow);

        

          if( request.value.payload != null &&
            request.value.payload.renew != null 
            && request.value.payload.renew.length > 0)
          {
      

            var dateCreated;
            var dateAccessed;
            var oRenewData = null;
            var oNeverShowData = null;

            oRenewData = { dateCreated: Date.now(), dateAccessed: Date.now(), data: request.value.payload.renew};

            oCommonStorage.SyncStorage.save(oCommonDefs.STORAGE_KEYS.KEY_ALL_LISTINGS, oRenewData).then(()=>
            {

              if( DEBUG )
              {
                console.log("Stored the following data:");
                console.log("Date Created: " + oRenewData.dateCreated);
                console.log("Date accessed" + oRenewData.dateAccessed);
                console.log("Data: " + oRenewData.data);
              }

              sendMessageToActiveTab(iActiveTab,oCommonDefs.message_type.RENEW, oCommonDefs.message_origin.BACKGROUND,
                oCommonDefs.message_destination.CONTENT, {}, null);
            });

        
          }//if payload is defined
        }//if message is RENEW
    }//if message from popup
      else if( request.from === oCommonDefs.message_origin.CONTENT &&
        request.type  === oCommonDefs.message_type.FINISHED )
        {
          oCommonStorage.SyncStorage.get(oCommonDefs.STORAGE_KEYS.KEY_ALL_LISTINGS).then((oData)=>
          {
            if( oData != null &&
              oData.data.length > 1)
            {
              sendMessageToActiveTab(iActiveTab, oCommonDefs.message_type.RENEW, oCommonDefs.message_origin.BACKGROUND,
                oCommonDefs.message_destination.CONTENT, {}, null);
            }  
          }
           );


        
        }

        // request.value.payload.forEach((el)=>{
        //   console.log("trying to go to URL: " + el);
        //   console.log("sender: ");
        //   console.log(sender);




          //set authorization token for each URL
          //process the ID of the URL assigned by craigslist
        //  var sMatch = /\/manage\/(\d+)?/;
      //    var arr = el.match(sMatch);

          // if( arr != null && arr.length > 0 )
          // { 
          //  // title, repost_url

          //  // el.title

          //  await chrome.storage.local.set({dateCreated: , dateAccessed: , payload: payload}, function() {

          //   //      console.log("stored authorization code in Chrome storage: ")
          //   //      console.log(dictPersist);
              
          //   //   });

          //   sendMessageToActiveTab(iActiveTab, message_type.RENEW, message_origin.BACKGROUND,
          //     message_destination.CONTENT, {}, null);
            //  console.log("match for the ID: " + arr[1]);

            //   var dictPersist = new Object();
            //   dictPersist[arr[1]] = (new Date()).valueOf().toString();
            //   //chrome.storage.sync.set({authorization_codes: [{ id: arr[1], time: new Date()}]}, function() {
            //   //  chrome.storage.sync.set(arr[1]: [{ id: arr[1], time: new Date()}]}, function() {
                 
            //   chrome.storage.local.set(dictPersist, function() {

            //      console.log("stored authorization code in Chrome storage: ")
            //      console.log(dictPersist);
              
            //   });

            // //   chrome.storage.local.set({'test':"bla bla bla"}, function() {

            // //     console.log("stored authorization code in Chrome storage: ")
            // //    // console.log(dictPersist);
             
            // //  });


            //   chrome.storage.local.get(null, function(obj){
            //     console.log(obj);
            //   //  console.log(obj[arr[1]]);

            //   });

              
            //   // chrome.storage.local.get('test', function(obj){
            //   //   console.log(obj);
            //   //   console.log(obj[arr[1]]);

            //   // });

            //   chrome.storage.local.get(arr[1], function(obj){
            //     //console.log(obj);
            //     console.log(obj[arr[1]]);

            //   });


          }
          


      //    chrome.tabs.update(request.value.active_tab, {url: el});
          //chrome.tabs.executeScript(request.value.active_tab, {file: "content_script.js"});
     //   });

     
    
  // if (request.url == "hello")
    //sendResponse({farewell: "goodbye"});
});


// function saveDataPromise(sKey, oValue) {
//     return new Promise((resolve, reject)=>{
//         // Check that there's some code there.
//         if (!oValue) {
//             reject('Error: No value specified');
          
//         }

//         var o = new Object();
//         o[sKey] = oValue;

//         // Save it using the Chrome extension storage API.
//         chrome.storage.local.set(o, function () {
//             // Notify that we saved.
//             console.log("We have saved all the settings!!! WohOOO");
//             resolve('Settings saved');
//         });
//   });
// }//save function


async function saveNeverShowData(oNewNeverShowData, bExisting)
{
  
  var oNeverShowData = null;
  oNeverShowData =  await oCommonStorage.SyncStorage.get(oCommonDefs.STORAGE_KEYS.KEY_NEVERSHOW_LISTINGS);

  if( isVariableNotNull(oNewNeverShowData) && oNewNeverShowData.length > 0 )
  {
    //we already got some existing data, append
    if( isVariableNotNull(oNeverShowData) && oNeverShowData.data.length > 0 )
    {
        if( DEBUG == true )
          console.log("Detected existing never show listing data.  Appending new data to the existing data");
        
        Array.prototype.push.apply(oNeverShowData.data, oNewNeverShowData);
        
    }
    else
    {
      oNeverShowData = { dateCreated: Date.now(), dateAccessed: Date.now(), data: oNewNeverShowData};
    }

    oCommonStorage.SyncStorage.save(oCommonDefs.STORAGE_KEYS.KEY_NEVERSHOW_LISTINGS, oNeverShowData).then(()=>
      {
        console.log("Stored never show listings data");
      }
    );
  }

}

chrome.tabs.onUpdated.addListener(checkURLAndDisable);

chrome.tabs.onHighlighted.addListener(checkURLAndDisable);

  // Listen for any changes to the URL of any tab.
//chrome.tabs.onUpdated.addListener(checkForValidUrl);
//For highlighted tab as well
//chrome.tabs.onHighlighted.addListener(checkForValidUrl);
//chrome.tabs.onHighlighted.addListener(

chrome.tabs.onActivated.addListener(checkURLAndDisable);
chrome.tabs.onActiveChanged.addListener(checkURLAndDisable);


// chrome.runtime.onInstalled.addListener(function() {
//    // chrome.storage.sync.set({color: '#3aa757'}, function() {
//    //   console.log('The color is green.');
//    // });
//    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
//      chrome.declarativeContent.onPageChanged.addRules([{
//        conditions: [new chrome.declarativeContent.PageStateMatcher({
//          pageUrl: {hostEquals: 'accounts.craigslist.org/login/home', schemes: ["http", "https"]},
//         // css: ["footer"]
//        })
//        ],
//            actions: [new chrome.declarativeContent.ShowPageAction()]
//      }]);
//    });
//  });

function interruptPostingProcess()
{

  console.log("Deleting KEY_ALL_LISTINGS and KEY_CURRENT_LISTING");
  Promise.allSettled([oCommonStorage.SyncStorage.remove(oCommonDefs.STORAGE_KEYS.KEY_ALL_LISTINGS), oCommonStorage.SyncStorage.remove(oCommonDefs.STORAGE_KEYS.KEY_CURRENT_LISTING)]);

}
