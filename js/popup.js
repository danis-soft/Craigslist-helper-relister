// Extension.IS_POPUP = true;
// clearInterval(timerCheckDisplayWindow);
//$(resx_string_ID.INTERNAL.wnd_options).show();

/*REM - This file is part of Craigslist submitter*/

// class CParams{
//     bShowDeletedListings = false;
  
//     // constructor(obj)
//     // {
//     //   //obj && Object.assign(this, obj);
//     //   Object.assign(this, obj);
//     // }
//   }


var DEBUG = true;
var gListingToRenew = null;
const INCLUDE_DELETED_LISTING_PARAM_NAME = "set_include_deleted_listings_flag";

var g_CRAIGSLIST_URL = "https://accounts.craigslist.org/login/home";

const POPUP_UI = Object.freeze(
{
    CHECKBOX_INCLUDE_DELETED: "#chkShowDeleted",
    LBL_INCLUDE_DELETED: "#lblShowDeleted"
});

var oCommonDefs = require("./common_defs.js");

var outputDebugLog = oCommonDefs.outputDebugLog;

//var g_oParams = {};

let g_oParams = null;///= new oCommonDefs.CParams();

const TARGET_CONTAINER = "#content_container";


/* Once the DOM is ready... */
window.addEventListener('DOMContentLoaded', function () {
    /* ...query for the active tab... */
    if (DEBUG == true)
        console.log("initiating event listener");
    // chrome.tabs.query({
    //     active: true,
    //     currentWindow: true
    // }, function (tabs) {
    //     console.log("sending a message from popup to the content script to give us data!");
    //     /* ...and send a request
    //      for the DOM info... */
    //     // chrome.tabs.sendMessage(
    //     //         tabs[0].id,
    //     //         { from: 'popup', subject: 'DOMInfo' },
    //     //         /* ...also specifying a callback to be called
    //     //          *    from the receiving end (content script) */
    //     //         setDOMInfo);

    getListingsFromContent(true);

    setupCommonHandlers();
    
});



/* Update the relevant fields with the new data */
function processResponse(info) {

    outputDebugLog("function: processResponse()");

    gListingToRenew  = info;



    if( isVariableNotNull(info))
    {
  
        outputDebugLog("received message from content script: ");
        outputDebugLog(info);
        outputDebugLog(typeof info);


        //params property contains any special parameters we send down, besides the listings
        if( isVariableNotNull(info.params))
        {
            processParams(info.params);
           // delete info.params;
        }

        if ( isVariableNotNull(info.listings) && Object.keys(info.listings).length > 0)
        {
            showListings(info.listings);
        }
        else
        {
            showNoListings();
        }
    }

}

/*
@params: oParams: Object
*/
function processParams(oParams)
{

     //g_oParams = oParams;

     applySavedSettings(oParams);

}


function applySavedSettings(params)
{

    outputDebugLog("Begin applySavedSettings func");

    if( isVariableNotNull(params[oCommonDefs.SAVED_PARAMS.SHOW_DELETED_LISTINGS])
        &&  params[oCommonDefs.SAVED_PARAMS.SHOW_DELETED_LISTINGS])
        {
            outputDebugLog("Outputting params:");
            outputDebugLog(params);
            $(POPUP_UI.CHECKBOX_INCLUDE_DELETED).prop('checked', true);
        }
}


function setupCommonHandlers()
{
    $(POPUP_UI.CHECKBOX_INCLUDE_DELETED).on('change', function(){


        var bChecked = $(POPUP_UI.CHECKBOX_INCLUDE_DELETED).prop('checked');

        // if( bChecked)
        //     $(POPUP_UI.LBL_INCLUDE_DELETED).text("Hide deleted listings.");
        // else
        //     $(POPUP_UI.LBL_INCLUDE_DELETED).text("Show deleted listings.");

        outputDebugLog("Hide/Show deleted listings clicked.  Sending out the message to get new listings.");
        
        
        if( bChecked )
        {
            sendMessage( oCommonDefs.message_type.GET_ALL_LISTINGS, oCommonDefs.message_origin.POPUP, 
                oCommonDefs.message_destination.CONTENT, {[oCommonDefs.SAVED_PARAMS.SHOW_DELETED_LISTINGS]: true}, processResponse, null);
        }
        else
        {
            sendMessage( oCommonDefs.message_type.GET_LISTINGS, oCommonDefs.message_origin.POPUP, 
                oCommonDefs.message_destination.CONTENT, {[oCommonDefs.SAVED_PARAMS.SHOW_DELETED_LISTING]: false}, processResponse, null);
        }
    });

}



function preProcessListings(info)
{
    gListingToRenew = info;

  sendMessage({eMsgType: oCommonDefs.message_type.GET_NEVER_SHOW, eMsgDest:  oCommonDefs.message_destination.BACKGROUND, eMsgOrg:  oCommonDefs.message_origin.POPUP, value: null},
    );
}

/*1st page:
URL + "&action=repost"
https://post.craigslist.org/manage/6874012517&action=repost

2nd page = edit post
To continue
(hidden variable retrieve):$("input.cryptedStepCheck").val()
submit a form
$("form#postingForm").submit();

3rd page - review
$("form#publish_top").submit();
*/

function showListings(info)
{

    outputDebugLog("function showListings(): BEGIN");

    var iTabID;
    
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, (tabs)=> {
        /* ...and send a request for the DOM info... */
        iTabID = tabs[0].id;
    });

    //message format
    //: {"Gila PB78 Privacy Residential Window Tint Film, Black " => Object}
/*key: "Gila PB78 Privacy Residential Window Tint Film, Black "
value:
repost_url: "https://post.craigslist.org/manage/6855471476"
title: "Gila PB78 Privacy Residential Window Tint Film, Black - $7"
*/

    var sData = "";

    sData = "<table height=\"80%\" width=\"500px\" border=\"1\">";
    
    if( DEBUG == true )
    {
        console.log(info);
        console.log(typeof info);
    }



    var arColors = ["#e1e3fa", "#ffffff"];
    var iCurrColor = 0;
    var sHeaderColor = "#BEC0BF";
    var bHeaderMade = false;
    var iIndex = 0;

    for (var key in info) {

        if (info.hasOwnProperty(key)) {
            

            //add header one time
            if( bHeaderMade == false)
            {
                bHeaderMade = true;
                sData += "<tr height=\"5%\" class='header'>";
                sData += `<th><input type=\"checkbox\" id=\"checkall_items_renew\" name=\"checkall_renew\" class=\"listing_control\" value=\"checkall\"><label for='checkall_items_renew'>Renew</label></th>`;
                sData += `<th class=\"listing_control\">Name of the listing</th>`;
                sData += `<th><input type=\"checkbox\" id=\"checkall_items_nevershow\" name=\"checkall_nevershow\" class=\"listing_control\" value=\"checkall\"><label for='checkall_items_nevershow'>Never show</label></th>`;
                sData += "</tr>";
                iCurrColor = ++iCurrColor % arColors.length;
            }

            if( DEBUG == true )
                console.log(key + ":" + info[key]);

            sData += `<tr id=\"${iIndex}_listing\">`;
            sData += `<td class=\"col_renew_check\" bgcolor=\"${arColors[iCurrColor]}\"><input type=\"checkbox\" name=\"item_renew\" class=\"listing_renew\" value=\"${(key)}\"></td>`;
            sData += `<td class=\"listing_title\" bgcolor=\"${arColors[iCurrColor]}\">${info[key].title}</td>`;
            sData += `<td bgcolor=\"${arColors[iCurrColor]}\"><input type=\"checkbox\" name=\"item_nevershow\" class=\"listing_nevershow\" value=\"${(key)}\"></td>`;


            sData += "</tr>";
            iCurrColor = ++iCurrColor % arColors.length;
        }
    }
    
   // });

   
    sData += "</table>";
    sData +="<p><input type=\"button\" id=\"btnSubmit\" value=\"Submit\"></input>";
    sData +="<input type=\"button\" id=\"btnClearNeverShown\" value=\"Reset never shown items\"></input></p>";
  //  sData +="<p><input type=\"checkbox\" id=\"chkShowDeleted\" value=\"Show deleted items\"><span id='lblShowDeleted'>Show deleted items</span></input></p>";

    showContent(sData);

    doShowLoading(false);

    var aRenewURLS = new Array();
    var aNeverShowURLS = new Array();

    $(".listing_nevershow").on('change', function()
    {
        var bAction =  $(this).prop('checked');

        var oParent = $(this).parent().parent();

       
        oParent.find(".listing_renew").prop("disabled", bAction);  //disable checkbox for renew

        if(bAction)
        {

            oParent.find(".listing_renew").prop("checked", false);
            oParent.addClass("nevershow");
        }
        else
        {
            oParent.removeClass("nevershow");
        }

    });

    $("#checkall_items_renew").on('change', function(){
       var bGlobalAction  = $("#checkall_items_renew").prop('checked');// this.checked;//$(this).prop('checked');// $(this).is(':checked');//this.checked;

     if( DEBUG == true)
       console.log("Global Action: " + bGlobalAction);

       $('input:checkbox.listing_renew').each(function(){
            $(this).prop("checked", bGlobalAction);

          
       });
    });

    $("#checkall_items_nevershow").on('change', function(){
        var bGlobalAction  = $("#checkall_items_nevershow").prop('checked');// this.checked;//$(this).prop('checked');// $(this).is(':checked');//this.checked;
 
        $("#checkall_items_renew").prop('checked', false);
        $("#checkall_items_renew").prop("disabled", bGlobalAction);

      if( DEBUG == true)
        console.log("Global Action: " + bGlobalAction);
 
        $('input:checkbox.listing_nevershow').each(function(){
            $(this).prop("checked", bGlobalAction);

            var oParent = $(this).parent().parent();


            oParent.find(".listing_renew").prop("disabled", bGlobalAction);  //disable checkbox for renew

            if(bGlobalAction)
            {

                oParent.find(".listing_renew").prop("checked", false);
                oParent.addClass("nevershow");
            }
            else
            {
                oParent.removeClass("nevershow");
            }
        });
     });
 

    // console.log("showing chk showdleted");
    // console.log( $("#chkShowDeleted"));

    //  $("#chkShowDeleted").on('change', function(){

    //     var bChecked = $("#chkShowDeleted").prop('checked');

    //     if( bChecked)
    //         $("#lblShowDeleted").text("Hide deleted listings.");
    //     else
    //         $("#lblShowDeleted").text("Show deleted listings.");

    //    // sendMessage( oCommonDefs.message_type.CLEAR_NEVER_SHOW_LISTINGS, oCommonDefs.message_origin.POPUP, oCommonDefs.message_destination.BACKGROUND,null, null);

    // });



    $("#btnClearNeverShown").click(()=>{
       
        sendMessage( oCommonDefs.message_type.CLEAR_NEVER_SHOW_LISTINGS, oCommonDefs.message_origin.POPUP, oCommonDefs.message_destination.BACKGROUND,null, null);

    });


    $("#btnSubmit").click(()=>{
       // alert("button clicked");

       aRenewURLS.length = 0;
       aNeverShowURLS.length = 0;

        aRenewURLS = getListings('input:checkbox.listing_renew', info);
        aNeverShowURLS = getListings('input:checkbox.listing_nevershow', info);


        if( aRenewURLS.length > 0 ||
            aNeverShowURLS.length > 0)
        {

            if( DEBUG == true)
            {
                console.log("sending a message to BACKGROUND from POPUP with RENEW subject");
            //sendMessage(message_origin.POPUP, message_destination.BACKGROUND, message_type.RENEW, {active_tab: iTabID, payload: aURLS} );
                console.log("There are " +  aRenewURLS.length + " items in aUrls array");
            }

            if( aRenewURLS.length > 0 )//if we have actual listings to renew
                sendMessage( oCommonDefs.message_type.RENEW, oCommonDefs.message_origin.POPUP, oCommonDefs.message_destination.BACKGROUND, {active_tab: iTabID, payload: {renew: aRenewURLS, nevershow: aNeverShowURLS}}, null);
            else if( aNeverShowURLS.length > 0 )//we only have never show listings
                sendMessage( oCommonDefs.message_type.REPROCESS_LISTINGS, oCommonDefs.message_origin.POPUP, oCommonDefs.message_destination.BACKGROUND, {active_tab: iTabID, payload: {renew: aRenewURLS, nevershow: aNeverShowURLS}}, null);

        }
    });

}

function escapeQuote(sString)
{
  var regex = /(['"])/g;
  //var sReplace = "\\" + "\1";
  var sReplace = "";

  return sString.replace(regex, sReplace);
}

function getListings(sSelector, dictSource)
{
    var aURLS = [];

    $(sSelector).each(function () {

        if( this.checked)
        {
            //var sThisVal = (this.checked ? $(this).val() : "");
            var sThisVal = $(this).val();
            var par = $(this).parent().html();

            if( DEBUG == true)
            {
                console.log("Parent: " + par);
                console.log("Checkbox checked for value: " + sThisVal);
            }
        
            aURLS.push(dictSource[sThisVal]);      
        }
    });

    return aURLS;

}

function showContent(sContent)
{

    $(TARGET_CONTAINER).empty();
    outputDebugLog("Appending content to the container: " + TARGET_CONTAINER );
    $(sContent).appendTo(TARGET_CONTAINER);
}

function showNoListings()
{
   
    outputDebugLog("function showNoListings(): BEGIN");

    var sData = "";
    
    sData += "<div><b>No listings found!</b></div>";
    sData += "<div><p>Only expired listings that were not deleted previously are shown by default. Please note that sometimes the status may show the listings as expired even though it was also deleted afterward.";
    sData += "<p>You can use the checkbox below to force showing the previously deleted listings</p></p></div>";

    sData +="<input type=\"button\" id=\"btnResetEverything\" value=\"Reset Craigslist reposter\"></input>";
    showContent(sData);

    doShowLoading(false);
 

    $("#btnResetEverything").click(()=>{
        console.log("sending RESET_AND_INTERRUPT_POSTER message to background");
        sendMessage( oCommonDefs.message_type.RESET_AND_INTERRUPT_POSTER, oCommonDefs.message_origin.POPUP, oCommonDefs.message_destination.BACKGROUND,null, null);

    });

}

// function processResponse(message)
// {
//     console.log(message);
// }

function sendMessageToActiveTabIfValidURL(eMsgType, eMsgOrigin, eMsgDest, sParam, funcCallback, funcCallBackNoValidURL)
{
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, (tabs)=> {
        /* ...and send a request for the DOM info... */
        var sTargetPage = /((http)(s)?:\/\/)?(accounts|post).craigslist.org\/.*/;
        var tab = tabs[0];

        if(isVariableNotNull(tab))
        {
            if( tab.url.search(sTargetPage) > -1)
            {
                chrome.tabs.sendMessage(
                    tab.id,
                    { from: eMsgOrigin, to: eMsgDest, type: eMsgType, value: sParam},
                    /* ...also specifying a callback to be called
                    *    from the receiving end (content script) */
                    funcCallback);
           
            
            }//if( url.search(sTargetPage) > -1)
            else if( isVariableNotNull(funcCallBackNoValidURL))
            {
                funcCallBackNoValidURL();
            }
        }// if(isVariableNotNull(tab))
        

    });//chrome.tabs.query callback function
        
}//sendMessageToActiveTab


function sendUserToCraigsListAccount()
{
    chrome.tabs.create({active: true, url: g_CRAIGSLIST_URL}, (tab)=>{
        //sleep(3000);

    });
}

function sendMessage( eMsgType, eMsgOrg, eMsgDest, sParam, funcCallback,funcCallBackNoValidURL)
{

    if(eMsgDest == oCommonDefs.message_destination.BACKGROUND)
        chrome.runtime.sendMessage({from: eMsgOrg, to: eMsgDest, type: eMsgType, value: sParam}, funcCallback);
    else if(eMsgDest == oCommonDefs.message_destination.CONTENT )
        sendMessageToActiveTabIfValidURL(eMsgType, eMsgOrg, eMsgDest, sParam, funcCallback,funcCallBackNoValidURL);

}

function isVariableNotNull(val)
{
  if(typeof val !== 'undefined' && val) 
  {
    return true;
  }

  return false;
}


function doShowLoading(bShow = true)
{
    if(bShow)
    {
        $("#loading_image").show("medium");
    }
    else
    {
        $("#loading_image").hide("slow");
    }    
}

function showForNoCraiglist()
{

    window.close();   // Closes the new window

    // var sData = "";
    
    // sData = "<div>Please visit your <a id='linkSendToCraigslist' href='#'>account page</a>";   
    // sData+=" on craigslist.org to view the listings.</div>";


    // showContent(sData);

    // $("#linkSendToCraigslist").click(()=>{
    //     sendUserToCraigsListAccount();
    // });

}

function sleepPromise(mills)
{
  return new Promise(resolve=>setTimeout(resolve, mills));

}

function sleep(mills)
{
  return sleepPromise(mills);
}

function getListingsFromContent(bInitial, bIncludeDeleted = false)
{
    let params = {};
    let messageType = oCommonDefs.message_type.GET_LISTINGS;


    if( bInitial)
       messageType = oCommonDefs.message_type.INITIAL_POPUP_LISTINGS;
      
    else if(bIncludeDeleted )
        messageType = oCommonDefs.message_type.GET_ALL_LISTINGS;

    sendMessage(messageType, oCommonDefs.message_origin.POPUP, oCommonDefs.message_destination.CONTENT,
        params, processResponse, showForNoCraiglist);
}
