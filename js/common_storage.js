// export var KEY_ALL_LISTINGS = 'craigslist_relister_renew_listings';
// export var KEY_NEVERSHOW_LISTINGS = 'craigslist_relister_nevershow_listings';
// export var KEY_CURRENT_LISTING = 'craigslist_relister_current_listing';
// export var KEY_COMPLETED_POSTING = "craigslist_relister_completed_posting";

// export var message_origin = {
//     POPUP : "popup",
//     BACKGROUND: "background",
//     CONTENT: "content_script"
//   };
  
// export var message_destination = 
// {
//   CONTENT: "content",
//   BACKGROUND: "background"
// };


// export const message_type = {
//   RENEW: "renew_listing",
//   GET_LISTINGS: "get_listings",
//   GET_NEVER_SHOW: "get_nevershow_listings",
//   CLEAR_NEVER_SHOW_LISTINGS: "clear_nevershown_listings",
//   RESET_AND_INTERRUPT_POSTER: "reset_and_interput_poster",
//   REPROCESS_LISTINGS: "reprocess_listings"
// };

export var SyncStorage = 
{
    save: function(sKey, oValue) {
            return new Promise((resolve, reject)=>{
                // Check that there's some code there.
                if (!oValue) {
                    reject('Error: No value specified');
                    //return;
                }

                var o = new Object();
                o[sKey] = oValue;

                // Save it using the Chrome extension storage API.
                chrome.storage.local.set(o, function () {
                    // Notify that we saved.
                    console.log("We have saved all the settings!!! WohOOO");
                    resolve('Settings saved');
                });
        });
    },//save function

    get: function(sKey)
    {
        return new Promise((resolve, reject)=>
        {
            chrome.storage.local.get(sKey, function(result)
            {
              ///typeof val !== 'undefined' && val
                //the original object is keyed in the result by the key used in save
                //console.log(result);
                //resolve(('Value currently is ' + result.key));
                //(typeof result !== 'undefined' && ) ? 
                //resolve(result[sKey]);
                resolve(result.sKey);
            });

            // chrome.storage.local.get(['key'], function(result) {
            //     console.log('Value currently is ' + result.key);
            //   });
        });
    },

    removeAll: function()
    {
        chrome.storage.local.clear();
    },

    remove: function(sKey)
    {
      return new Promise((resolve, reject)=>
      {
        chrome.storage.local.remove(sKey,()=>{

          // if(typeof chrome.runtime.lastError == 'undefined')
          //   reject();
          // else
            resolve();
        } );
      });
    },

    getAll: function(result)
    {
        return new Promise((resolve, reject)=>
        {
            chrome.storage.local.get(null, function(result)
            {
                //the original object is keyed in the result by the key used in save
                //console.log(result);
                //resolve(('Value currently is ' + result.key));
                resolve(result);
            });

            // chrome.storage.local.get(['key'], function(result) {
            //     console.log('Value currently is ' + result.key);
            //   });
        });
    },

    getSize: function()
    {
        return new Promise((resolve, reject)=>
        {
            chrome.storage.local.getBytesInUse(null, (result)=>
            {
                //result is integer in bytes
                resolve(result);
            });
        });
    },

    subscribeToChanges: function () 
    {
            return new Promise((resolve, reject)=>
            {
                chrome.storage.onChanged.addListener((changes, namespace)=>
                {
                    resolve(changes);
                });
            });

    }
}